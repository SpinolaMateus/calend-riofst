/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { copyElementAsImage, exportElementToPDF, exportToExcel, parseExcelFile } from './utils/exportUtils';
import { 
  CheckCircle2, AlertCircle, Info, Home, 
  Clock, Calendar as CalendarIcon, Shield, Cloud, BarChart3
} from 'lucide-react';
import { CorporateEvent } from './types/calendar';
import { useAdminAuth } from './services/AdminAuthContext';
import {
  fetchIntegrationFromSupabase,
  fetchIntegrationStatusesFromSupabase,
  setIntegrationSessionStatus,
  subscribeToIntegrationStatusChanges,
} from './services/supabaseClient';
import { FormationsDashboard } from './components/FormationsDashboard';
import { StatusTrackingView } from './components/StatusTrackingView';

const STORAGE_KEY_SESSIONS = 'cronograma_integracao_sessions_v2';
const STORAGE_KEY_AREAS = 'cronograma_integracao_areas_v2';
const STORAGE_KEY_UNIT = 'cronograma_integracao_unit_v2';

export default function App() {
  const { user, isAdmin, hasAdminAccess, requestAdminAccess, signOutAdmin } = useAdminAuth();
  // Navigation: 'home' | 'integration' | 'calendar' | 'formations'
  const [activeApp, setActiveApp] = useState<'home' | 'integration' | 'calendar' | 'formations'>('home');

  // Load initial data from localStorage if available
  const [sessions, setSessions] = useState<IntegrationSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const initial = saved ? JSON.parse(saved) as IntegrationSession[] : INITIAL_SESSIONS;
      return initial.map((session) => ({ ...session, audience: session.audience || 'geral' }));
    } catch {
      return INITIAL_SESSIONS.map((session) => ({ ...session, audience: session.audience || 'geral' }));
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

  // Modals & Popups
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<IntegrationSession | null>(null);
  const [sessionModalDay, setSessionModalDay] = useState<number>(1);
  const [isAreaManagerOpen, setIsAreaManagerOpen] = useState(false);
  const [isUnitSettingsOpen, setIsUnitSettingsOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
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
    const applyCloudStatuses = async () => {
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
    };
    const unsubscribeFromStatusChanges = subscribeToIntegrationStatusChanges(() => {
      void applyCloudStatuses();
    });

    const loadCloudData = async () => {
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
      if (!sessionsResult.data?.length && !Object.keys(cloudStatuses).length) return;

      setSessions((current) => {
        const merged = new Map(current.map((session) => [session.id, session]));
        for (const session of sessionsResult.data ?? []) {
          const previous = merged.get(session.id);
          merged.set(session.id, {
            ...session,
            audience: session.audience || 'geral',
            isCompleted: Object.prototype.hasOwnProperty.call(cloudStatuses, session.id)
              ? cloudStatuses[session.id]
              : previous?.isCompleted ?? session.isCompleted ?? false,
          });
        }
        return Array.from(merged.values()).map((session) => (
          Object.prototype.hasOwnProperty.call(cloudStatuses, session.id)
            ? { ...session, isCompleted: cloudStatuses[session.id] }
            : session
        ));
      });
    };
    void loadCloudData();
    return () => {
      cancelled = true;
      unsubscribeFromStatusChanges();
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
    savedSession = {
      ...savedSession,
      audience: savedSession.audience || selectedAudience,
      isCompleted: sessionToEdit?.isCompleted ?? savedSession.isCompleted ?? false,
    };
    if (sessionToEdit) {
      setSessions((prev) =>
        prev.map((s) => (s.id === savedSession.id ? savedSession : s))
      );
      showToast('Atividade atualizada com sucesso!');
    } else {
      setSessions((prev) => [...prev, savedSession]);
      showToast('Nova atividade inserida com sucesso!');
    }
    setSessionToEdit(null);
  };

  const handleUpdateSession = (updated: IntegrationSession) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleUpdateSession(updated));
      return;
    }
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleToggleSessionStatus = async (session: IntegrationSession, isCompleted: boolean) => {
    const previousStatus = Boolean(sessions.find((item) => item.id === session.id)?.isCompleted);
    setSessions((current) => current.map((item) => (
      item.id === session.id ? { ...item, isCompleted } : item
    )));

    const { error } = await setIntegrationSessionStatus(session.id, isCompleted);
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
    showToast('Atividade duplicada com sucesso!');
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
      await copyElementAsImage('integration-capture-content');
      showToast('Agenda copiada como imagem. Agora você pode colar onde quiser.');
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
      showToast(`Importação concluída! ${parsed.length} atividades carregadas.`);
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
          <HomeScreen
            unitInfo={unitInfo}
            onSelectIntegration={() => setActiveApp('integration')}
            onSelectCalendar={() => setActiveApp('calendar')}
            onSelectFormations={() => setActiveApp('formations')}
            integrationEventsCount={sessions.length}
            calendarEventsCount={calendarEventsCount}
            onOpenAdminAccess={() => requestAdminAccess()}
            isAdmin={isAdmin}
          />
        </main>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: CRONOGRAMA DE INTEGRAÇÃO (MODULE 1) */}
      {/* ========================================================================= */}
      {activeApp === 'integration' && (
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
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div id="printable-content" className="print-container">
              <div className="hidden print:block mb-4 border-b pb-3 text-left">
                <h1 className="text-xl font-bold uppercase">{unitInfo.unitName}</h1>
                <p className="text-xs text-slate-700 font-medium">
                  {unitInfo.cohortName} — {unitInfo.period}
                </p>
                <p className="text-[10px] text-slate-500">
                  Local: {unitInfo.locationDefault} • Contato: {unitInfo.contactPerson}
                </p>
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
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: CORPORATE CALENDAR */}
      {/* ========================================================================= */}
      {activeApp === 'calendar' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <CorporateCalendarView
            onBackToHome={() => setActiveApp('home')}
            onGoToIntegration={() => setActiveApp('integration')}
            onEventsChange={setCalendarEvents}
          />
        </main>
      )}

      {activeApp === 'formations' && <FormationsDashboard />}

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
