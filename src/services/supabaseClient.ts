import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CorporateEvent } from '../types/calendar';
import { IntegrationSession, UnitInfo } from '../types/schedule';

export const DEFAULT_SUPABASE_URL = 'https://tgmjghxytbwafhrxdkyl.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_2BYXec4XhnmlsYG9rKhxNQ_9Yq_MY4c';

export const SECRET_ADMIN_PASSWORD = 'GGFST';

export function getSupabaseCredentials() {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '';
  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

  const url = localStorage.getItem('app_supabase_url') || envUrl || DEFAULT_SUPABASE_URL;
  const key = localStorage.getItem('app_supabase_key') || envKey || DEFAULT_SUPABASE_KEY;
  return { url, key };
}

export function saveSupabaseCredentials(url: string, key: string) {
  localStorage.setItem('app_supabase_url', url);
  localStorage.setItem('app_supabase_key', key);
  cachedClient = null;
  currentClientKey = '';
}

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  const signature = `${url}::${key}`;

  if (cachedClient && currentClientKey === signature) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    currentClientKey = signature;
    return cachedClient;
  } catch (err) {
    console.error('Failed to init Supabase client', err);
    return null;
  }
}

// ==========================================
// 1. CALENDÁRIO CORPORATIVO (TABLE: events)
// ==========================================

