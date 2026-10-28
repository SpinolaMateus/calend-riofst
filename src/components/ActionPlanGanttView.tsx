import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, CheckCircle2, Clock, AlertTriangle, 
  Plus, Search, Filter, Edit2, Trash2, Download, Copy,
  LayoutGrid, ListFilter, ArrowRight, User, Building2, 
  BarChart3, RefreshCw, X, Check, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { 
  ActionPlanItem, 
  ActionPlanStatus, 
  ActionPlanPriority, 
  INITIAL_ACTION_PLANS 
} from '../types/actionPlan';
import { useAdminAuth } from '../services/AdminAuthContext';
import { 
  fetchActionPlansFromSupabase, 
  upsertActionPlanToSupabase, 
  deleteActionPlanFromSupabase,
  subscribeToActionPlanChanges 
} from '../services/supabaseClient';

const STORAGE_KEY_ACTIONS = 'app_action_plans_v1';

const STATUS_CONFIG: Record<ActionPlanStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  not_started: { label: 'A Fazer', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', border: 'border-slate-300' },
  in_progress: { label: 'Em Andamento', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-600', border: 'border-indigo-200' },
  completed: { label: 'Concluído', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-600', border: 'border-emerald-200' },
  delayed: { label: 'Atrasado', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-600', border: 'border-rose-200' },
  cancelled: { label: 'Cancelado', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400', border: 'border-zinc-300' },
};

const PRIORITY_CONFIG: Record<ActionPlanPriority, { label: string; badge: string }> = {
  baixa: { label: 'Baixa', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  media: { label: 'Média', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  alta: { label: 'Alta', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  critica: { label: 'Crítica', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

interface ActionPlanGanttViewProps {
  onBackToHome?: () => void;
}

export const ActionPlanGanttView: React.FC<ActionPlanGanttViewProps> = ({ onBackToHome }) => {
  const { isAdmin, hasAdminAccess, requestAdminAccess } = useAdminAuth();

  // Active view: 'gantt' | 'table'
  const [activeTab, setActiveTab] = useState<'gantt' | 'table'>('gantt');

  // State of action plan items
  const [items, setItems] = useState<ActionPlanItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIONS);
      return stored ? JSON.parse(stored) : INITIAL_ACTION_PLANS;
    } catch {
      return INITIAL_ACTION_PLANS;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionPlanItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formDepartment, setFormDepartment] = useState('GENTE E GESTÃO');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<ActionPlanStatus>('in_progress');
  const [formProgress, setFormProgress] = useState<number>(0);
  const [formPriority, setFormPriority] = useState<ActionPlanPriority>('media');
  const [formDeliverable, setFormDeliverable] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save action plans to localStorage', e);
    }
  }, [items]);

  // Load from Supabase on mount
  useEffect(() => {
    let cancelled = false;

    const loadCloudData = async () => {
      setIsLoading(true);
      const { data, error } = await fetchActionPlansFromSupabase();
      if (cancelled) return;
      setIsLoading(false);

      if (error) {
        console.warn('Could not load action plans from Supabase (using local/fallback)', error);
      } else if (data && data.length > 0) {
        setItems(data);
      }
    };

    void loadCloudData();

    // Subscribe to realtime changes
    const unsubscribe = subscribeToActionPlanChanges(() => {
      void fetchActionPlansFromSupabase().then(({ data }) => {
        if (data && data.length > 0 && !cancelled) {
          setItems(data);
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (deptFilter !== 'all' && item.department !== deptFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.responsible.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        (item.deliverable && item.deliverable.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery, statusFilter, deptFilter, priorityFilter]);

  // Distinct Departments
  const departments = useMemo(() => {
    const set = new Set(items.map((i) => i.department).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  // KPIs
  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const inProgress = items.filter((i) => i.status === 'in_progress').length;
    const delayed = items.filter((i) => i.status === 'delayed').length;
    const avgProgress = total > 0 ? Math.round(items.reduce((acc, i) => acc + i.progress, 0) / total) : 0;
    return { total, completed, inProgress, delayed, avgProgress };
  }, [items]);

  // Timeline boundaries for Gantt calculation
  const timelineDates = useMemo(() => {
    let minDate = new Date();
    let maxDate = new Date();

    if (items.length > 0) {
      const startTimes = items.map((i) => new Date(i.startDate).getTime()).filter((t) => !isNaN(t));
      const endTimes = items.map((i) => new Date(i.endDate).getTime()).filter((t) => !isNaN(t));

      if (startTimes.length > 0) minDate = new Date(Math.min(...startTimes));
      if (endTimes.length > 0) maxDate = new Date(Math.max(...endTimes));
    }

    // Add padding (7 days before and after)
    const paddedStart = new Date(minDate);
    paddedStart.setDate(paddedStart.getDate() - 3);
    const paddedEnd = new Date(maxDate);
    paddedEnd.setDate(paddedEnd.getDate() + 7);

    // Generate list of days
    const days: Date[] = [];
    const current = new Date(paddedStart);
    while (current <= paddedEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      start: paddedStart,
      end: paddedEnd,
      days,
      totalDays: days.length,
    };
  }, [items]);

  // Calculate Gantt item position (left% and width%)
  const calculateGanttPosition = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    const timelineStart = timelineDates.start.getTime();
    const timelineEnd = timelineDates.end.getTime();
    const totalDuration = timelineEnd - timelineStart;

    if (totalDuration <= 0) return { left: 0, width: 100 };

    const offset = Math.max(0, start - timelineStart);
    const duration = Math.max(86400000, end - start); // At least 1 day

    const left = Math.min(100, Math.max(0, (offset / totalDuration) * 100));
    const width = Math.min(100 - left, Math.max(2, (duration / totalDuration) * 100));

    return { left, width };
  };

  // Open modal to create new action
  const handleOpenCreateModal = () => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleOpenCreateModal());
      return;
    }
    setEditingItem(null);
    setFormTitle('');
    setFormResponsible('');
    setFormDepartment('GENTE E GESTÃO');
    const today = new Date().toISOString().split('T')[0];
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setFormStartDate(today);
    setFormEndDate(twoWeeksLater);
    setFormStatus('in_progress');
    setFormProgress(0);
    setFormPriority('media');
    setFormDeliverable('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing action
  const handleOpenEditModal = (item: ActionPlanItem) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleOpenEditModal(item));
      return;
    }
    setEditingItem(item);
    setFormTitle(item.title);
    setFormResponsible(item.responsible);
    setFormDepartment(item.department);
    setFormStartDate(item.startDate);
    setFormEndDate(item.endDate);
    setFormStatus(item.status);
    setFormProgress(item.progress);
    setFormPriority(item.priority);
    setFormDeliverable(item.deliverable || '');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const updatedItem: ActionPlanItem = {
      id: editingItem ? editingItem.id : `act-${Date.now()}`,
      title: formTitle.trim(),
      responsible: formResponsible.trim() || 'Equipe Geral',
      department: formDepartment.trim() || 'GERAL',
      startDate: formStartDate,
      endDate: formEndDate,
      status: formProgress === 100 ? 'completed' : formStatus,
      progress: formProgress,
      priority: formPriority,
      deliverable: formDeliverable.trim(),
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString(),
    };

    // Update local state immediately
    if (editingItem) {
      setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
      showToast('Ação atualizada com sucesso!');
    } else {
      setItems((prev) => [...prev, updatedItem]);
      showToast('Nova ação cadastrada no plano!');
    }

    setIsModalOpen(false);

    // Save to Supabase Cloud
    const { error } = await upsertActionPlanToSupabase(updatedItem);
    if (error) {
      console.error('Could not save action plan to Supabase', error);
      showToast('Salvo localmente. Execute o SQL de atualização no Supabase para sincronização em nuvem.', 'info');
    }
  };

  // Delete Action
  const handleDeleteAction = async (id: string) => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleDeleteAction(id));
      return;
    }

    if (!window.confirm('Deseja realmente remover esta ação do plano?')) return;

    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Ação removida.', 'info');

    const { error } = await deleteActionPlanFromSupabase(id);
    if (error) {
      console.warn('Could not delete from Supabase', error);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Acao', 'Responsavel', 'Setor', 'Data_Inicio', 'Data_Fim', 'Status', 'Progresso_%', 'Prioridade', 'Entregavel', 'Observacoes'];
    const rows = items.map((i) => [
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.responsible.replace(/"/g, '""')}"`,
      `"${i.department.replace(/"/g, '""')}"`,
      `"${i.startDate}"`,
      `"${i.endDate}"`,
      `"${STATUS_CONFIG[i.status]?.label || i.status}"`,
      `"${i.progress}"`,
      `"${PRIORITY_CONFIG[i.priority]?.label || i.priority}"`,
      `"${(i.deliverable || '').replace(/"/g, '""')}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plano_de_acao_gantt_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha CSV exportada com sucesso!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold border animate-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-indigo-600 text-white border-indigo-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white shrink-0" />}
          {toast.type === 'info' && <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Plano de Ação • Modelo Gantt
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Sincronizado Supabase
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Controle cronológico de entregas operacionais, marcos de projetos e acompanhamento visual por linha do tempo.
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'gantt'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Linha Gantt</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cadastro & Tabela</span>
              <span className="ml-1 bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
                {items.length}
              </span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs"
            title="Exportar dados para Excel (.csv)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* New Action Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ação</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Ações</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">cadastradas no plano</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluídas
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-700">{stats.completed}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">entregas homologadas</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Em Andamento
          </div>
          <div className="mt-1 text-2xl font-black text-indigo-700">{stats.inProgress}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">em execução no polo</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Atrasadas
          </div>
          <div className="mt-1 text-2xl font-black text-rose-700">{stats.delayed}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">requerem atenção</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Avanço Global</div>
          <div className="mt-1 text-2xl font-black text-indigo-600">{stats.avgProgress}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.avgProgress}%` }} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER BAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por título, responsável ou entregável..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Todos os Status</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluídos</option>
            <option value="delayed">Atrasados</option>
            <option value="not_started">A Fazer</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Todos os Setores</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          {(searchQuery || statusFilter !== 'all' || deptFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDeptFilter('all');
                setPriorityFilter('all');
              }}
              className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: VISUALIZAÇÃO GANTT */}
      {/* ========================================================================= */}
      {activeTab === 'gantt' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Header of Gantt */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Cronograma Visual de Gantt</span>
              <span className="text-xs text-slate-500">
                ({filteredItems.length} ações exibidas)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" /> Concluído
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-500" /> Em Andamento
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-500" /> Atrasado
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-300" /> A Fazer
              </div>
            </div>
          </div>

          {/* Interactive Gantt Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              
              {/* Gantt Timeline Dates Header */}
              <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600">
                <div className="col-span-4 p-3 border-r border-slate-200">
                  Ação / Responsável / Setor
                </div>
                <div className="col-span-8 p-3 flex justify-between items-center">
                  <span>Início: {timelineDates.start.toLocaleDateString('pt-BR')}</span>
                  <span className="text-indigo-600 font-extrabold uppercase tracking-wider text-[10px] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">
                    Hoje: {new Date().toLocaleDateString('pt-BR')}
                  </span>
                  <span>Término: {timelineDates.end.toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Gantt Rows */}
              <div className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Nenhuma ação encontrada com os filtros selecionados.
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const pos = calculateGanttPosition(item.startDate, item.endDate);
                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.in_progress;
                    const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.media;

                    return (
                      <div 
                        key={item.id}
                        className="grid grid-cols-12 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleOpenEditModal(item)}
                      >
                        {/* Left column: Action Details */}
                        <div className="col-span-4 p-3.5 border-r border-slate-200 flex flex-col justify-center space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {item.title}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${priorityCfg.badge}`}>
                              {priorityCfg.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <User className="w-3 h-3 text-slate-400" />
                              {item.responsible}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[120px] text-slate-500">
                              {item.department}
                            </span>
                          </div>
                        </div>

                        {/* Right column: Gantt Bar Track */}
                        <div className="col-span-8 p-3 flex items-center relative overflow-hidden">
                          {/* Background Grid Lines */}
                          <div className="absolute inset-0 grid grid-cols-6 divide-x divide-slate-100 pointer-events-none opacity-60">
                            <div /><div /><div /><div /><div /><div />
                          </div>

                          {/* Gantt Bar */}
                          <div
                            className="relative h-7 rounded-xl shadow-xs transition-all flex items-center px-2.5 overflow-hidden border"
                            style={{
                              marginLeft: `${pos.left}%`,
                              width: `${pos.width}%`,
                              minWidth: '40px',
                              backgroundColor: item.status === 'completed' ? '#ecfdf5' : item.status === 'delayed' ? '#fff1f2' : item.status === 'not_started' ? '#f8fafc' : '#eef2ff',
                              borderColor: item.status === 'completed' ? '#10b981' : item.status === 'delayed' ? '#f43f5e' : item.status === 'not_started' ? '#cbd5e1' : '#6366f1',
                            }}
                          >
                            {/* Inner Progress Fill */}
                            <div
                              className="absolute top-0 bottom-0 left-0 opacity-25"
                              style={{
                                width: `${item.progress}%`,
                                backgroundColor: item.status === 'completed' ? '#059669' : item.status === 'delayed' ? '#e11d48' : item.status === 'not_started' ? '#94a3b8' : '#4f46e5',
                              }}
                            />

                            <span className="relative z-10 text-[10px] font-extrabold truncate text-slate-800">
                              {item.progress}% • {new Date(item.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} até {new Date(item.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: CADASTRO & TABELA DE GESTÃO */}
      {/* ========================================================================= */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Ação / Título</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-3">Setor</th>
                  <th className="py-3 px-3">Início</th>
                  <th className="py-3 px-3">Prazo Final</th>
                  <th className="py-3 px-3">Progresso</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Prioridade</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Nenhuma ação cadastrada no plano.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.in_progress;
                    const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.media;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                          <div className="line-clamp-2">{item.title}</div>
                          {item.deliverable && (
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate">
                              Entregável: {item.deliverable}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {item.responsible}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                          {item.department}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                          {new Date(item.startDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                          {new Date(item.endDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700">{item.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityCfg.badge}`}>
                            {priorityCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar Ação"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAction(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Excluir Ação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CADASTRO / EDIÇÃO DE AÇÃO */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingItem ? 'Editar Ação do Plano' : 'Cadastrar Nova Ação'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina o escopo, prazos, responsável e status de acompanhamento.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAction} className="space-y-4 text-xs font-semibold">
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-slate-700">Título da Ação / Atividade *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Treinamento Prático de NR-12 com Turno A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Responsible and Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700">Responsável pela Execução *</label>
                  <input
                    type="text"
                    required
                    value={formResponsible}
                    onChange={(e) => setFormResponsible(e.target.value)}
                    placeholder="Ex: Eng. de Segurança / Mateus"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700">Setor / Departamento</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="Ex: GENTE E GESTÃO, SEGURANÇA..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Start and End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700">Data de Início *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700">Data de Término / Prazo *</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ActionPlanStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="not_started">A Fazer</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="delayed">Atrasado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700">Prioridade</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as ActionPlanPriority)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-bold">Progresso de Conclusão</span>
                  <span className="font-extrabold text-indigo-600">{formProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formProgress}
                  onChange={(e) => setFormProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Deliverable and Notes */}
              <div className="space-y-1">
                <label className="block text-slate-700">Entregável Esperado / Evidência</label>
                <input
                  type="text"
                  value={formDeliverable}
                  onChange={(e) => setFormDeliverable(e.target.value)}
                  placeholder="Ex: Lista de presença assinada e fotos do treinamento"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700">Observações Adicionais</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Informações complementares para alinhamento..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Ação'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
