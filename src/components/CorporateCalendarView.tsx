import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, LayoutGrid, TableProperties, Cloud, CloudOff, 
  Lock, Unlock, MapPin, PlusCircle, Printer, ChevronLeft, ChevronRight, 
  Search, Shield, AlertTriangle, Save, Download, Trash2, Edit2, Copy, 
  ExternalLink, X, CheckCircle2, AlertCircle, RefreshCw, UploadCloud, Plus
} from 'lucide-react';
import { CorporateEvent, EventCategory } from '../types/calendar';
import { useAdminAuth } from '../services/AdminAuthContext';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  getSupabaseClient, 
  fetchEventsFromSupabase, 
  upsertEventToSupabase, 
  deleteEventFromSupabase 
} from '../services/supabaseClient';

const DEFAULT_ROOMS = ["Aroeira", "Bambuzal", "Obeia", "Integração"];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CATEGORY_STYLES: Record<string, { bg: string; pill: string; dot: string; border: string }> = {
  'Reunião': { bg: 'bg-blue-50 text-blue-900', pill: 'bg-blue-100 text-blue-800', dot: 'bg-blue-600', border: 'border-blue-500' },
  'Treinamento': { bg: 'bg-emerald-50 text-emerald-900', pill: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-600', border: 'border-emerald-500' },
  'Consultoria': { bg: 'bg-amber-50 text-amber-900', pill: 'bg-amber-100 text-amber-800', dot: 'bg-amber-600', border: 'border-amber-500' },
  'Liderança': { bg: 'bg-indigo-50 text-indigo-900', pill: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-600', border: 'border-indigo-500' },
  'Geral': { bg: 'bg-purple-50 text-purple-900', pill: 'bg-purple-100 text-purple-800', dot: 'bg-purple-600', border: 'border-purple-500' },
};

function computeDurationString(start: string, end: string): string {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (endMins <= startMins) return 'Inválido';
  const diff = endMins - startMins;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h 00min`;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

interface CorporateCalendarViewProps {
  onBackToHome?: () => void;
  onGoToIntegration?: () => void;
}

export const CorporateCalendarView: React.FC<CorporateCalendarViewProps> = ({
  onBackToHome,
  onGoToIntegration,
}) => {
  const { isAdmin, hasAdminAccess, requestAdminAccess, signOutAdmin } = useAdminAuth();
  // Calendar state
  const [events, setEvents] = useState<CorporateEvent[]>(() => {
    try {
      const stored = localStorage.getItem('app_calendar_events_v3');
      return stored ? JSON.parse(stored) : [
        { id: '1', date: '2026-10-01', title: 'Apresentação de Resultados', startTime: '13:00', endTime: '14:30', duration: '1h 30min', category: 'Reunião', location: 'Aroeira', description: 'Consultoria Superior' },
        { id: '2', date: '2026-10-01', title: 'Alinhamento Estratégico', startTime: '14:30', endTime: '15:00', duration: '30min', category: 'Reunião', location: 'Bambuzal', description: 'Sala de Conferência' }
      ];
    } catch {
      return [];
    }
  });

  const [rooms, setRooms] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('app_calendar_rooms_v1');
      return stored ? JSON.parse(stored) : DEFAULT_ROOMS;
    } catch {
      return DEFAULT_ROOMS;
    }
  });

  const [activeTab, setActiveTab] = useState<'calendar' | 'events'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [tableFilter, setTableFilter] = useState('');

  // Cloud & Supabase
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudRowCount, setCloudRowCount] = useState<number | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');

  // Modals & Forms
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalEventId, setModalEventId] = useState<string | null>(null);
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [dayDetailsDate, setDayDetailsDate] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);

  // Quick form state
  const [formState, setFormState] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    title: '',
    startTime: '08:00',
    endTime: '09:30',
    duration: '1h 30min',
    category: 'Reunião',
    location: '',
    description: '',
  });

  // Modal event form state
  const [modalFormState, setModalFormState] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '09:30',
    duration: '1h 30min',
    category: 'Reunião',
    location: '',
    description: '',
  });

  const showToast = (message: string, success: boolean = true) => {
    setToast({ message, success });
    setTimeout(() => setToast(null), 3500);
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_calendar_events_v3', JSON.stringify(events));
    } catch (e) {
      console.error(e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('app_calendar_rooms_v1', JSON.stringify(rooms));
    } catch (e) {
      console.error(e);
    }
  }, [rooms]);

  // Init Supabase and load data from cloud
  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSupabaseUrlInput(creds.url);
    setSupabaseKeyInput(creds.key);

    const checkCloud = async () => {
      const client = getSupabaseClient();
      if (!client) {
        setIsCloudConnected(false);
        return;
      }
      try {
        const { data, error } = await fetchEventsFromSupabase();
        if (error) {
          console.warn('Supabase fetch failed:', error.message);
          setIsCloudConnected(false);
        } else {
          setIsCloudConnected(true);
          if (data && data.length > 0) {
            setEvents(data);
            setCloudRowCount(data.length);
          }
        }
      } catch {
        setIsCloudConnected(false);
      }
    };

    checkCloud();
  }, []);

  // Duration recalculation
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      duration: computeDurationString(prev.startTime, prev.endTime),
    }));
  }, [formState.startTime, formState.endTime]);

  useEffect(() => {
    setModalFormState((prev) => ({
      ...prev,
      duration: computeDurationString(prev.startTime, prev.endTime),
    }));
  }, [modalFormState.startTime, modalFormState.endTime]);

  // Auth protection check
  const requireAuth = (callback: () => void) => {
    if (hasAdminAccess()) {
      callback();
    } else {
      requestAdminAccess(callback);
    }
  };

  const handleToggleAuth = () => {
    if (isAdmin) {
      void signOutAdmin()
        .then(() => showToast('Sessão administrativa encerrada.'))
        .catch((error: unknown) => {
          console.error('Could not sign out of Supabase', error);
          showToast('Não foi possível encerrar a sessão administrativa.', false);
        });
    } else {
      requireAuth(() => {});
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Quick form submit
  const handleQuickFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminAccess()) {
      requireAuth(() => {});
      return;
    }

    if (formState.duration.includes('Inválido')) {
      showToast('Horário inválido!', false);
      return;
    }

    let updatedEvt: CorporateEvent;
    if (formState.id) {
      updatedEvt = {
        id: formState.id,
        date: formState.date,
        title: formState.title.trim(),
        startTime: formState.startTime,
        endTime: formState.endTime,
        duration: formState.duration,
        category: formState.category,
        location: formState.location.trim(),
        description: formState.description.trim(),
      };
      setEvents((prev) => prev.map((item) => (item.id === formState.id ? updatedEvt : item)));
    } else {
      updatedEvt = {
        id: String(Date.now()),
        date: formState.date,
        title: formState.title.trim(),
        startTime: formState.startTime,
        endTime: formState.endTime,
        duration: formState.duration,
        category: formState.category,
        location: formState.location.trim(),
        description: formState.description.trim(),
      };
      setEvents((prev) => [...prev, updatedEvt]);
    }

    // Sync to Supabase
    const res = await upsertEventToSupabase(updatedEvt);
    if (res.error) {
      showToast(`Salvo localmente (Aviso nuvem: ${res.error.message})`, false);
    } else {
      showToast('Salvo e enviado para a nuvem Supabase!');
      setIsCloudConnected(true);
    }

    // Reset form
    setFormState({
      id: '',
      date: new Date().toISOString().split('T')[0],
      title: '',
      startTime: '08:00',
      endTime: '09:30',
      duration: '1h 30min',
      category: 'Reunião',
      location: '',
      description: '',
    });
  };

  // Modal form submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminAccess()) {
      setIsEventModalOpen(false);
      requireAuth(() => setIsEventModalOpen(true));
      return;
    }

    let updatedEvt: CorporateEvent;
    if (modalEventId) {
      updatedEvt = {
        id: modalEventId,
        date: modalFormState.date,
        title: modalFormState.title.trim(),
        startTime: modalFormState.startTime,
        endTime: modalFormState.endTime,
        duration: modalFormState.duration,
        category: modalFormState.category,
        location: modalFormState.location.trim(),
        description: modalFormState.description.trim(),
      };
      setEvents((prev) => prev.map((item) => (item.id === modalEventId ? updatedEvt : item)));
    } else {
      updatedEvt = {
        id: String(Date.now()),
        date: modalFormState.date,
        title: modalFormState.title.trim(),
        startTime: modalFormState.startTime,
        endTime: modalFormState.endTime,
        duration: modalFormState.duration,
        category: modalFormState.category,
        location: modalFormState.location.trim(),
        description: modalFormState.description.trim(),
      };
      setEvents((prev) => [...prev, updatedEvt]);
    }

    const res = await upsertEventToSupabase(updatedEvt);
    if (res.error) {
      showToast(`Salvo localmente (Erro nuvem: ${res.error.message})`, false);
    } else {
      showToast('Salvo e sincronizado na nuvem com sucesso!');
    }

    setIsEventModalOpen(false);
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    requireAuth(async () => {
      if (window.confirm('Deseja excluir este compromisso da agenda e da nuvem?')) {
        setEvents((prev) => prev.filter((item) => item.id !== id));
        await deleteEventFromSupabase(id);
        showToast('Evento excluído com sucesso.');
      }
    });
  };

  // Duplicate event
  const handleDuplicateEvent = (id: string) => {
    requireAuth(async () => {
      const src = events.find((item) => item.id === id);
      if (!src) return;
      const dup: CorporateEvent = {
        ...src,
        id: String(Date.now()),
        title: `${src.title} (Cópia)`,
      };
      setEvents((prev) => [...prev, dup]);
      await upsertEventToSupabase(dup);
      showToast('Evento duplicado com sucesso!');
    });
  };

  // Open modal for editing
  const handleEditEvent = (id: string) => {
    const src = events.find((item) => item.id === id);
    if (!src) return;
    setFormState({
      id: src.id,
      date: src.date,
      title: src.title,
      startTime: src.startTime,
      endTime: src.endTime,
      duration: src.duration,
      category: src.category,
      location: src.location,
      description: src.description,
    });
    setActiveTab('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CSV Export
  const handleExportCSV = () => {
    if (events.length === 0) {
      showToast('Nenhum dado cadastrado para exportar.', false);
      return;
    }
    const headers = ['Data', 'Evento', 'Categoria', 'Inicio', 'Fim', 'Duracao', 'Local', 'Observacoes'];
    const rows = events.map((e) => [
      `"${e.date}"`,
      `"${e.title}"`,
      `"${e.category}"`,
      `"${e.startTime}"`,
      `"${e.endTime}"`,
      `"${e.duration}"`,
      `"${e.location || ''}"`,
      `"${e.description || ''}"`,
    ]);
    const csv = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario_corporativo_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Arquivo CSV exportado com sucesso!');
  };

  // Manual sync all to cloud
  const handleManualSyncAll = async () => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => { void handleManualSyncAll(); });
      return;
    }
    showToast('Enviando dados para a nuvem Supabase...', true);
    let count = 0;
    let failed = 0;
    let firstError = '';
    for (const evt of events) {
      const res = await upsertEventToSupabase(evt);
      if (!res.error) count++;
      else {
        failed++;
        firstError ||= res.error.message;
      }
    }
    setCloudRowCount(count);
    setIsCloudConnected(failed === 0);
    showToast(
      failed
        ? `Sincronização parcial: ${count} de ${events.length} eventos. ${failed} falha(s): ${firstError}`
        : `Sucesso! ${count} de ${events.length} eventos sincronizados na nuvem.`,
      failed === 0
    );
  };

  // Calendar calculations
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth();
  const firstDayOfMonth = new Date(curYear, curMonth, 1).getDay();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const prevMonthDays = new Date(curYear, curMonth, 0).getDate();
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  // Rooms management
  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    if (!rooms.some((r) => r.toLowerCase() === newRoomName.trim().toLowerCase())) {
      setRooms([...rooms, newRoomName.trim()]);
      setNewRoomName('');
      showToast(`Sala "${newRoomName.trim()}" adicionada!`);
    }
  };

  const handleDeleteRoom = (idx: number) => {
    setRooms(rooms.filter((_, i) => i !== idx));
    showToast('Sala removida.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.success
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-amber-600 text-white border-amber-700'
          }`}
        >
          {toast.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Calendar Header / Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">
                Calendário & Gestão de Eventos
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700">
                Nuvem Supabase
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Controle de salas, reuniões executivas e treinamentos com sincronização em tempo real.
            </p>
          </div>
        </div>

        {/* Tab switcher & action controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Calendar vs Table Tab */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-sky-600" />
              <span>Ver Calendário</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'events'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5 text-sky-600" />
              <span>Cadastro & Tabela</span>
              <span className="ml-1 bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
                {events.length}
              </span>
            </button>
          </div>

          {/* Cloud Status Button */}
          <button
            onClick={() => setIsCloudModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              isCloudConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
            title="Diagnóstico da Nuvem Supabase"
          >
            {isCloudConnected ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="hidden sm:inline">
              {isCloudConnected ? 'Nuvem Conectada' : 'Nuvem Offline'}
            </span>
          </button>

          {/* Auth Lock Button */}
          <button
            onClick={handleToggleAuth}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              isAdmin
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
            title={isAdmin ? 'Encerrar sessão administrativa' : 'Entrar como administrador'}
          >
            {isAdmin ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{isAdmin ? 'Modo administrador' : 'Modo leitura'}</span>
          </button>

          {/* Rooms Modal Button */}
          <button
            onClick={() => requireAuth(() => setIsRoomsModalOpen(true))}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs"
            title="Gerenciar Salas e Locais"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Salas ({rooms.length})</span>
          </button>

          {/* New Event Button */}
          <button
            onClick={() => {
              setModalEventId(null);
              setModalFormState({
                title: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '08:00',
                endTime: '09:30',
                duration: '1h 30min',
                category: 'Reunião',
                location: '',
                description: '',
              });
              requireAuth(() => setIsEventModalOpen(true));
            }}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Novo Evento</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            title="Imprimir"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CALENDAR VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Month Controls & Filter */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center min-w-[180px]">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 capitalize tracking-tight">
                  {MONTH_NAMES[curMonth]} {curYear}
                </h3>
              </div>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors ml-1"
              >
                Hoje
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar evento ou sala..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 w-48 sm:w-56"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="ALL">Todas as categorias</option>
                <option value="Reunião">Reuniões</option>
                <option value="Treinamento">Treinamentos</option>
                <option value="Consultoria">Consultorias</option>
                <option value="Liderança">Liderança</option>
                <option value="Geral">Outros</option>
              </select>
            </div>
          </div>

          {/* Calendar 7-column Grid */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-slate-900 text-white text-xs font-bold tracking-wider text-center border-b border-slate-800">
              <div className="py-2 px-1 border-r border-slate-800">Dom</div>
              <div className="py-2 px-1 border-r border-slate-800">Seg</div>
              <div className="py-2 px-1 border-r border-slate-800">Ter</div>
              <div className="py-2 px-1 border-r border-slate-800">Qua</div>
              <div className="py-2 px-1 border-r border-slate-800">Qui</div>
              <div className="py-2 px-1 border-r border-slate-800">Sex</div>
              <div className="py-2 px-1">Sáb</div>
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNumber = i - firstDayOfMonth + 1;
                const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;

                let cellDateStr = '';
                let displayDayNumber = 0;

                if (dayNumber <= 0) {
                  displayDayNumber = prevMonthDays + dayNumber;
                  const pm = curMonth === 0 ? 11 : curMonth - 1;
                  const py = curMonth === 0 ? curYear - 1 : curYear;
                  cellDateStr = `${py}-${String(pm + 1).padStart(2, '0')}-${String(displayDayNumber).padStart(2, '0')}`;
                } else if (dayNumber > daysInMonth) {
                  displayDayNumber = dayNumber - daysInMonth;
                  const nm = curMonth === 11 ? 0 : curMonth + 1;
                  const ny = curMonth === 11 ? curYear + 1 : curYear;
                  cellDateStr = `${ny}-${String(nm + 1).padStart(2, '0')}-${String(displayDayNumber).padStart(2, '0')}`;
                } else {
                  displayDayNumber = dayNumber;
                  cellDateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                }

                const today = new Date();
                const isToday =
                  isCurrentMonth &&
                  today.getDate() === dayNumber &&
                  today.getMonth() === curMonth &&
                  today.getFullYear() === curYear;

                const dayEvents = events
                  .filter((e) => {
                    if (e.date !== cellDateStr) return false;
                    if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
                    if (
                      searchQuery &&
                      !e.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                      !(e.location || '').toLowerCase().includes(searchQuery.toLowerCase())
                    )
                      return false;
                    return true;
                  })
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setDayDetailsDate(cellDateStr);
                      } else if (isCurrentMonth) {
                        requireAuth(() => {
                          setModalEventId(null);
                          setModalFormState({
                            title: '',
                            date: cellDateStr,
                            startTime: '08:00',
                            endTime: '09:30',
                            duration: '1h 30min',
                            category: 'Reunião',
                            location: '',
                            description: '',
                          });
                          setIsEventModalOpen(true);
                        });
                      }
                    }}
                    className={`min-h-[110px] sm:min-h-[125px] p-1.5 bg-white flex flex-col justify-between transition-colors relative group cursor-pointer ${
                      !isCurrentMonth ? 'bg-slate-100/70 text-slate-400 opacity-60' : 'hover:bg-sky-50/30'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                          isToday
                            ? 'bg-sky-600 text-white shadow-xs'
                            : isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {String(displayDayNumber).padStart(2, '0')}
                      </span>

                      {isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requireAuth(() => {
                              setModalEventId(null);
                              setModalFormState({
                                title: '',
                                date: cellDateStr,
                                startTime: '08:00',
                                endTime: '09:30',
                                duration: '1h 30min',
                                category: 'Reunião',
                                location: '',
                                description: '',
                              });
                              setIsEventModalOpen(true);
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-600 p-0.5 rounded transition-opacity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Events inside day */}
                    <div className="space-y-1 overflow-hidden flex-1">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const style = CATEGORY_STYLES[evt.category] || CATEGORY_STYLES['Geral'];
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDayDetailsDate(cellDateStr);
                            }}
                            className={`p-1.5 rounded-md text-[10px] border border-l-4 ${style.bg} ${style.border} transition-all hover:shadow-xs`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[9px] font-mono font-bold text-slate-600 mb-0.5 leading-none">
                              <span className="bg-white px-1 py-0.5 rounded shadow-2xs text-slate-800 whitespace-nowrap border border-black/5">
                                {evt.startTime} - {evt.endTime}
                              </span>
                              {evt.location && (
                                <span className="font-semibold text-sky-800 bg-sky-100/90 px-1 py-0.5 rounded truncate max-w-[70px] text-[8.5px] inline-flex items-center gap-0.5">
                                  <MapPin className="w-2 h-2 shrink-0 text-sky-600" />
                                  <span className="truncate">{evt.location}</span>
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-slate-900 truncate text-[10px]">
                              {evt.title}
                            </div>
                          </div>
                        );
                      })}

                      {dayEvents.length > 3 && (
                        <div className="text-[9px] font-semibold text-sky-700 bg-sky-50 px-1 py-0.5 rounded text-center">
                          +{dayEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 pt-1 gap-2 no-print">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-medium text-slate-700">Categorias:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" /> Reunião
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Treinamento
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> Consultoria
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-indigo-500 inline-block" /> Liderança
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-purple-500 inline-block" /> Geral
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isAdmin
                  ? 'Modo administrador: edição ativa'
                  : 'Modo leitura: edição disponível para administradores autenticados'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EVENTS & TABLE VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Quick Registration Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            {/* Lock overlay if not authenticated */}
            {!isAdmin && (
              <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-10 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-sm text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Formulário Protegido</h3>
                  <p className="text-xs text-slate-500">
                    Entre com uma conta administradora para liberar cadastros e alterações no Supabase.
                  </p>
                  <button
                    onClick={() => requireAuth(() => {})}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all shadow-xs"
                  >
                    Entrar como administrador
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-sky-600" />
                  {formState.id ? 'Editar Evento Corporativo' : 'Cadastrar Novo Evento Corporativo'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os campos e salve para enviar para a nuvem Supabase e salvar localmente.
                </p>
              </div>
            </div>

            <form onSubmit={handleQuickFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Evento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reunião de Resultados"
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Início *</label>
                  <input
                    type="time"
                    required
                    value={formState.startTime}
                    onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Fim *</label>
                  <input
                    type="time"
                    required
                    value={formState.endTime}
                    onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duração</label>
                  <input
                    type="text"
                    readOnly
                    value={formState.duration}
                    className="w-full text-xs px-3 py-2 bg-slate-100 font-semibold text-slate-700 border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Reunião">Reunião</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Liderança">Liderança</option>
                    <option value="Geral">Geral / Administrativo</option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" /> Local / Sala
                    </label>
                    <button
                      type="button"
                      onClick={() => requireAuth(() => setIsRoomsModalOpen(true))}
                      className="text-[11px] text-sky-600 hover:underline"
                    >
                      Gerenciar Salas
                    </button>
                  </div>
                  <input
                    type="text"
                    list="roomsDataList"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    placeholder="Selecione abaixo ou digite..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  {/* Quick Room Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Salas:</span>
                    {rooms.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormState({ ...formState, location: r })}
                        className="px-2 py-0.5 text-[10px] font-medium bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 rounded-lg shadow-2xs"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
                  <input
                    type="text"
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Ex: Pauta, responsável, link de reunião"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {formState.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormState({
                        id: '',
                        date: new Date().toISOString().split('T')[0],
                        title: '',
                        startTime: '08:00',
                        endTime: '09:30',
                        duration: '1h 30min',
                        category: 'Reunião',
                        location: '',
                        description: '',
                      })
                    }
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Cancelar Edição
                  </button>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar e Enviar para Nuvem</span>
                </button>
              </div>
            </form>
          </div>

          {/* Events Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Registros de Eventos</h3>
                <p className="text-xs text-slate-500">Sincronizados com a base Supabase</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    placeholder="Filtrar tabela..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500 w-44"
                  />
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" /> Exportar CSV
                </button>
                <button
                  onClick={() =>
                    requireAuth(() => {
                      if (window.confirm('Atenção: todos os registros serão removidos da nuvem!')) {
                        setEvents([]);
                        showToast('Registros removidos.');
                      }
                    })
                  }
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Limpar Tudo
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-4">Data</th>
                    <th className="py-2.5 px-4">Evento</th>
                    <th className="py-2.5 px-4">Categoria</th>
                    <th className="py-2.5 px-4">Início</th>
                    <th className="py-2.5 px-4">Fim</th>
                    <th className="py-2.5 px-4">Duração</th>
                    <th className="py-2.5 px-4">Local / Sala</th>
                    <th className="py-2.5 px-4">Observações</th>
                    <th className="py-2.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events
                    .filter(
                      (e) =>
                        !tableFilter ||
                        e.title.toLowerCase().includes(tableFilter.toLowerCase()) ||
                        e.date.includes(tableFilter) ||
                        (e.location || '').toLowerCase().includes(tableFilter.toLowerCase())
                    )
                    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                    .map((evt) => {
                      const style = CATEGORY_STYLES[evt.category] || CATEGORY_STYLES['Geral'];
                      const [y, m, d] = evt.date.split('-');
                      return (
                        <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-slate-700">
                            {d}/{m}/{y}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{evt.title}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.pill}`}>
                              {evt.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{evt.startTime}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{evt.endTime}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                            <span className="bg-slate-100 px-2 py-0.5 rounded">{evt.duration}</span>
                          </td>
                          <td className="py-2.5 px-4 font-medium">
                            {evt.location ? (
                              <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100">
                                {evt.location}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 truncate max-w-xs">
                            {evt.description || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDuplicateEvent(evt.id)}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                                title="Duplicar"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditEvent(evt.id)}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(evt.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
              <span>Total: <strong>{events.length}</strong> evento(s)</span>
              <span>
                {isAdmin
                  ? 'Modo administrador: edição e criação ativas'
                  : 'Modo leitura: somente administradores autenticados podem editar'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLOUD DIAGNOSTICS & SYNC */}
      {/* ========================================================================= */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Painel de Diagnóstico do Supabase</h3>
                  <p className="text-xs text-slate-500">Conexão e sincronização em tempo real</p>
                </div>
              </div>
              <button
                onClick={() => setIsCloudModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-sans font-semibold">Status do Banco de Dados:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isCloudConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isCloudConnected ? 'Conectado com Sucesso' : 'Desconectado'}
                  </span>
                </div>
                <div className="text-[11px] space-y-1 pt-1 text-slate-300">
                  <p><strong>Projeto:</strong> tgmjghxytbwafhrxdkyl</p>
                  <p><strong>Eventos Salvos:</strong> {events.length} na memória local</p>
                  <p><strong>Registros na Nuvem:</strong> {cloudRowCount ?? 'Consultando...'}</p>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-sky-950">Enviar Dados para a Nuvem</h4>
                  <p className="text-[11px] text-sky-800">
                    Sincroniza todos os registros salvos localmente com o Supabase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleManualSyncAll}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  <UploadCloud className="w-4 h-4" /> Subir Agora
                </button>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">Supabase Project URL</label>
                <input
                  type="text"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="https://xyz.supabase.co"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Supabase Public Anon Key</label>
                <input
                  type="text"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="sb_publishable_..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={async () => {
                  showToast('Testando conexão...', true);
                  const { data, error } = await fetchEventsFromSupabase();
                  if (!error) {
                    setIsCloudConnected(true);
                    setCloudRowCount(data?.length || 0);
                    showToast('Conexão testada com sucesso!');
                  } else {
                    setIsCloudConnected(false);
                    showToast(`Erro de conexão: ${error.message}`, false);
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Testar Conexão
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloudModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-200 rounded-xl"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveSupabaseCredentials(supabaseUrlInput.trim(), supabaseKeyInput.trim());
                    showToast('Credenciais salvas com sucesso!');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl"
                >
                  Salvar Chaves
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DAY DETAILS */}
      {/* ========================================================================= */}
      {dayDetailsDate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Atividades do Dia</h3>
                <p className="text-xs text-slate-500 font-mono">{dayDetailsDate}</p>
              </div>
              <button onClick={() => setDayDetailsDate(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto">
              {events.filter((x) => x.date === dayDetailsDate).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum evento registrado nesta data.</p>
              ) : (
                events
                  .filter((x) => x.date === dayDetailsDate)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((evt) => {
                    const style = CATEGORY_STYLES[evt.category] || CATEGORY_STYLES['Geral'];
                    return (
                      <div
                        key={evt.id}
                        className={`p-3 rounded-xl border border-l-4 flex items-start justify-between gap-3 ${style.bg} ${style.border}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.pill}`}>
                              {evt.category}
                            </span>
                            {evt.location && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                                {evt.location}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-slate-600">
                            {evt.startTime} às {evt.endTime} ({evt.duration})
                          </p>
                          {evt.description && <p className="text-xs text-slate-600">{evt.description}</p>}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicateEvent(evt.id)}
                            className="p-1 text-slate-400 hover:text-emerald-600"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDayDetailsDate(null);
                              handleEditEvent(evt.id);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const targetDate = dayDetailsDate;
                  setDayDetailsDate(null);
                  requireAuth(() => {
                    setModalEventId(null);
                    setModalFormState({
                      title: '',
                      date: targetDate,
                      startTime: '08:00',
                      endTime: '09:30',
                      duration: '1h 30min',
                      category: 'Reunião',
                      location: '',
                      description: '',
                    });
                    setIsEventModalOpen(true);
                  });
                }}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar neste dia
              </button>
              <button
                onClick={() => setDayDetailsDate(null)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EVENT CREATION / EDITING MODAL */}
      {/* ========================================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-sky-600" />
                {modalEventId ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reunião Executiva"
                    value={modalFormState.title}
                    onChange={(e) => setModalFormState({ ...modalFormState, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={modalFormState.date}
                    onChange={(e) => setModalFormState({ ...modalFormState, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={modalFormState.category}
                    onChange={(e) => setModalFormState({ ...modalFormState, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Reunião">Reunião</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Liderança">Liderança</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Início *</label>
                  <input
                    type="time"
                    required
                    value={modalFormState.startTime}
                    onChange={(e) => setModalFormState({ ...modalFormState, startTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fim *</label>
                  <input
                    type="time"
                    required
                    value={modalFormState.endTime}
                    onChange={(e) => setModalFormState({ ...modalFormState, endTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duração</label>
                  <input
                    type="text"
                    readOnly
                    value={modalFormState.duration}
                    className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" /> Local / Sala
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsRoomsModalOpen(true)}
                      className="text-[11px] text-sky-600 hover:underline"
                    >
                      Gerenciar Salas
                    </button>
                  </div>
                  <input
                    type="text"
                    list="roomsDataList"
                    value={modalFormState.location}
                    onChange={(e) => setModalFormState({ ...modalFormState, location: e.target.value })}
                    placeholder="Selecione ou digite..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {rooms.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setModalFormState({ ...modalFormState, location: r })}
                        className="px-2 py-0.5 text-[10px] font-medium bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 rounded-lg shadow-2xs"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
                  <input
                    type="text"
                    value={modalFormState.description}
                    onChange={(e) => setModalFormState({ ...modalFormState, description: e.target.value })}
                    placeholder="Detalhes ou link"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar e Enviar para Nuvem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ROOMS MANAGEMENT */}
      {/* ========================================================================= */}
      {isRoomsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Gerenciamento de Salas</h3>
                  <p className="text-[11px] text-slate-500">Salas e locais da unidade</p>
                </div>
              </div>
              <button onClick={() => setIsRoomsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Nova Sala / Local</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
                    placeholder="Ex: Auditório B, Sala Bambuzal"
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-sky-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddRoom}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Salas Cadastradas ({rooms.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRooms(DEFAULT_ROOMS);
                      showToast('Salas restauradas para o padrão!');
                    }}
                    className="text-[10px] text-slate-400 hover:underline"
                  >
                    Restaurar padrões
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {rooms.map((room, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs"
                    >
                      <span className="text-xs font-semibold text-slate-800">{room}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(idx)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Remover sala"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsRoomsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