export async function fetchEventsFromSupabase(): Promise<{ data: CorporateEvent[] | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: new Error('Cliente Supabase não inicializado') };
  }

  try {
    const { data, error } = await client.from('events').select('*');
    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const mapped: CorporateEvent[] = (data || []).map((item: any) => ({
      id: String(item.id),
      date: item.date,
      title: item.title,
      startTime: item.startTime || item.starttime || '08:00',
      endTime: item.endTime || item.endtime || '09:00',
      duration: item.duration || '',
      category: item.category || 'Geral',
      location: item.location || '',
      description: item.description || '',
    }));

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function upsertEventToSupabase(evt: CorporateEvent): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Cliente Supabase não inicializado') };

  const payload = {
    id: String(evt.id),
    date: String(evt.date || ''),
    title: String(evt.title || ''),
    starttime: String(evt.startTime || '08:00'),
    endtime: String(evt.endTime || '09:00'),
    duration: String(evt.duration || ''),
    category: String(evt.category || 'Geral'),
    location: String(evt.location || ''),
    description: String(evt.description || ''),
  };

  try {
    let res = await client.from('events').upsert(payload);
    if (res.error && res.error.message && res.error.message.includes('ON CONFLICT')) {
      await client.from('events').delete().eq('id', String(evt.id));
      res = await client.from('events').insert(payload);
    }
    if (res.error) {
      return { error: new Error(res.error.message) };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

export async function deleteEventFromSupabase(id: string): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Cliente Supabase não inicializado') };

  try {
    const { error } = await client.from('events').delete().eq('id', String(id));
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

// =========================================================================
// 2. CRONOGRAMA DE INTEGRAÇÃO (TABLE: integration_sessions)
// =========================================================================

export async function fetchIntegrationFromSupabase(): Promise<{ data: IntegrationSession[] | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Cliente Supabase não inicializado') };

  try {
    const { data, error } = await client.from('integration_sessions').select('*');
    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const mapped: IntegrationSession[] = (data || []).map((item: any) => ({
      id: String(item.id),
      dia: Number(item.dia) || 1,
      startTime: item.startTime || item.starttime || '08:00',
      endTime: item.endTime || item.endtime || '09:00',
      horarioText: item.horarioText || item.horariotext || `${item.startTime || '08:00'} às ${item.endTime || '09:00'}`,
      ch: item.ch || '1h',
      tema: item.tema || '',
      area: item.area || 'GENTE E GESTÃO',
      responsavel: item.responsavel || '',
      prn: item.prn || '',
      local: item.local || 'Sala de Integração',
      codigo: item.codigo || '',
      entregavel: item.entregavel || '',
      customColor: item.customColor || item.customcolor || undefined,
    }));

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function syncIntegrationToSupabase(sessions: IntegrationSession[]): Promise<{ count: number; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { count: 0, error: new Error('Cliente Supabase não inicializado') };

  try {
    let successCount = 0;
    for (const s of sessions) {
      const payload = {
        id: String(s.id),
        dia: Number(s.dia),
        starttime: s.startTime,
        endtime: s.endTime,
        horariotext: s.horarioText || `${s.startTime} às ${s.endTime}`,
        ch: s.ch,
        tema: s.tema,
        area: s.area,
        responsavel: s.responsavel || '',
        prn: s.prn || '',
        local: s.local || '',
        codigo: s.codigo || '',
        entregavel: s.entregavel || '',
        customcolor: s.customColor || null,
      };

      const res = await client.from('integration_sessions').upsert(payload);
      if (!res.error) {
        successCount++;
      }
    }
    return { count: successCount, error: null };
  } catch (err: any) {
    return { count: 0, error: err };
  }
}

// =========================================================================
// 3. DIAGNÓSTICO INTEGRADO (VERIFICAÇÃO SUPABASE + VERCEL)
// =========================================================================

export interface CloudDiagnostics {
  status: 'connected' | 'partial' | 'disconnected';
  url: string;
  projectRef: string;
  eventsTableStatus: 'ok' | 'missing' | 'error';
  eventsCount: number;
  integrationTableStatus: 'ok' | 'missing' | 'error';
  integrationCount: number;
  errorMessage: string | null;
  vercelReady: boolean;
  sqlSnippet: string;
}

export async function testFullConnectivity(): Promise<CloudDiagnostics> {
  const { url, key } = getSupabaseCredentials();
  const projectRef = url.replace('https://', '').split('.')[0] || 'tgmjghxytbwafhrxdkyl';
  const client = getSupabaseClient();

  const diagnostics: CloudDiagnostics = {
    status: 'disconnected',
    url,
    projectRef,
    eventsTableStatus: 'missing',
    eventsCount: 0,
    integrationTableStatus: 'missing',
    integrationCount: 0,
    errorMessage: null,
    vercelReady: true,
    sqlSnippet: getSqlSetupScript(),
  };

  if (!client) {
    diagnostics.errorMessage = 'Não foi possível instanciar o cliente Supabase';
    return diagnostics;
  }

  try {
    // Test 1: Events table
    const { data: evData, error: evErr } = await client.from('events').select('id');
    if (!evErr) {
      diagnostics.eventsTableStatus = 'ok';
      diagnostics.eventsCount = evData ? evData.length : 0;
    } else {
      diagnostics.eventsTableStatus = evErr.message.includes('does not exist') || evErr.message.includes('relation') ? 'missing' : 'error';
      diagnostics.errorMessage = evErr.message;
    }

    // Test 2: Integration sessions table
    const { data: intData, error: intErr } = await client.from('integration_sessions').select('id');
    if (!intErr) {
      diagnostics.integrationTableStatus = 'ok';
      diagnostics.integrationCount = intData ? intData.length : 0;
    } else {
      diagnostics.integrationTableStatus = intErr.message.includes('does not exist') || intErr.message.includes('relation') ? 'missing' : 'error';
    }

    if (diagnostics.eventsTableStatus === 'ok' || diagnostics.integrationTableStatus === 'ok') {
      diagnostics.status = 'connected';
    } else {
      diagnostics.status = 'disconnected';
    }
  } catch (err: any) {
    diagnostics.status = 'disconnected';
    diagnostics.errorMessage = err.message || 'Falha de rede ao consultar Supabase';
  }

  return diagnostics;
}

export function getSqlSetupScript(): string {
  return `-- SCRIPT SQL PARA O SUPABASE (Cole no SQL Editor do seu projeto Supabase)
-- Projeto: tgmjghxytbwafhrxdkyl.supabase.co

-- 1. TABELA DE EVENTOS DO CALENDÁRIO CORPORATIVO
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  starttime TEXT,
  endtime TEXT,
  duration TEXT,
  category TEXT DEFAULT 'Geral',
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e permitir leitura/escrita com a chave pública
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico liberado para events" ON public.events
  FOR ALL USING (true) WITH CHECK (true);

-- 2. TABELA DO CRONOGRAMA DE INTEGRAÇÃO DA UNIDADE
CREATE TABLE IF NOT EXISTS public.integration_sessions (
  id TEXT PRIMARY KEY,
  dia INTEGER NOT NULL DEFAULT 1,
  starttime TEXT,
  endtime TEXT,
  horariotext TEXT,
  ch TEXT,
  tema TEXT NOT NULL,
  area TEXT,
  responsavel TEXT,
  prn TEXT,
  local TEXT,
  codigo TEXT,
  entregavel TEXT,
  customcolor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e permitir leitura/escrita com a chave pública
ALTER TABLE public.integration_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico liberado para integration_sessions" ON public.integration_sessions
  FOR ALL USING (true) WITH CHECK (true);
`;
}
