import React, { useState, useEffect } from 'react';
import { 
  X, Cloud, CheckCircle2, AlertTriangle, RefreshCw, 
  Copy, Database, Globe, Server, Check, UploadCloud, Terminal
} from 'lucide-react';
import { 
  testFullConnectivity, 
  CloudDiagnostics, 
  getSupabaseCredentials, 
  saveSupabaseCredentials,
  syncIntegrationToSupabase,
  upsertEventToSupabase
} from '../services/supabaseClient';
import { IntegrationSession } from '../types/schedule';
import { CorporateEvent } from '../types/calendar';
import { useAdminAuth } from '../services/AdminAuthContext';

interface ConnectivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrationSessions: IntegrationSession[];
  calendarEvents: CorporateEvent[];
  onSyncCompleted?: (message: string, type: 'success' | 'error') => void;
}

export const ConnectivityModal: React.FC<ConnectivityModalProps> = ({
  isOpen,
  onClose,
  integrationSessions,
  calendarEvents,
  onSyncCompleted,
}) => {
  const { hasAdminAccess, requestAdminAccess } = useAdminAuth();
  const [diagnostics, setDiagnostics] = useState<CloudDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlEditor, setShowSqlEditor] = useState(false);

  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');

  const runTest = async () => {
    setLoading(true);
    try {
      const diag = await testFullConnectivity();
      setDiagnostics(diag);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setInputUrl(creds.url);
      setInputKey(creds.key);
      runTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    if (diagnostics?.sqlSnippet) {
      navigator.clipboard.writeText(diagnostics.sqlSnippet);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleSaveCredentials = () => {
    saveSupabaseCredentials(inputUrl.trim(), inputKey.trim());
    runTest();
  };

  const handleSyncAllToSupabase = async () => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => { void handleSyncAllToSupabase(); });
      return;
    }
    setSyncing(true);
    let eventsSynced = 0;
    let integrationSynced = 0;
    let eventsFailed = 0;

    try {
      // 1. Sync Calendar Events
      for (const ev of calendarEvents) {
        const res = await upsertEventToSupabase(ev);
        if (!res.error) eventsSynced++;
        else eventsFailed++;
      }

      // 2. Sync Integration Sessions
      const intRes = await syncIntegrationToSupabase(integrationSessions);
      integrationSynced = intRes.count;

      if (onSyncCompleted) {
        const failures = eventsFailed + (intRes.error ? integrationSessions.length - integrationSynced : 0);
        onSyncCompleted(
          failures
            ? `Sincronização parcial: ${eventsSynced} eventos e ${integrationSynced} atividades enviados; ${failures} falha(s). ${intRes.error?.message || ''}`
            : `Sincronização concluída! ${eventsSynced} eventos e ${integrationSynced} atividades de integração enviados.`,
          failures ? 'error' : 'success'
        );
      }
      runTest();
    } catch (err: unknown) {
      console.error(err);
      onSyncCompleted?.(
        err instanceof Error ? `Falha ao sincronizar com o Supabase: ${err.message}` : 'Falha ao sincronizar com o Supabase.',
        'error'
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Diagnóstico de Conexão: Vercel & Supabase
              </h2>
              <p className="text-xs text-slate-300">
                Verificação de status em tempo real do banco de dados e do servidor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Vercel Configuration */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" /> Servidor & Vercel
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Vercel Ready
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Arquivo <strong>vercel.json</strong> configurado com reescritas SPA e cabeçalhos de visualização ativados.
              </p>
              <div className="text-[10px] font-mono bg-white p-1.5 rounded border border-slate-200 text-slate-500 truncate">
                Roteamento: /* → /index.html (SPA)
              </div>
            </div>

            {/* Card 2: Supabase Connection */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-sky-600" /> Nuvem Supabase
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    diagnostics?.status === 'connected'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {diagnostics?.status === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conectado
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> Offline / Parcial
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate">
                Projeto: <strong>{diagnostics?.projectRef || 'tgmjghxytbwafhrxdkyl'}</strong>
              </p>
              <div className="text-[10px] font-mono bg-white p-1.5 rounded border border-slate-200 text-slate-500 truncate">
                {diagnostics?.url || 'https://tgmjghxytbwafhrxdkyl.supabase.co'}
              </div>
            </div>
          </div>

          {/* Module Tables Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Status das Tabelas no Supabase
            </h4>

            <div className="divide-y divide-slate-100">
              {/* Tabela: events (Calendário Corporativo) */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Tabela: events (Calendário Corporativo)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {calendarEvents.length} eventos locais • {diagnostics?.eventsCount ?? 0} registrados no Supabase
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    diagnostics?.eventsTableStatus === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {diagnostics?.eventsTableStatus === 'ok' ? 'Tabela Ativa' : 'Aguardando Tabela'}
                </span>
              </div>

              {/* Tabela: integration_sessions (Cronograma de Integração) */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Tabela: integration_sessions (Cronograma da Unidade)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {integrationSessions.length} atividades locais • {diagnostics?.integrationCount ?? 0} registradas no Supabase
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    diagnostics?.integrationTableStatus === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {diagnostics?.integrationTableStatus === 'ok' ? 'Tabela Ativa' : 'Aguardando Tabela'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between border-t border-slate-100">
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Tabela: integration_session_status (Status compartilhados)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {diagnostics?.integrationStatusCount ?? 0} status salvos na nuvem · marcação liberada para visitantes
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    diagnostics?.integrationStatusTableStatus === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {diagnostics?.integrationStatusTableStatus === 'ok' ? 'Tabela Ativa' : 'Execute o SQL'}
                </span>
              </div>

              {/* Tabela: action_plans (Plano de Ação Gantt) */}
              <div className="py-2.5 flex items-center justify-between border-t border-slate-100">
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>Tabela: action_plans (Plano de Ação • Gantt)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {diagnostics?.actionPlansCount ?? 0} ações registradas no Supabase · acompanhamento em tempo real
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    diagnostics?.actionPlansTableStatus === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {diagnostics?.actionPlansTableStatus === 'ok' ? 'Tabela Ativa' : 'Execute o SQL'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Cloud Sync Action */}
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs text-slate-900">
                Sincronizar Todos os Registros com a Nuvem
              </h4>
              <p className="text-[11px] text-slate-600">
                Envia tanto o Calendário Corporativo quanto o Cronograma de Integração para o Supabase.
              </p>
            </div>
            <button
              onClick={handleSyncAllToSupabase}
              disabled={syncing}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{syncing ? 'Sincronizando...' : 'Subir Tudo para a Nuvem'}</span>
            </button>
          </div>

          {/* SQL Setup Script Accordion */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
            <button
              onClick={() => setShowSqlEditor(!showSqlEditor)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-600" />
                <span>Script SQL de Criação de Tabelas (Cole no Supabase SQL Editor)</span>
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold">
                {showSqlEditor ? 'Ocultar Script' : 'Ver Script SQL'}
              </span>
            </button>

            {showSqlEditor && (
              <div className="p-4 bg-slate-900 text-slate-200 text-xs font-mono space-y-2 border-t border-slate-700">
                <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                  <span className="text-[10px]">Copie e execute no menu SQL Editor do Supabase:</span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1 text-[11px] font-sans px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-white"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copiar SQL
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] max-h-48 text-emerald-400 select-all p-2 bg-black/40 rounded">
                  {diagnostics?.sqlSnippet}
                </pre>
              </div>
            )}
          </div>

          {/* Credentials Inputs (Editable) */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chaves do Projeto Supabase
            </h4>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                URL do Supabase (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Chave Pública / Anon Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={runTest}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-1.5 hover:bg-sky-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Testando...' : 'Re-testar Conexão'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl"
            >
              Fechar
            </button>
            <button
              onClick={handleSaveCredentials}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
