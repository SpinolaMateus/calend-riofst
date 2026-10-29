/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaDefinition, 
  IntegrationSession, 
  UnitInfo, 
  ViewMode,
  INTEGRATION_AUDIENCES,
  IntegrationAudience
} from './types/schedule';
import { 
  INITIAL_AREAS, 
  INITIAL_SESSIONS, 
  INITIAL_UNIT_INFO 
} from './data/initialSchedule';
import { Header } from './components/Header';
import { VisualTimelineView } from './components/VisualTimelineView';
import { TableScheduleView } from './components/TableScheduleView';
import { PresentationView } from './components/PresentationView';
import { SessionModal } from './components/SessionModal';
import { AreaManagerModal } from './components/AreaManagerModal';
import { UnitSettingsModal } from './components/UnitSettingsModal';
import { HomeScreen } from './components/HomeScreen';
import { CorporateCalendarView } from './components/CorporateCalendarView';
import { ConnectivityModal } from './components/ConnectivityModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { copyElementAsImage, exportElementToPDF, exportToExcel, parseExcelFile } from './utils/exportUtils';
import { 
  CheckCircle2, AlertCircle, Info, Home, 
  Clock, Calendar as CalendarIcon, Shield, Cloud, BarChart3
} from 'lucide-react';
import { CorporateEvent } from './types/calendar';
import { useAdminAuth } from './services/AdminAuthContext';
import { ActionPlanGanttView } from './components/ActionPlanGanttView';
import { syncSessionTimeAndCH } from './utils/timeUtils';
import {
  fetchIntegrationFromSupabase,
  fetchIntegrationStatusesFromSupabase,
  setIntegrationSessionStatus,
  subscribeToIntegrationStatusChanges,
  upsertIntegrationSessionToSupabase,
  deleteIntegrationSessionFromSupabase,
  subscribeToIntegrationSessions,
  syncIntegrationToSupabase,
} from './services/supabaseClient';
import { FormationsDashboard } from './components/FormationsDashboard';
import { StatusTrackingView } from './components/StatusTrackingView';
import { PeopleAnalyticsView } from './components/PeopleAnalyticsView';

const STORAGE_KEY_SESSIONS = 'cronograma_integracao_sessions_v2';
const STORAGE_KEY_AREAS = 'cronograma_integracao_areas_v2';
const STORAGE_KEY_UNIT = 'cronograma_integracao_unit_v2';

