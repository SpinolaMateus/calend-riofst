import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CorporateEvent } from '../types/calendar';
import { IntegrationAudience, IntegrationSession, UnitInfo } from '../types/schedule';

export const DEFAULT_SUPABASE_URL = 'https://tgmjghxytbwafhrxdkyl.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_2BYXec4XhnmlsYG9rKhxNQ_9Yq_MY4c';
const FORMATIONS_BUCKET = 'formations-dashboard';
const FORMATIONS_FILE_PATH = 'latest.csv';
export const FORMATIONS_VIEWER_EMAIL = 'formations-viewer@tgmjghxytbwafhrxdkyl.supabase.co';

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
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    currentClientKey = signature;
    return cachedClient;
  } catch (err) {
    console.error('Failed to init Supabase client', err);
    return null;
  }
}

export async function uploadSharedFormationsCsv(file: File): Promise<{ savedAt: number; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { savedAt: 0, error: new Error('Cliente Supabase não inicializado') };
  const savedAt = Date.now();

  try {
    const { error } = await client.storage
      .from(FORMATIONS_BUCKET)
      .upload(FORMATIONS_FILE_PATH, file, {
        upsert: true,
        contentType: 'text/csv',
        cacheControl: '0',
        metadata: {
          originalName: file.name,
          savedAt: new Date(savedAt).toISOString(),
        },
      });
    return { savedAt: error ? 0 : savedAt, error: error ? new Error(error.message) : null };
  } catch (caught: unknown) {
    return {
      savedAt: 0,
      error: caught instanceof Error ? caught : new Error('Não foi possível salvar o CSV compartilhado.'),
    };
  }
}

export async function downloadSharedFormationsCsv(): Promise<{
  file: File | null;
  savedAt: number | null;
  error: Error | null;
}> {
  const client = getSupabaseClient();
  if (!client) return { file: null, savedAt: null, error: new Error('Cliente Supabase não inicializado') };

  try {
    const { data, error } = await client.storage
      .from(FORMATIONS_BUCKET)
      .download(FORMATIONS_FILE_PATH);
    if (error) {
      if (error.message.toLocaleLowerCase().includes('object not found')) {
        return { file: null, savedAt: null, error: null };
      }
      return { file: null, savedAt: null, error: new Error(error.message) };
    }
    if (!data) return { file: null, savedAt: null, error: null };

    const { data: listedFiles, error: listError } = await client.storage
      .from(FORMATIONS_BUCKET)
      .list('', { limit: 100, search: FORMATIONS_FILE_PATH });
    if (listError) return { file: null, savedAt: null, error: new Error(listError.message) };
    const savedFile = listedFiles?.find((item) => item.name === FORMATIONS_FILE_PATH);
    const metadata = savedFile?.metadata as Record<string, unknown> | null;
    const originalName = typeof metadata?.originalName === 'string'
      ? metadata.originalName
      : FORMATIONS_FILE_PATH;
    const metadataSavedAt = typeof metadata?.savedAt === 'string'
      ? Date.parse(metadata.savedAt)
      : NaN;
    const savedAt = Number.isFinite(metadataSavedAt)
      ? metadataSavedAt
      : Date.parse(savedFile?.updated_at ?? '') || Date.now();

    return {
      file: new File([data], originalName, {
        type: data.type || 'text/csv',
        lastModified: savedAt,
      }),
      savedAt,
      error: null,
    };
  } catch (caught: unknown) {
    return {
      file: null,
      savedAt: null,
      error: caught instanceof Error ? caught : new Error('Não foi possível recuperar o CSV compartilhado.'),
    };
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
      audience: item.audience || 'geral',
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
    let firstError: Error | null = null;
    for (const s of sessions) {
      const payload = {
        id: String(s.id),
        audience: s.audience || 'geral',
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
      } else if (!firstError) {
        firstError = new Error(res.error.message);
      }
    }
    return { count: successCount, error: firstError };
  } catch (err: any) {
    return { count: 0, error: err };
  }
}

export async function fetchIntegrationStatusesFromSupabase(): Promise<{
  data: Record<string, boolean> | null;
  error: Error | null;
}> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Cliente Supabase não inicializado') };

  try {
    const { data, error } = await client
      .from('integration_session_status')
      .select('session_id, is_completed');
    if (error) return { data: null, error: new Error(error.message) };

    return {
      data: Object.fromEntries((data || []).map((item: any) => [
        String(item.session_id),
        Boolean(item.is_completed),
      ])),
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Não foi possível carregar os status das atividades.'),
    };
  }
}

export async function setIntegrationSessionStatus(
  sessionId: string,
  isCompleted: boolean,
): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Cliente Supabase não inicializado') };

  try {
    const { data, error } = await client.rpc('set_integration_session_status', {
      p_session_id: sessionId,
      p_is_completed: isCompleted,
    });
    if (error) return { error: new Error(error.message) };
    if (!data) {
      return { error: new Error('A atividade ainda não foi sincronizada com o cronograma na nuvem.') };
    }
    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error('Não foi possível salvar o status da atividade.'),
    };
  }
}