export default function App() {
  const { user, isAdmin, hasAdminAccess, requestAdminAccess, signOutAdmin } = useAdminAuth();
  // Navigation: 'home' | 'integration' | 'calendar' | 'formations' | 'action_plan' | 'people_analytics'
  const [activeApp, setActiveApp] = useState<'home' | 'integration' | 'calendar' | 'formations' | 'action_plan' | 'people_analytics'>('home');

  // Load initial data from localStorage if available
  const [sessions, setSessions] = useState<IntegrationSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const initial = saved ? JSON.parse(saved) as IntegrationSession[] : INITIAL_SESSIONS;
      return initial.map((session) => syncSessionTimeAndCH({ ...session, audience: session.audience || 'geral' }));
    } catch {
      return INITIAL_SESSIONS.map((session) => syncSessionTimeAndCH({ ...session, audience: session.audience || 'geral' }));
    }
  });

  const [areas, setAreas] = useState<AreaDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AREAS);
      return saved ? JSON.parse(saved) : INITIAL_AREAS;
    } catch {
      return INITIAL_AREAS;
    }
  });

  const [unitInfo, setUnitInfo] = useState<UnitInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNIT);
      return saved ? JSON.parse(saved) : INITIAL_UNIT_INFO;
    } catch {
      return INITIAL_UNIT_INFO;
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedAudience, setSelectedAudience] = useState<IntegrationAudience>(() => {
    const saved = localStorage.getItem('cronograma_integracao_audience_v1');
    return INTEGRATION_AUDIENCES.find((audience) => audience.id === saved)?.id || 'geral';
  });

  const hasAutoBackedUpRef = useRef(false);

  // Modals & Popups
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<IntegrationSession | null>(null);
  const [sessionModalDay, setSessionModalDay] = useState<number>(1);
  const [isAreaManagerOpen, setIsAreaManagerOpen] = useState(false);
  const [isUnitSettingsOpen, setIsUnitSettingsOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isConnectivityModalOpen, setIsConnectivityModalOpen] = useState(false);
  const [isStatusSyncReady, setIsStatusSyncReady] = useState(false);
  const [statusSyncMessage, setStatusSyncMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Calendar events state for diagnostics sync
  const [calendarEvents, setCalendarEvents] = useState<CorporateEvent[]>(() => {
    try {
      const stored = localStorage.getItem('app_calendar_events_v3');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Calendar count for badges
  const calendarEventsCount = calendarEvents.length;

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);

  useEffect(() => {
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const applyCloudStatuses = async () => {
      try {
        const { data, error } = await fetchIntegrationStatusesFromSupabase();
        if (cancelled) return;
        if (error) {
          console.error('Could not load integration activity statuses from Supabase', error);
          setIsStatusSyncReady(false);
          setStatusSyncMessage(
            /does not exist|schema cache|could not find the table/i.test(error.message)
              ? 'Ative os status compartilhados: abra Vercel & Supabase, copie o SQL atualizado e execute-o no SQL Editor do Supabase.'
              : 'Não foi possível conectar ao Supabase para carregar os status compartilhados.',
          );
          return;
        }
        if (!data) return;
        setIsStatusSyncReady(true);
        setStatusSyncMessage('');

        setSessions((current) => {
          return current.map((session) => (
            Object.prototype.hasOwnProperty.call(data, session.id)
              ? { ...session, isCompleted: data[session.id] }
              : session
          ));
        });
      } catch (err) {
        console.error('Error applying cloud statuses:', err);
      }
    };

    const unsubscribeFromStatusChanges = subscribeToIntegrationStatusChanges(() => {
      void applyCloudStatuses();
    });

    const loadCloudData = async () => {
      try {
        const [sessionsResult, statusesResult] = await Promise.all([
          fetchIntegrationFromSupabase(),
          fetchIntegrationStatusesFromSupabase(),
        ]);
        if (cancelled) return;
        if (sessionsResult.error) {
          console.error('Could not load integration schedule from Supabase', sessionsResult.error);
        }
        if (statusesResult.error) {
          console.error('Could not load integration activity statuses from Supabase', statusesResult.error);
          setIsStatusSyncReady(false);
          setStatusSyncMessage(
            /does not exist|schema cache|could not find the table/i.test(statusesResult.error.message)
              ? 'Ative os status compartilhados: abra Vercel & Supabase, copie o SQL atualizado e execute-o no SQL Editor do Supabase.'
              : 'Não foi possível conectar ao Supabase para carregar os status compartilhados.',
          );
        } else {
          setIsStatusSyncReady(true);
          setStatusSyncMessage('');
        }

        const cloudStatuses = statusesResult.data ?? {};
        const cloudSessions = sessionsResult.data ?? [];

        if (cloudSessions.length > 0) {
          setSessions((current) => {
            const merged = new Map(current.map((session) => [session.id, session]));
            for (const session of cloudSessions) {
              const previous = merged.get(session.id);
              merged.set(session.id, syncSessionTimeAndCH({
                ...session,
                audience: session.audience || 'geral',
                isCompleted: Object.prototype.hasOwnProperty.call(cloudStatuses, session.id)
                  ? cloudStatuses[session.id]
                  : previous?.isCompleted ?? session.isCompleted ?? false,
              }));
            }
            return Array.from(merged.values()).map((session) => (
              Object.prototype.hasOwnProperty.call(cloudStatuses, session.id)
                ? { ...session, isCompleted: cloudStatuses[session.id] }
                : session
            ));
          });
        } else if (!hasAutoBackedUpRef.current) {
          // Se a nuvem estiver vazia na primeira vez, fazer upload inicial seguro
          hasAutoBackedUpRef.current = true;
          if (sessions.length > 0) {
            void syncIntegrationToSupabase(sessions);
          }
        }
      } catch (err) {
        console.error('Failed to load cloud data safely:', err);
      }
    };

    const debouncedLoadCloudData = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void loadCloudData();
      }, 1000);
    };

    const unsubscribeFromSessionChanges = subscribeToIntegrationSessions(() => {
      debouncedLoadCloudData();
    });

    void loadCloudData();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribeFromStatusChanges();
      unsubscribeFromSessionChanges();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cronograma_integracao_audience_v1', selectedAudience);
  }, [selectedAudience]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AREAS, JSON.stringify(areas));
    } catch (e) {
      console.error('Failed to save areas to localStorage', e);
    }
  }, [areas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNIT, JSON.stringify(unitInfo));
    } catch (e) {
      console.error('Failed to save unitInfo to localStorage', e);
    }
  }, [unitInfo]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Available unique days in schedule
  const audienceSessions = sessions.filter((session) => (session.audience || 'geral') === selectedAudience);
  const audienceCounts = sessions.reduce<Record<IntegrationAudience, number>>((counts, session) => {
    counts[session.audience || 'geral'] += 1;
    return counts;
  }, { geral: 0, temporarios: 0, 'jovem-aprendiz': 0, estagiarios: 0 });
  const availableDays = Array.from(new Set(audienceSessions.map((s) => s.dia))).sort((a, b) => a - b);

  // Handlers for session mutations
  const handleSaveSession = (savedSession: IntegrationSession) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleSaveSession(savedSession));
      return;
    }
    savedSession = syncSessionTimeAndCH({
      ...savedSession,
      audience: savedSession.audience || selectedAudience,
      isCompleted: sessionToEdit?.isCompleted ?? savedSession.isCompleted ?? false,
    });
    if (sessionToEdit) {
      setSessions((prev) =>
        prev.map((s) => (s.id === savedSession.id ? savedSession : s))
      );
      showToast('Atividade atualizada e salva com sucesso!');
    } else {
      setSessions((prev) => [...prev, savedSession]);
      showToast('Nova atividade inserida e salva com sucesso!');
    }
    setSessionToEdit(null);

    // Salvar na nuvem Supabase imediatamente
    setIsCloudSyncing(true);
    void upsertIntegrationSessionToSupabase(savedSession).then(({ error }) => {
      setIsCloudSyncing(false);
      if (error) {
        console.error('Could not save session to Supabase', error);
        showToast('Salvo localmente (erro ao sincronizar na nuvem Supabase).', 'info');
      }
    });
  };

  const handleUpdateSession = (updated: IntegrationSession) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleUpdateSession(updated));
      return;
    }
    const synced = syncSessionTimeAndCH(updated);
    setSessions((prev) => prev.map((s) => (s.id === synced.id ? synced : s)));
    setIsCloudSyncing(true);
    void upsertIntegrationSessionToSupabase(synced).then(({ error }) => {
      setIsCloudSyncing(false);
      if (error) {
        console.error('Could not update session in Supabase', error);
      }
    });
  };

  const handleToggleSessionStatus = async (session: IntegrationSession, isCompleted: boolean) => {
    const previousStatus = Boolean(sessions.find((item) => item.id === session.id)?.isCompleted);
    setSessions((current) => current.map((item) => (
      item.id === session.id ? { ...item, isCompleted } : item
    )));

    const { error } = await setIntegrationSessionStatus(session.id, isCompleted, session);
    if (error) {
      setIsStatusSyncReady(false);
      setStatusSyncMessage(
        /does not exist|schema cache|could not find the function|could not find the table/i.test(error.message)
          ? 'Ative os status compartilhados: abra Vercel & Supabase, copie o SQL atualizado e execute-o no SQL Editor do Supabase.'
          : 'Não foi possível conectar ao Supabase para salvar os status compartilhados.',
      );
      setSessions((current) => current.map((item) => (
        item.id === session.id ? { ...item, isCompleted: previousStatus } : item
      )));
      console.error('Could not save integration activity status', error);
      showToast(
        `Não foi possível sincronizar o status. Verifique a configuração da tabela de status no Supabase. ${error.message}`,
        'error',
      );
      return;
    }
    setIsStatusSyncReady(true);
    setStatusSyncMessage('');
    showToast(isCompleted ? 'Atividade marcada como feita.' : 'Atividade voltou para pendente.');
  };

  const handleDeleteSession = (id: string) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleDeleteSession(id));
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showToast('Atividade removida.', 'info');
    setIsCloudSyncing(true);
    void deleteIntegrationSessionFromSupabase(id).then(({ error }) => {
      setIsCloudSyncing(false);
      if (error) {
        console.error('Could not delete session from Supabase', error);
      }
    });
  };

  const handleDuplicateSession = (session: IntegrationSession) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleDuplicateSession(session));
      return;
    }
    const duplicated: IntegrationSession = {
      ...session,
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tema: `${session.tema} (Cópia)`,
      isCompleted: false,
    };
    setSessions((prev) => [...prev, duplicated]);
    showToast('Atividade duplicada e salva com sucesso!');
    setIsCloudSyncing(true);
    void upsertIntegrationSessionToSupabase(duplicated).then(({ error }) => {
      setIsCloudSyncing(false);
      if (error) {
        console.error('Could not save duplicated session to Supabase', error);
      }
    });
  };

  const handleEditSession = (session: IntegrationSession) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleEditSession(session));
      return;
    }
    setSessionToEdit(session);
    setSessionModalDay(session.dia);
    setIsSessionModalOpen(true);
  };

  const handleAddNewSession = (dia?: number, startStr?: string, endStr?: string) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleAddNewSession(dia, startStr, endStr));
      return;
    }
    const targetDay = dia || (selectedDay === 'all' ? 1 : Number(selectedDay));
    setSessionToEdit(null);
    setSessionModalDay(targetDay);
    setIsSessionModalOpen(true);
  };

  // Export PDF directly
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      showToast('Gerando PDF do cronograma...', 'info');
      await exportElementToPDF('printable-content', `cronograma_integracao_unidade_${Date.now()}.pdf`);
      showToast('PDF baixado com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar PDF. Use a opção "Imprimir / Salvar em PDF".', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Browser Print trigger (ideal for vector printing/save as PDF)
  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopyScheduleAsImage = async () => {
    try {
      setIsCopyingImage(true);
      const res = await copyElementAsImage('printable-content', 'cronograma_integracao');
      if (res.method === 'clipboard') {
        showToast('Agenda copiada como imagem! Você já pode colar no Teams, WhatsApp ou e-mail.');
      } else {
        showToast('Imagem da agenda baixada com sucesso no seu computador!');
      }
    } catch (error) {
      console.error('Could not copy integration schedule as image', error);
      showToast(error instanceof Error ? error.message : 'Não foi possível copiar a agenda como imagem.', 'error');
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      exportToExcel(audienceSessions, unitInfo, selectedAudience);
      showToast('Planilha Excel (.xlsx) exportada com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar arquivo Excel.', 'error');
    }
  };

  // Import from Excel file
  const handleImportExcel = async (file: File) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => { void handleImportExcel(file); });
      return;
    }
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        showToast('Nenhum dado encontrado na planilha importada.', 'error');
        return;
      }
      const existingStatuses = new Map(sessions.map((session) => [session.id, session.isCompleted]));
      const importedSessions = parsed.map((session) => ({
        ...session,
        audience: session.audience || selectedAudience,
        isCompleted: existingStatuses.get(session.id) ?? session.isCompleted ?? false,
      }));
      setSessions((previous) => [
        ...previous.filter((session) => (session.audience || 'geral') !== selectedAudience),
        ...importedSessions,
      ]);
      showToast(`Importação concluída! Salvando ${importedSessions.length} atividades no Supabase...`, 'info');

      // Sincronizar atividades importadas no Supabase imediatamente
      setIsCloudSyncing(true);
      void syncIntegrationToSupabase(importedSessions).then(({ error, count }) => {
        setIsCloudSyncing(false);
        if (error) {
          console.warn('Could not sync imported sessions to Supabase', error);
          showToast('Importado localmente (erro ao sincronizar na nuvem).', 'info');
        } else {
          showToast(`${count} atividades importadas e salvas no Supabase!`, 'success');
        }
      });
    } catch (err) {
      console.error(err);
      showToast('Erro ao ler planilha. Verifique as colunas do arquivo.', 'error');
    }
  };

  // Reset to original dataset from user's image
  const handleResetDefault = () => {
    if (!hasAdminAccess()) {
      requestAdminAccess(handleResetDefault);
      return;
    }
    if (window.confirm('Deseja restaurar o cronograma padrão original da imagem? Suas alterações serão substituídas.')) {
      const defaultSessions = selectedAudience === 'geral'
        ? INITIAL_SESSIONS.map((session) => ({ ...session, audience: 'geral' as const }))
        : [];
      setSessions((current) => [
        ...current.filter((session) => (session.audience || 'geral') !== selectedAudience),
        ...defaultSessions,
      ]);
      showToast(`Agenda ${selectedAudience} restaurada aos dados padrão.`);
      
      // Sincronizar com Supabase
      if (defaultSessions.length > 0) {
        setIsCloudSyncing(true);
        void syncIntegrationToSupabase(defaultSessions).then(({ error }) => {
          setIsCloudSyncing(false);
          if (!error) {
            showToast('Dados padrão salvos no Supabase com sucesso!', 'success');
          }
        });
      }
    }
  };

  // Sincronização manual total com a nuvem Supabase
  const handleSyncAllIntegrationToCloud = async () => {
    try {
      setIsCloudSyncing(true);
      showToast('Sincronizando todas as atividades no Supabase...', 'info');
      const { count, error } = await syncIntegrationToSupabase(sessions);
      if (error) {
        console.error('Could not sync integration to Supabase', error);
        showToast(`Erro ao salvar no Supabase: ${error.message}`, 'error');
      } else {
        showToast(`Todas as ${count} atividades foram salvas com sucesso no Supabase!`, 'success');
      }
    } catch (err: any) {
      showToast(`Erro na sincronização: ${err?.message || err}`, 'error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : toast.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Global Portal Switcher Bar */}
      <nav className="no-print bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between z-50 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveApp('home')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeApp === 'home'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Início / Hub</span>
          </button>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Module 1 Switcher */}
          <button
            onClick={() => setActiveApp('integration')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeApp === 'integration'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Cronograma de Integração</span>
            <span className="sm:hidden">Integração</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full text-[10px]">
              {sessions.length}
            </span>
          </button>

          {/* Module 2 Switcher */}
          <button
            onClick={() => setActiveApp('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeApp === 'calendar'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Calendário & Eventos</span>
            <span className="sm:hidden">Calendário</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full text-[10px]">
              Nuvem
            </span>
          </button>

          <button
            onClick={() => setActiveApp('formations')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeApp === 'formations'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">Dashboard de Formações</span>
            <span className="sm:hidden">Formações</span>
          </button>

          <button
            onClick={() => setActiveApp('action_plan')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeApp === 'action_plan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Plano de Ação (Gantt)</span>
            <span className="sm:hidden">Plano de Ação</span>
          </button>

          <button
            onClick={() => setActiveApp('people_analytics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeApp === 'people_analytics'
                ? 'bg-[#15877B] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">People Analytics</span>
            <span className="sm:hidden">People</span>
            <span className="bg-teal-900/60 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded-full text-[10px]">
              KBA1
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Cloud Diagnostics Button */}
          <button
            onClick={() => setIsConnectivityModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-semibold text-xs transition-all shadow-xs"
            title="Diagnóstico de Conexão Vercel & Supabase"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vercel & Supabase</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => {
              if (hasAdminAccess()) {
                void signOutAdmin().catch((error: unknown) => {
                  console.error('Could not sign out of Supabase', error);
                  showToast('Não foi possível encerrar a sessão administrativa.', 'error');
                });
              }
              else requestAdminAccess();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs"
            title={isAdmin ? `Sair da conta ${user?.email ?? ''}` : 'Entrar como administrador'}
          >
            <Shield className={`w-3.5 h-3.5 ${isAdmin ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{isAdmin ? 'Sair do admin' : 'Acesso admin'}</span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* SCREEN 1: PORTAL HOME SCREEN */}
      {/* ========================================================================= */}
      {activeApp === 'home' && (
        <main className="flex-1">
          <ErrorBoundary moduleName="Tela Inicial do Portal">
            <HomeScreen
              unitInfo={unitInfo}
              onSelectIntegration={() => setActiveApp('integration')}
              onSelectCalendar={() => setActiveApp('calendar')}
              onSelectFormations={() => setActiveApp('formations')}
              onSelectActionPlan={() => setActiveApp('action_plan')}
              onSelectPeopleAnalytics={() => setActiveApp('people_analytics')}
              integrationEventsCount={sessions.length}
              calendarEventsCount={calendarEventsCount}
              onOpenAdminAccess={() => requestAdminAccess()}
              isAdmin={isAdmin}
            />
          </ErrorBoundary>
        </main>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: CRONOGRAMA DE INTEGRAÇÃO (MODULE 1) */}
      {/* ========================================================================= */}
      {activeApp === 'integration' && (
        <ErrorBoundary moduleName="Cronograma de Integração">
          <div id="integration-capture-content" className="bg-slate-100/70">
            <Header
              unitInfo={unitInfo}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              availableDays={availableDays}
              selectedAudience={selectedAudience}
              audienceCounts={audienceCounts}
              onSelectAudience={(audience) => {
                setSelectedAudience(audience);
                setSelectedDay('all');
              }}
              onOpenNewSession={() => handleAddNewSession()}
              onExportPDF={handleExportPDF}
              onPrintPDF={handlePrintPDF}
              onCopyAsImage={handleCopyScheduleAsImage}
              isCopyingImage={isCopyingImage}
              onExportExcel={handleExportExcel}
              onImportExcel={handleImportExcel}
              onOpenAreaManager={() => {
                if (isAdmin) setIsAreaManagerOpen(true);
                else requestAdminAccess(() => setIsAreaManagerOpen(true));
              }}
              onOpenUnitSettings={() => {
                if (isAdmin) setIsUnitSettingsOpen(true);
                else requestAdminAccess(() => setIsUnitSettingsOpen(true));
              }}
              onResetDefault={handleResetDefault}
              isExportingPDF={isExportingPDF}
              onSyncCloud={handleSyncAllIntegrationToCloud}
              isCloudSyncing={isCloudSyncing}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div id="printable-content" className="print-container bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
                {/* Cabeçalho Executivo Inteligente para Captura de Imagem e Impressão */}
                <div className="capture-only hidden border-b border-slate-200 pb-3 mb-4 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold uppercase text-slate-900">{unitInfo.unitName}</h1>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Divulgação Oficial
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-0.5">
                        {unitInfo.cohortName} — {unitInfo.period}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Local: {unitInfo.locationDefault} • Contato: {unitInfo.contactPerson}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#132F46] text-white rounded-xl shadow-xs">
                        {INTEGRATION_AUDIENCES.find((a) => a.id === selectedAudience)?.label || 'Geral'} • {selectedDay === 'all' ? 'Todos os Dias' : `Dia ${selectedDay}`}
                      </span>
                    </div>
                  </div>
                </div>

                {viewMode === 'timeline' && (
                  <VisualTimelineView
                    sessions={audienceSessions}
                    areas={areas}
                    selectedDay={selectedDay}
                    onUpdateSession={handleUpdateSession}
                    onDeleteSession={handleDeleteSession}
                    onDuplicateSession={handleDuplicateSession}
                    onEditSession={handleEditSession}
                    onAddNewSession={handleAddNewSession}
                  />
                )}

                {viewMode === 'table' && (
                  <TableScheduleView
                    sessions={audienceSessions}
                    areas={areas}
                    selectedDay={selectedDay}
                    onUpdateSession={handleUpdateSession}
                    onDeleteSession={handleDeleteSession}
                    onDuplicateSession={handleDuplicateSession}
                    onEditSession={handleEditSession}
                    onAddNewSession={handleAddNewSession}
                  />
                )}

                {viewMode === 'status' && (
                  <StatusTrackingView
                    sessions={audienceSessions}
                    selectedDay={selectedDay}
                    syncMessage={statusSyncMessage}
                    isSyncReady={isStatusSyncReady}
                    onToggleStatus={handleToggleSessionStatus}
                  />
                )}

                {viewMode === 'display' && (
                  <PresentationView
                    sessions={audienceSessions}
                    areas={areas}
                    unitInfo={unitInfo}
                    selectedDay={selectedDay}
                    onEditSession={handleEditSession}
                  />
                )}
              </div>
            </main>
          </div>
        </ErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: CORPORATE CALENDAR */}
      {/* ========================================================================= */}
      {activeApp === 'calendar' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorBoundary moduleName="Calendário Corporativo">
            <CorporateCalendarView
              onBackToHome={() => setActiveApp('home')}
              onGoToIntegration={() => setActiveApp('integration')}
              onEventsChange={setCalendarEvents}
            />
          </ErrorBoundary>
        </main>
      )}

      {activeApp === 'formations' && (
        <ErrorBoundary moduleName="Dashboard de Formações">
          <FormationsDashboard />
        </ErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: ACTION PLAN (GANTT MODEL) */}
      {/* ========================================================================= */}
      {activeApp === 'action_plan' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorBoundary moduleName="Plano de Ação (Gantt)">
            <ActionPlanGanttView onBackToHome={() => setActiveApp('home')} />
          </ErrorBoundary>
        </main>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5: PEOPLE ANALYTICS (GENTE & GESTÃO - UNIDADE BAHIA KBA1) */}
      {/* ========================================================================= */}
      {activeApp === 'people_analytics' && (
        <main className="flex-1 w-full">
          <ErrorBoundary moduleName="People Analytics (Feira de Santana - BA)">
            <PeopleAnalyticsView onBackToHome={() => setActiveApp('home')} />
          </ErrorBoundary>
        </main>
      )}

      {/* Footer Info (no-print) */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <strong>{unitInfo.unitName}</strong> • Portal de Gestão de Cronogramas, Eventos e Formações
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveApp('home')}
              className="text-slate-600 hover:text-indigo-600 font-semibold"
            >
              Voltar ao Início
            </button>
            <span>•</span>
            <span>{isAdmin ? `Administrador: ${user?.email ?? ''}` : 'Modo de leitura pública'}</span>
          </div>
        </div>
      </footer>

      {/* Modals for Integration */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => {
          setIsSessionModalOpen(false);
          setSessionToEdit(null);
        }}
        onSave={handleSaveSession}
        onDelete={handleDeleteSession}
        sessionToEdit={sessionToEdit}
        areas={areas}
        defaultDia={sessionModalDay}
        defaultAudience={selectedAudience}
        existingDays={availableDays}
      />

      <AreaManagerModal
        isOpen={isAreaManagerOpen}
        onClose={() => setIsAreaManagerOpen(false)}
        areas={areas}
        onSaveAreas={(updatedAreas) => {
          if (!hasAdminAccess()) {
            requestAdminAccess(() => {
              setAreas(updatedAreas);
              showToast('Paleta de cores e áreas atualizada com sucesso!');
            });
            return;
          }
          setAreas(updatedAreas);
          showToast('Paleta de cores e áreas atualizada com sucesso!');
        }}
      />

      <UnitSettingsModal
        isOpen={isUnitSettingsOpen}
        onClose={() => setIsUnitSettingsOpen(false)}
        unitInfo={unitInfo}
        onSaveUnitInfo={(updatedInfo) => {
          if (!hasAdminAccess()) {
            requestAdminAccess(() => {
              setUnitInfo(updatedInfo);
              showToast('Dados da unidade atualizados com sucesso!');
            });
            return;
          }
          setUnitInfo(updatedInfo);
          showToast('Dados da unidade atualizados com sucesso!');
        }}
      />

      <ConnectivityModal
        isOpen={isConnectivityModalOpen}
        onClose={() => setIsConnectivityModalOpen(false)}
        integrationSessions={sessions}
        calendarEvents={calendarEvents}
        onSyncCompleted={(msg, type) => showToast(msg, type)}
      />
    </div>
  );
}