export function subscribeToIntegrationStatusChanges(onChange: () => void) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('integration-session-status-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'integration_session_status' },
      onChange,
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
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
  integrationStatusTableStatus: 'ok' | 'missing' | 'error';
  integrationStatusCount: number;
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
    integrationStatusTableStatus: 'missing',
    integrationStatusCount: 0,
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

    // Test 3: Shared completion status
    const { data: statusData, error: statusError } = await client
      .from('integration_session_status')
      .select('session_id');
    if (!statusError) {
      diagnostics.integrationStatusTableStatus = 'ok';
      diagnostics.integrationStatusCount = statusData?.length ?? 0;
    } else {
      diagnostics.integrationStatusTableStatus = /does not exist|relation|schema cache|could not find the table/i
        .test(statusError.message) ? 'missing' : 'error';
    }

    if (diagnostics.eventsTableStatus === 'ok'
      || diagnostics.integrationTableStatus === 'ok'
      || diagnostics.integrationStatusTableStatus === 'ok') {
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

-- LISTA PRIVADA DE ADMINISTRADORES
CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_admins FROM anon, authenticated;
GRANT SELECT ON public.app_admins TO authenticated;
DROP POLICY IF EXISTS "Admins can read own role" ON public.app_admins;
CREATE POLICY "Admins can read own role" ON public.app_admins
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

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

-- Visitantes podem ler; somente administradores autenticados podem alterar
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.events;
DROP POLICY IF EXISTS "Acesso publico liberado para events" ON public.events;
DROP POLICY IF EXISTS "Public can read events" ON public.events;
DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Public can read events" ON public.events
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = (SELECT auth.uid())));
GRANT SELECT ON TABLE public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.events FROM anon, PUBLIC;

-- 2. TABELA DO CRONOGRAMA DE INTEGRAÇÃO DA UNIDADE
CREATE TABLE IF NOT EXISTS public.integration_sessions (
  id TEXT PRIMARY KEY,
  audience TEXT NOT NULL DEFAULT 'geral',
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
ALTER TABLE public.integration_sessions
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'geral';
-- Visitantes podem ler; somente administradores autenticados podem alterar
ALTER TABLE public.integration_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.integration_sessions;
DROP POLICY IF EXISTS "Acesso publico liberado para integration_sessions" ON public.integration_sessions;
DROP POLICY IF EXISTS "Public can read integration sessions" ON public.integration_sessions;
DROP POLICY IF EXISTS "Admins manage integration sessions" ON public.integration_sessions;
CREATE POLICY "Public can read integration sessions" ON public.integration_sessions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage integration sessions" ON public.integration_sessions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = (SELECT auth.uid())));
GRANT SELECT ON TABLE public.integration_sessions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.integration_sessions TO authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.integration_sessions FROM anon, PUBLIC;

-- 3. ACOMPANHAMENTO DE STATUS DAS ATIVIDADES
CREATE TABLE IF NOT EXISTS public.integration_session_status (
  session_id TEXT PRIMARY KEY REFERENCES public.integration_sessions(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.integration_session_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read integration session status" ON public.integration_session_status;
CREATE POLICY "Public can read integration session status" ON public.integration_session_status
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON TABLE public.integration_session_status TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.integration_session_status FROM anon, authenticated, PUBLIC;

-- 4. CSV PRIVADO DO DASHBOARD (visualizadores autorizados leem; administradores enviam)
CREATE TABLE IF NOT EXISTS public.formations_dashboard_viewers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.formations_dashboard_viewers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.formations_dashboard_viewers FROM anon, authenticated;
GRANT SELECT ON public.formations_dashboard_viewers TO authenticated;
DROP POLICY IF EXISTS "Viewers can read own dashboard access" ON public.formations_dashboard_viewers;
CREATE POLICY "Viewers can read own dashboard access" ON public.formations_dashboard_viewers
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('formations-dashboard', 'formations-dashboard', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS "Formation CSV admins can read" ON storage.objects;
DROP POLICY IF EXISTS "Formation CSV authorized viewers can read" ON storage.objects;
CREATE POLICY "Formation CSV authorized viewers can read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'formations-dashboard'
    AND (
      EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = (SELECT auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.formations_dashboard_viewers v
        WHERE v.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Formation CSV admins can upload" ON storage.objects;
CREATE POLICY "Formation CSV admins can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'formations-dashboard'
    AND EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Formation CSV admins can replace" ON storage.objects;
CREATE POLICY "Formation CSV admins can replace" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'formations-dashboard'
    AND EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    bucket_id = 'formations-dashboard'
    AND EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = (SELECT auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.set_integration_session_status(
  p_session_id TEXT,
  p_is_completed BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.integration_sessions WHERE id = p_session_id) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.integration_session_status (session_id, is_completed, updated_at)
  VALUES (p_session_id, COALESCE(p_is_completed, FALSE), timezone('utc'::text, now()))
  ON CONFLICT (session_id) DO UPDATE
  SET is_completed = EXCLUDED.is_completed, updated_at = EXCLUDED.updated_at;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.set_integration_session_status(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_integration_session_status(TEXT, BOOLEAN) TO anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'integration_session_status'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_session_status;
  END IF;
END;
$$;

-- Crie a conta em Authentication > Users; depois execute com o UUID do usuário:
-- INSERT INTO public.app_admins (user_id) VALUES ('UUID_DO_USUARIO');
-- Para acesso de visualização com senha compartilhada, crie/ confirme esta conta:
-- formations-viewer@tgmjghxytbwafhrxdkyl.supabase.co
-- Depois execute:
-- INSERT INTO public.formations_dashboard_viewers (user_id)
-- SELECT id FROM auth.users WHERE email = 'formations-viewer@tgmjghxytbwafhrxdkyl.supabase.co'
-- ON CONFLICT (user_id) DO NOTHING;
-- Desative o cadastro público em Authentication > Settings.
`;
}
