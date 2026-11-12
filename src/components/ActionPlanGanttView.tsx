import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, CheckCircle2, Clock, AlertTriangle, 
  Plus, Search, Filter, Edit2, Trash2, Download, Copy,
  LayoutGrid, ListFilter, ArrowRight, User, Building2, 
  BarChart3, RefreshCw, X, Check, AlertCircle, FileText, ChevronRight,
  Sparkles, Layers, Target, Bookmark, HelpCircle,
  MessageSquare, MessageSquarePlus, Sliders, Eye, EyeOff,
  Globe, Shield, ShieldCheck, Lock, Unlock, Users, UserCheck
} from 'lucide-react';
import { 
  ActionPlanItem, 
  ActionPlanStatus, 
  ActionPlanPriority, 
  ActionPlanType,
  ActionPlanScope,
  INITIAL_ACTION_PLANS,
  PILAR_ET_TEMPLATE,
  PILAR_ET_STEPS
} from '../types/actionPlan';
import { useAdminAuth } from '../services/AdminAuthContext';
import { useUserProfile } from '../services/UserProfileContext';
import { UserManagerModal } from './UserManagerModal';
import { 
  fetchActionPlansFromSupabase, 
  upsertActionPlanToSupabase, 
  deleteActionPlanFromSupabase,
  subscribeToActionPlanChanges 
} from '../services/supabaseClient';
import { copyElementAsImage } from '../utils/exportUtils';

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
  const { currentUser, users, isEffectiveAdmin } = useUserProfile();

  // Active view: 'gantt' | 'table'
  const [activeTab, setActiveTab] = useState<'gantt' | 'table'>('gantt');

  // User Management Modal State
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);

  // Scope / Privacy Filter: 'all' | 'public' | 'private'
  const [scopeView, setScopeView] = useState<'all' | 'public' | 'private'>('all');
  const [adminUserFilter, setAdminUserFilter] = useState<string>('all');

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
  const [isCopyingImage, setIsCopyingImage] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionPlanItem | null>(null);

  // Template Modal State (Carregar Pilar ET)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formStep, setFormStep] = useState<string>(PILAR_ET_STEPS[0]);
  const [formKind, setFormKind] = useState<ActionPlanType>('metodo');
  const [formScope, setFormScope] = useState<ActionPlanScope>('public');
  const [formOwnerId, setFormOwnerId] = useState<string>('');
  const [formOwnerName, setFormOwnerName] = useState<string>('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formDepartment, setFormDepartment] = useState('Pilar Educação e Treinamento');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<ActionPlanStatus>('in_progress');
  const [formProgress, setFormProgress] = useState<number>(0);
  const [formPriority, setFormPriority] = useState<ActionPlanPriority>('media');
  const [formDeliverable, setFormDeliverable] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Gantt Customization State (Time scale & Inline Comments)
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month'>('week');
  const [showCommentsBelowBar, setShowCommentsBelowBar] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const handleSaveComment = async (itemId: string, newComment: string) => {
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    const updatedItem: ActionPlanItem = {
      ...target,
      notes: newComment.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    const updatedList = items.map((i) => (i.id === itemId ? updatedItem : i));
    setItems(updatedList);
    setEditingCommentId(null);
    setCommentInput('');

    const { error } = await upsertActionPlanToSupabase(updatedItem);
    if (error) {
      showToast('Salvo localmente (erro ao sincronizar na nuvem)', 'info');
    } else {
      showToast('Comentário atualizado com sucesso!', 'success');
    }
  };

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

  // Filtered Items (Scoped by User & Privacy Rules)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemScope = item.scope || 'public';
      const isOwner = Boolean(
        (item.ownerId && item.ownerId === currentUser.id) ||
        (item.ownerName && item.ownerName.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
      );

      // Regras de Privacidade por Usuário
      if (!isEffectiveAdmin) {
        // Usuário Padrão: NUNCA enxerga ações privadas de terceiros!
        if (itemScope === 'private' && !isOwner) {
          return false;
        }

        // Filtro de Escopo do Usuário Comum
        if (scopeView === 'public' && itemScope !== 'public') return false;
        if (scopeView === 'private' && itemScope !== 'private') return false;
      } else {
        // Administrador: tem superpoder de enxergar tudo o que todos postam!
        if (scopeView === 'public' && itemScope !== 'public') return false;
        if (scopeView === 'private' && itemScope !== 'private') return false;

        // Filtro opcional do Admin por usuário específico
        if (adminUserFilter !== 'all') {
          const selectedTargetUser = users.find((u) => u.id === adminUserFilter);
          const matchesId = item.ownerId === adminUserFilter;
          const matchesName = selectedTargetUser && item.ownerName && item.ownerName.toLowerCase().trim() === selectedTargetUser.name.toLowerCase().trim();
          if (!matchesId && !matchesName) return false;
        }
      }

      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (stepFilter !== 'all' && item.step !== stepFilter) return false;
      if (kindFilter !== 'all' && (item.kind || 'metodo') !== kindFilter) return false;
      if (deptFilter !== 'all' && item.department !== deptFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.responsible.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        (item.ownerName && item.ownerName.toLowerCase().includes(q)) ||
        (item.step && item.step.toLowerCase().includes(q)) ||
        (item.deliverable && item.deliverable.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery, statusFilter, stepFilter, kindFilter, deptFilter, priorityFilter, scopeView, adminUserFilter, currentUser, isEffectiveAdmin, users]);

  // Distinct Steps present in current items
  const distinctSteps = useMemo(() => {
    const set = new Set<string>();
    PILAR_ET_STEPS.forEach((s) => set.add(s));
    items.forEach((i) => {
      if (i.step) set.add(i.step);
    });
    return Array.from(set);
  }, [items]);

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
    const metodosCount = items.filter((i) => (i.kind || 'metodo') === 'metodo').length;
    const resultadosCount = items.filter((i) => i.kind === 'resultado').length;
    return { total, completed, inProgress, delayed, avgProgress, metodosCount, resultadosCount };
  }, [items]);

  // Timeline boundaries and divisions for Gantt calculation based on timeScale
  const timelineData = useMemo(() => {
    let minDate = new Date();
    let maxDate = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (items.length > 0) {
      const startTimes = items.map((i) => new Date(i.startDate).getTime()).filter((t) => !isNaN(t));
      const endTimes = items.map((i) => new Date(i.endDate).getTime()).filter((t) => !isNaN(t));

      if (startTimes.length > 0) minDate = new Date(Math.min(...startTimes, today.getTime()));
      if (endTimes.length > 0) maxDate = new Date(Math.max(...endTimes, today.getTime()));
    }

    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);

    let rangeStart = new Date(minDate);
    let rangeEnd = new Date(maxDate);

    interface TimelineDivision {
      id: string;
      label: string;
      subLabel?: string;
      start: Date;
      end: Date;
      leftPct: number;
      widthPct: number;
      isWeekend?: boolean;
      isCurrent?: boolean;
    }

    const divisions: TimelineDivision[] = [];

    if (timeScale === 'month') {
      // Month scale: snap to 1st of start month to end of finish month (+1 padding month)
      rangeStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1, 0, 0, 0, 0);
      rangeEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0, 23, 59, 59, 999);

      const totalDuration = rangeEnd.getTime() - rangeStart.getTime();

      let curr = new Date(rangeStart);
      while (curr < rangeEnd) {
        const dStart = new Date(curr);
        const dEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0, 23, 59, 59, 999);
        const cappedEnd = dEnd > rangeEnd ? rangeEnd : dEnd;

        const leftPct = Math.max(0, ((dStart.getTime() - rangeStart.getTime()) / totalDuration) * 100);
        const widthPct = Math.max(0, ((cappedEnd.getTime() - dStart.getTime()) / totalDuration) * 100);

        const monthName = dStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
        const year = dStart.getFullYear();
        const isCurrent = today >= dStart && today <= cappedEnd;

        divisions.push({
          id: `m-${monthName}-${year}`,
          label: `${monthName}/${year}`,
          subLabel: `${dStart.getDate().toString().padStart(2, '0')} a ${cappedEnd.getDate().toString().padStart(2, '0')}`,
          start: dStart,
          end: cappedEnd,
          leftPct,
          widthPct,
          isCurrent,
        });

        // Next month
        curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1, 0, 0, 0, 0);
      }
    } else if (timeScale === 'week') {
      // Week scale: snap to Monday before minDate and Sunday after maxDate
      const dayOfWeek = (rangeStart.getDay() + 6) % 7; // 0 = Monday
      rangeStart.setDate(rangeStart.getDate() - dayOfWeek - 7); // 1 extra week padding
      rangeStart.setHours(0, 0, 0, 0);

      const endDayOfWeek = (rangeEnd.getDay() + 6) % 7;
      rangeEnd.setDate(rangeEnd.getDate() + (6 - endDayOfWeek) + 7); // 1 extra week padding
      rangeEnd.setHours(23, 59, 59, 999);

      const totalDuration = rangeEnd.getTime() - rangeStart.getTime();

      let curr = new Date(rangeStart);
      let weekIndex = 1;
      while (curr < rangeEnd) {
        const dStart = new Date(curr);
        const dEnd = new Date(curr);
        dEnd.setDate(dEnd.getDate() + 6);
        dEnd.setHours(23, 59, 59, 999);
        const cappedEnd = dEnd > rangeEnd ? rangeEnd : dEnd;

        const leftPct = Math.max(0, ((dStart.getTime() - rangeStart.getTime()) / totalDuration) * 100);
        const widthPct = Math.max(0, ((cappedEnd.getTime() - dStart.getTime()) / totalDuration) * 100);

        const isCurrent = today >= dStart && today <= cappedEnd;
        const fmtStart = `${dStart.getDate().toString().padStart(2, '0')}/${(dStart.getMonth() + 1).toString().padStart(2, '0')}`;
        const fmtEnd = `${cappedEnd.getDate().toString().padStart(2, '0')}/${(cappedEnd.getMonth() + 1).toString().padStart(2, '0')}`;

        divisions.push({
          id: `w-${dStart.getTime()}`,
          label: `Semana ${weekIndex}`,
          subLabel: `${fmtStart} - ${fmtEnd}`,
          start: dStart,
          end: cappedEnd,
          leftPct,
          widthPct,
          isCurrent,
        });

        weekIndex++;
        curr.setDate(curr.getDate() + 7);
      }
    } else {
      // Day scale: daily divisions with 2 days padding
      rangeStart.setDate(rangeStart.getDate() - 2);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setDate(rangeEnd.getDate() + 3);
      rangeEnd.setHours(23, 59, 59, 999);

      const totalDuration = rangeEnd.getTime() - rangeStart.getTime();

      let curr = new Date(rangeStart);
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      while (curr < rangeEnd) {
        const dStart = new Date(curr);
        const dEnd = new Date(curr);
        dEnd.setHours(23, 59, 59, 999);
        const cappedEnd = dEnd > rangeEnd ? rangeEnd : dEnd;

        const leftPct = Math.max(0, ((dStart.getTime() - rangeStart.getTime()) / totalDuration) * 100);
        const widthPct = Math.max(0, ((cappedEnd.getTime() - dStart.getTime()) / totalDuration) * 100);

        const dayNum = dStart.getDay();
        const isWeekend = dayNum === 0 || dayNum === 6;
        const isCurrent = today.getTime() === dStart.getTime();

        divisions.push({
          id: `d-${dStart.getTime()}`,
          label: `${dStart.getDate().toString().padStart(2, '0')}/${(dStart.getMonth() + 1).toString().padStart(2, '0')}`,
          subLabel: weekDays[dayNum],
          start: dStart,
          end: cappedEnd,
          leftPct,
          widthPct,
          isWeekend,
          isCurrent,
        });

        curr.setDate(curr.getDate() + 1);
      }
    }

    const totalDuration = rangeEnd.getTime() - rangeStart.getTime();
    let todayPosition: number | null = null;
    const nowTime = Date.now();
    if (nowTime >= rangeStart.getTime() && nowTime <= rangeEnd.getTime() && totalDuration > 0) {
      todayPosition = ((nowTime - rangeStart.getTime()) / totalDuration) * 100;
    }

    return {
      start: rangeStart,
      end: rangeEnd,
      totalDuration,
      divisions,
      todayPosition,
      minWidthClass: timeScale === 'day' ? 'min-w-[1800px]' : timeScale === 'week' ? 'min-w-[1200px]' : 'min-w-[1000px]',
    };
  }, [items, timeScale]);

  // Backward compatibility alias for any existing reference
  const timelineDates = useMemo(() => ({
    start: timelineData.start,
    end: timelineData.end,
    totalDays: Math.ceil(timelineData.totalDuration / 86400000),
  }), [timelineData]);

  // Calculate Gantt item position (left% and width%)
  const calculateGanttPosition = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    const timelineStart = timelineData.start.getTime();
    const totalDuration = timelineData.totalDuration;

    if (totalDuration <= 0) return { left: 0, width: 100 };

    const offset = Math.max(0, start - timelineStart);
    const duration = Math.max(86400000, end - start); // At least 1 day

    const left = Math.min(100, Math.max(0, (offset / totalDuration) * 100));
    const width = Math.min(100 - left, Math.max(2, (duration / totalDuration) * 100));

    return { left, width };
  };

  // Open modal to create new action (Admin or User's Private Plan)
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormStep(PILAR_ET_STEPS[0]);
    setFormKind('metodo');
    // Se for usuário comum, sugere como privado por padrão; se for admin, aberto
    setFormScope(isEffectiveAdmin ? 'public' : 'private');
    setFormOwnerId(currentUser.id);
    setFormOwnerName(currentUser.name);
    setFormResponsible(currentUser.name || '');
    setFormDepartment(currentUser.department || 'Pilar Educação e Treinamento');
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
    const isOwner = Boolean(
      (item.ownerId && item.ownerId === currentUser.id) ||
      (item.ownerName && item.ownerName.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
    );

    // Se não for admin e não for dono da ação, exige elevação admin
    if (!isEffectiveAdmin && !isOwner && !hasAdminAccess()) {
      requestAdminAccess(() => handleOpenEditModal(item));
      return;
    }

    setEditingItem(item);
    setFormTitle(item.title);
    setFormStep(item.step || PILAR_ET_STEPS[0]);
    setFormKind(item.kind || 'metodo');
    setFormScope(item.scope || 'public');
    setFormOwnerId(item.ownerId || currentUser.id);
    setFormOwnerName(item.ownerName || currentUser.name);
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

  // Handle template selection inside the form
  const handleSelectPresetAction = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const preset = PILAR_ET_TEMPLATE.find((p) => p.id === selectedId);
    if (!preset) return;

    setFormTitle(preset.title);
    setFormStep(preset.step || PILAR_ET_STEPS[0]);
    setFormKind(preset.kind || 'metodo');
    setFormResponsible(preset.responsible);
    setFormDepartment(preset.department);
    setFormStartDate(preset.startDate);
    setFormEndDate(preset.endDate);
    setFormPriority(preset.priority);
    setFormDeliverable(preset.deliverable || '');
    setFormNotes(preset.notes || '');
  };

  // Save (Create or Update)
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const updatedItem: ActionPlanItem = {
      id: editingItem ? editingItem.id : `act-${Date.now()}`,
      title: formTitle.trim(),
      step: formStep,
      kind: formKind,
      scope: formScope,
      ownerId: formScope === 'private' ? (formOwnerId || currentUser.id) : undefined,
      ownerName: formScope === 'private' ? (formOwnerName || currentUser.name) : undefined,
      responsible: formResponsible.trim() || currentUser.name || 'Pilar Educação e Treinamento',
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
      showToast(formScope === 'private' ? 'Ação salva no seu Plano Pessoal!' : 'Nova ação cadastrada no Plano Aberto!');
    }

    setIsModalOpen(false);

    // Save to Supabase Cloud
    const { error } = await upsertActionPlanToSupabase(updatedItem);
    if (error) {
      console.error('Could not save action plan to Supabase', error);
      showToast('Salvo localmente.', 'info');
    }
  };

  // Delete Action
  const handleDeleteAction = async (id: string) => {
    const target = items.find((i) => i.id === id);
    const isOwner = target && Boolean(
      (target.ownerId && target.ownerId === currentUser.id) ||
      (target.ownerName && target.ownerName.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
    );

    if (!isEffectiveAdmin && !isOwner && !hasAdminAccess()) {
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

  // Load Full Pilar ET Template (Substituir ou Adicionar)
  const handleApplyPilarETTemplate = async (mode: 'replace' | 'append') => {
    if (!hasAdminAccess()) {
      requestAdminAccess(() => handleApplyPilarETTemplate(mode));
      return;
    }

    setIsCloudSyncing(true);

    let nextItems: ActionPlanItem[] = [];
    if (mode === 'replace') {
      nextItems = [...PILAR_ET_TEMPLATE];
    } else {
      const existingIds = new Set(items.map((i) => i.id));
      const newItems = PILAR_ET_TEMPLATE.filter((p) => !existingIds.has(p.id));
      nextItems = [...items, ...newItems];
    }

    setItems(nextItems);
    setIsTemplateModalOpen(false);
    showToast(`Modelo Pilar ET carregado (${nextItems.length} ações no plano)!`);

    // Sync items in background to Supabase
    try {
      for (const item of PILAR_ET_TEMPLATE) {
        await upsertActionPlanToSupabase(item);
      }
      showToast('Modelo sincronizado com o Supabase!', 'success');
    } catch (err) {
      console.warn('Batch sync notice:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Etapa',
      'Tipo',
      'Acao',
      'Responsavel',
      'Setor',
      'Data_Inicio',
      'Data_Fim',
      'Status',
      'Progresso_%',
      'Prioridade',
      'Entregavel',
      'Observacoes'
    ];
    const rows = items.map((i) => [
      `"${(i.step || '').replace(/"/g, '""')}"`,
      `"${((i.kind || 'metodo') === 'resultado' ? 'RESULTADO' : 'MÉTODO').replace(/"/g, '""')}"`,
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
    link.download = `plano_de_acao_pilar_et_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha CSV exportada com sucesso!');
  };

  // Copy Gantt / Action Plan as Image
  const handleCopyGanttAsImage = async () => {
    try {
      setIsCopyingImage(true);
      const res = await copyElementAsImage('action-plan-gantt-capture', 'plano_de_acao_gantt');
      if (res.method === 'clipboard') {
        showToast('Plano de ação copiado como imagem! Você já pode colar onde quiser.');
      } else {
        showToast('Imagem do plano de ação baixada com sucesso no seu computador!');
      }
    } catch (error) {
      console.error('Could not copy action plan as image', error);
      showToast(error instanceof Error ? error.message : 'Não foi possível copiar o plano como imagem.', 'error');
    } finally {
      setIsCopyingImage(false);
    }
  };

  return (
    <div id="action-plan-gantt-capture" className="space-y-6 animate-in fade-in duration-300">
      
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
      <div data-capture-ignore className="no-print bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Plano de Ação • Modelo Gantt
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Pilar Educação & Treinamento
              </span>
              {isCloudSyncing && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Sincronizando...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Controle cronológico de entregas operacionais (Etapa 0 a Passo 6), separação por Método/Resultado e linha do tempo interativa.
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

          {/* Load Pilar ET Template Button */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 transition-all shadow-xs"
            title="Carregar ou restaurar as 52 ações padronizadas do Pilar ET"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Modelo Pilar ET</span>
          </button>

          {/* Copy as Image */}
          <button
            type="button"
            onClick={handleCopyGanttAsImage}
            disabled={isCopyingImage}
            data-capture-ignore
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-xs disabled:opacity-50"
            title="Copiar visualização como imagem para WhatsApp, Teams ou e-mail"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isCopyingImage ? 'Capturando...' : 'Copiar como imagem'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            data-capture-ignore
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
      {/* BANNER DE IDENTIDADE & CONTROLE DE PRIVACIDADE (PADRÃO ABERTO VS PESSOAL) */}
      {/* ========================================================================= */}
      <div data-capture-ignore className="no-print bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* User Identity Info */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-indigo-600 to-violet-600'} text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 border border-white/20`}>
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Perfil Ativo:</span>
              <span className="text-xs font-black text-white">{currentUser.name}</span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                isEffectiveAdmin
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-white/10 text-slate-300 border-white/20'
              }`}>
                {isEffectiveAdmin ? '🛡️ Administrador Geral' : '👤 Usuário Padrão'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isEffectiveAdmin 
                ? 'Visão Administrativa: você visualiza o que todos os usuários postam e gerencia permissões da unidade.' 
                : 'Visão de Usuário: suas ações pessoais são privadas e você acessa o plano institucional padrão da unidade.'}
            </p>
          </div>
        </div>

        {/* Scope View Switcher & UserManager Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Filters */}
          <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setScopeView('public');
                setAdminUserFilter('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                scopeView === 'public'
                  ? 'bg-white text-slate-900 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Exibir o Plano Padrão Aberto (compartilhado por toda a unidade)"
            >
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>Plano Aberto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScopeView('private');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                scopeView === 'private'
                  ? 'bg-white text-slate-900 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={isEffectiveAdmin ? 'Exibir ações pessoais de usuários' : 'Exibir apenas o meu plano pessoal (privado)'}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>{isEffectiveAdmin ? 'Ações Privadas' : 'Meu Plano Pessoal'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScopeView('all');
                setAdminUserFilter('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                scopeView === 'all' && adminUserFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={isEffectiveAdmin ? 'Visão total de administrador (Aberto + Todas as ações privadas)' : 'Visão combinada (Aberto + Meu Pessoal)'}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isEffectiveAdmin ? 'Visão Global (Admin)' : 'Todos os Meus'}</span>
            </button>
          </div>

          {/* Admin User Picker (quando admin estiver filtrando) */}
          {isEffectiveAdmin && scopeView === 'private' && (
            <select
              value={adminUserFilter}
              onChange={(e) => setAdminUserFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Filtrar ações privadas por colaborador específico"
            >
              <option value="all">👥 Todos os Colaboradores</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  🔒 {u.name} ({u.department})
                </option>
              ))}
            </select>
          )}

          {/* Button to open User Management */}
          <button
            type="button"
            onClick={() => setIsUserManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all shadow-xs"
            title="Abrir gestão de administradores, usuários e trocar de perfil ativo"
          >
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span>Gerenciar Usuários</span>
          </button>
        </div>
      </div>

      {/* Cabeçalho Executivo Inteligente para Captura de Imagem e Impressão */}
      <div className="capture-only hidden bg-white p-5 rounded-3xl border border-slate-200 mb-4 text-left shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase">
              Plano de Ação • Modelo Gantt — Pilar Educação & Treinamento
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              Acompanhamento de Marcos e Entregáveis (Etapa 0 a Passo 6) • Unidade Feira de Santana
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 bg-indigo-600 text-white rounded-xl shadow-xs">
              {filteredItems.length} Ações Mapeadas
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Ações</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">cadastradas no plano</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Métodos
          </div>
          <div className="mt-1 text-2xl font-black text-sky-700">{stats.metodosCount}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">ações de processo</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Target className="w-3.5 h-3.5" /> Resultados
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-700">{stats.resultadosCount}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">marcos de entrega</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Em Andamento
          </div>
          <div className="mt-1 text-2xl font-black text-indigo-700">{stats.inProgress}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">em execução</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Atrasadas
          </div>
          <div className="mt-1 text-2xl font-black text-rose-700">{stats.delayed}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-medium">requerem atenção</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Avanço Médio</div>
          <div className="mt-1 text-2xl font-black text-indigo-600">{stats.avgProgress}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.avgProgress}%` }} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER BAR */}
      {/* ========================================================================= */}
      <div data-capture-ignore className="no-print bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por título, responsável, entregável ou etapa..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Step / Etapa Filter */}
          <select
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[190px] truncate"
            title="Filtrar por Etapa / Passo"
          >
            <option value="all">Todas as Etapas / Passos</option>
            {distinctSteps.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Kind / Tipo Filter */}
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Todos os Tipos</option>
            <option value="metodo">MÉTODO (Processos)</option>
            <option value="resultado">RESULTADO (Marcos)</option>
          </select>

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

          {(searchQuery || stepFilter !== 'all' || kindFilter !== 'all' || statusFilter !== 'all' || deptFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStepFilter('all');
                setKindFilter('all');
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
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 text-sm">Cronograma Visual de Gantt</span>
              <span className="text-xs text-slate-500">
                ({filteredItems.length} ações exibidas)
              </span>

              {/* Recorte Temporal (Dia, Semana, Mês) */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-slate-400" />
                  Escala:
                </span>
                <button
                  type="button"
                  onClick={() => setTimeScale('month')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    timeScale === 'month'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Recorte por Meses"
                >
                  Por Mês
                </button>
                <button
                  type="button"
                  onClick={() => setTimeScale('week')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    timeScale === 'week'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Recorte por Semanas"
                >
                  Por Semana
                </button>
                <button
                  type="button"
                  onClick={() => setTimeScale('day')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    timeScale === 'day'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Recorte por Dias individuais"
                >
                  Por Dia
                </button>
              </div>

              {/* Toggle de Comentários abaixo da barra */}
              <button
                type="button"
                onClick={() => setShowCommentsBelowBar(!showCommentsBelowBar)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all ${
                  showCommentsBelowBar
                    ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
                title={showCommentsBelowBar ? 'Ocultar comentários abaixo das faixas' : 'Exibir comentários abaixo das faixas'}
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>Comentários</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({showCommentsBelowBar ? 'Visíveis' : 'Ocultos'})
                </span>
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky-500" /> Método
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Resultado (Marco)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Atrasado
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-300" /> A Fazer
              </div>
            </div>
          </div>

          {/* Interactive Gantt Table */}
          <div className="overflow-x-auto">
            <div className={timelineData.minWidthClass}>
              
              {/* Timeline Header (Months and Period) */}
              <div className="grid grid-cols-12 bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-600">
                <div className="col-span-4 p-3 border-r border-slate-200 flex items-center justify-between">
                  <span className="uppercase tracking-wider text-[11px] text-slate-700">Estrutura / Ação / Responsável</span>
                  <span className="text-[10px] text-slate-400 font-normal">Clique p/ editar</span>
                </div>
                <div className="col-span-8 flex flex-col relative">
                  {/* Header Sub-bar: Info e Hoje */}
                  <div className="px-3 py-1 bg-slate-200/60 border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-600 font-semibold">
                    <span>Início: {timelineData.start.toLocaleDateString('pt-BR')}</span>
                    <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      Hoje: {new Date().toLocaleDateString('pt-BR')}
                    </span>
                    <span>Término: {timelineData.end.toLocaleDateString('pt-BR')}</span>
                  </div>

                  {/* Header Divisions: Linhas Verticais e Rótulos */}
                  <div className="relative h-9 flex items-stretch divide-x divide-slate-200/90 overflow-hidden">
                    {timelineData.divisions.map((div) => (
                      <div
                        key={div.id}
                        className={`flex flex-col items-center justify-center text-center px-1 border-r border-slate-300/80 transition-colors ${
                          div.isCurrent
                            ? 'bg-indigo-100/40 text-indigo-900 font-black'
                            : div.isWeekend
                            ? 'bg-slate-200/50 text-slate-400'
                            : 'text-slate-700'
                        }`}
                        style={{ width: `${div.widthPct}%` }}
                        title={`${div.label} ${div.subLabel ? `(${div.subLabel})` : ''}`}
                      >
                        <span className="text-[10px] font-black truncate max-w-full leading-tight">
                          {div.label}
                        </span>
                        {div.subLabel && (
                          <span className="text-[8px] font-medium opacity-75 truncate max-w-full leading-tight">
                            {div.subLabel}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Linha vertical 'Hoje' no cabeçalho */}
                    {timelineData.todayPosition !== null && (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
                        style={{ left: `${timelineData.todayPosition}%` }}
                      >
                        <span className="text-[8px] font-extrabold uppercase bg-indigo-600 text-white px-1 py-0.2 rounded shadow-xs -translate-x-1/2">
                          Hoje
                        </span>
                        <div className="w-0.5 bg-indigo-600 h-full -translate-x-1/2" />
                      </div>
                    )}
                  </div>
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
                    const isResultado = item.kind === 'resultado';
                    const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.media;
                    const isEditingThisComment = editingCommentId === item.id;

                    return (
                      <div 
                        key={item.id}
                        className={`grid grid-cols-12 hover:bg-slate-50/70 transition-colors group cursor-pointer ${
                          isResultado ? 'bg-emerald-50/20' : ''
                        }`}
                        onClick={() => handleOpenEditModal(item)}
                      >
                        {/* Left column: Action Details */}
                        <div className="col-span-4 p-3.5 border-r border-slate-200 flex flex-col justify-center space-y-1">
                          
                          {/* Step Pill & Kind Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.step && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[170px]">
                                {item.step}
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded tracking-wider uppercase border flex items-center gap-0.5 ${
                                isResultado
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-sky-50 text-sky-800 border-sky-200'
                              }`}
                            >
                              {isResultado && <Target className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                              {isResultado ? 'RESULTADO' : 'MÉTODO'}
                            </span>

                            {/* Badge de Escopo / Privacidade */}
                            {item.scope === 'private' ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-0.5" title={`Ação Privada • Dono: ${item.ownerName || 'Colaborador'}`}>
                                <Lock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[100px]">Pessoal ({item.ownerName || 'Privado'})</span>
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-0.5" title="Plano Institucional Aberto da Unidade">
                                <Globe className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                                <span>Aberto</span>
                              </span>
                            )}

                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ml-auto shrink-0 ${priorityCfg.badge}`}>
                              {priorityCfg.label}
                            </span>
                          </div>

                          {/* Action Title */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-bold text-xs group-hover:text-indigo-600 transition-colors line-clamp-1 ${
                              isResultado ? 'text-emerald-950 font-black' : 'text-slate-900'
                            }`}>
                              {item.title}
                            </span>
                          </div>
                          
                          {/* Responsible and Department */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-slate-700 truncate max-w-[150px]">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              {item.responsible}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[130px] text-slate-500">
                              {item.department}
                            </span>
                          </div>
                        </div>

                        {/* Right column: Gantt Bar Track + Linhas Verticais + Linhas Horizontais de Comentário */}
                        <div className="col-span-8 p-3 flex flex-col justify-center relative overflow-hidden min-h-[68px]">
                          {/* Background Grid Lines (Divisões verticais reais baseadas no recorte temporal) */}
                          <div className="absolute inset-0 flex items-stretch pointer-events-none">
                            {timelineData.divisions.map((div) => (
                              <div
                                key={`bg-${div.id}`}
                                className={`border-r border-slate-200/90 h-full ${
                                  div.isCurrent
                                    ? 'bg-indigo-50/20'
                                    : div.isWeekend
                                    ? 'bg-slate-100/40'
                                    : ''
                                }`}
                                style={{ width: `${div.widthPct}%` }}
                              />
                            ))}

                            {/* Linha vertical contínua de "Hoje" */}
                            {timelineData.todayPosition !== null && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-indigo-500/70 z-10 pointer-events-none -translate-x-1/2"
                                style={{ left: `${timelineData.todayPosition}%` }}
                              />
                            )}
                          </div>

                          {/* Faixa da Programação (Barra do Gantt) */}
                          <div className="relative z-10 mb-1">
                            <div
                              className={`relative h-7 rounded-xl shadow-xs transition-all flex items-center px-2.5 overflow-hidden border ${
                                isResultado ? 'ring-1 ring-emerald-400/50' : ''
                              }`}
                              style={{
                                marginLeft: `${pos.left}%`,
                                width: `${pos.width}%`,
                                minWidth: '46px',
                                backgroundColor: isResultado
                                  ? item.status === 'completed' ? '#d1fae5' : '#ecfdf5'
                                  : item.status === 'completed' ? '#ecfdf5' : item.status === 'delayed' ? '#fff1f2' : item.status === 'not_started' ? '#f8fafc' : '#eff6ff',
                                borderColor: isResultado
                                  ? '#059669'
                                  : item.status === 'completed' ? '#10b981' : item.status === 'delayed' ? '#f43f5e' : item.status === 'not_started' ? '#cbd5e1' : '#3b82f6',
                              }}
                            >
                              {/* Inner Progress Fill */}
                              <div
                                className="absolute top-0 bottom-0 left-0 opacity-25"
                                style={{
                                  width: `${item.progress}%`,
                                  backgroundColor: isResultado
                                    ? '#047857'
                                    : item.status === 'completed' ? '#059669' : item.status === 'delayed' ? '#e11d48' : item.status === 'not_started' ? '#94a3b8' : '#2563eb',
                                }}
                              />

                              <span className="relative z-10 text-[10px] font-extrabold truncate text-slate-800 flex items-center gap-1">
                                {isResultado && <Target className="w-3 h-3 text-emerald-700 shrink-0" />}
                                {item.progress}% • {new Date(item.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} até {new Date(item.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Linha Horizontal de Comentário / Acompanhamento Abaixo da Barra */}
                          {showCommentsBelowBar && (
                            <div
                              className="relative z-20 mt-0.5"
                              style={{ marginLeft: `${pos.left}%` }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isEditingThisComment ? (
                                <div className="flex items-center gap-1.5 bg-white border border-indigo-300 rounded-lg p-1 shadow-md w-full max-w-[420px]">
                                  <input
                                    type="text"
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    placeholder="Escreva um comentário ou status de acompanhamento..."
                                    className="text-[11px] text-slate-800 px-2 py-1 w-full bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        void handleSaveComment(item.id, commentInput);
                                      } else if (e.key === 'Escape') {
                                        setEditingCommentId(null);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleSaveComment(item.id, commentInput)}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-colors"
                                    title="Salvar Comentário"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCommentId(null)}
                                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors"
                                    title="Cancelar"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : item.notes ? (
                                <div
                                  className="group/comment inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50/90 border border-amber-200/80 text-[10px] text-amber-950 font-medium hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer max-w-[500px]"
                                  onClick={() => {
                                    setEditingCommentId(item.id);
                                    setCommentInput(item.notes || '');
                                  }}
                                  title="Clique para editar este comentário"
                                >
                                  <MessageSquare className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                  <span className="truncate">{item.notes}</span>
                                  <Edit2 className="w-2.5 h-2.5 text-amber-600 opacity-0 group-hover/comment:opacity-100 transition-opacity shrink-0 ml-1" />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(item.id);
                                    setCommentInput('');
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-300 text-[9px] text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all font-semibold"
                                  title="Adicionar comentário de acompanhamento"
                                >
                                  <MessageSquarePlus className="w-2.5 h-2.5" />
                                  <span>+ Comentário</span>
                                </button>
                              )}
                            </div>
                          )}

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
                  <th className="py-3 px-3">Etapa / Passo</th>
                  <th className="py-3 px-2">Tipo</th>
                  <th className="py-3 px-3">Escopo</th>
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
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      Nenhuma ação cadastrada no plano.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.in_progress;
                    const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.media;
                    const isResultado = item.kind === 'resultado';

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isResultado ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-semibold">
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.step || 'Etapa Geral'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase flex items-center gap-0.5 w-max ${
                              isResultado
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-sky-50 text-sky-800 border-sky-200'
                            }`}
                          >
                            {isResultado ? 'RESULTADO' : 'MÉTODO'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {item.scope === 'private' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Pessoal ({item.ownerName || 'Privado'})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <Globe className="w-2.5 h-2.5 text-sky-600" />
                              <span>Aberto</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                          <div className={`line-clamp-2 ${isResultado ? 'font-black text-emerald-950' : ''}`}>
                            {item.title}
                          </div>
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
                                  item.progress === 100 
                                    ? 'bg-emerald-500' 
                                    : isResultado 
                                    ? 'bg-emerald-600' 
                                    : 'bg-indigo-600'
                                }`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="font-extrabold text-slate-800 text-[11px]">
                              {item.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityCfg.badge}`}>
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
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAction(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remover Ação"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      {/* 6. MODAL DE CARREGAR MODELO PILAR ET */}
      {/* ========================================================================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Carregar Modelo Pilar ET
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilar Educação e Treinamento (Superar)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Este modelo contém o roteiro metodológico completo de implantação com <strong>52 ações estruturadas</strong>:
              </p>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Etapa 0: Estrutura (Governança, KPIs, Master Plan)</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>0.2: Capacitação do Pilar (LUP, Matriz de Habilidades)</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Passo 1 a Passo 6: Diretrizes, Programa, Matriz, Auto Desenvolvimento e Avaliação Futura</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold mt-1">
                  <Target className="w-3.5 h-3.5 shrink-0" />
                  <span>Inclui separação automática de Ações de Método e Marcos de Resultado.</span>
                </div>
              </div>
              <p className="text-slate-500 text-[11px]">
                Escolha se deseja substituir totalmente o plano de ação atual ou mesclar/adicionar as ações do modelo ao plano existente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleApplyPilarETTemplate('append')}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors"
              >
                Mesclar / Adicionar Novas
              </button>
              <button
                type="button"
                onClick={() => handleApplyPilarETTemplate('replace')}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
              >
                Substituir Plano Completo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DE CADASTRO / EDIÇÃO */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto">
            
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
                    Defina o escopo, etapa, tipo (Método/Resultado), prazos e responsáveis.
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

            {/* Template Quick Selector (For New or Updating) */}
            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-1.5">
              <label className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Puxar Ação Pré-preenchida do Modelo Pilar ET:
              </label>
              <select
                onChange={handleSelectPresetAction}
                defaultValue=""
                className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Selecione uma ação para auto-preencher --</option>
                {(() => {
                  // Agrupar ações por etapa para melhor navegação
                  const groups: Record<string, typeof PILAR_ET_TEMPLATE> = {};
                  PILAR_ET_TEMPLATE.forEach((preset) => {
                    const key = preset.step || 'Outros';
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(preset);
                  });
                  return Object.entries(groups).map(([step, presets]) => (
                    <optgroup key={step} label={`📋 ${step}`}>
                      {presets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.kind === 'resultado' ? '🎯 RESULTADO' : '🔹 MÉTODO'} — {preset.title}
                        </option>
                      ))}
                    </optgroup>
                  ));
                })()}
              </select>
              <p className="text-[10px] text-indigo-600/70 font-medium">
                💡 Ao selecionar, todos os campos são preenchidos automaticamente com os dados do modelo.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAction} className="space-y-4 text-xs font-semibold">
              
              {/* Escopo da Ação: Padrão Aberto vs Pessoal (Privado) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-slate-800 font-bold">Privacidade & Escopo da Ação *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormScope('public')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      formScope === 'public'
                        ? 'bg-sky-50 text-sky-900 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className={`w-4 h-4 mt-0.5 shrink-0 ${formScope === 'public' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs">🌐 Padrão Aberto</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Visível para toda a equipe da unidade</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormScope('private');
                      if (!formOwnerId) setFormOwnerId(currentUser.id);
                      if (!formOwnerName) setFormOwnerName(currentUser.name);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      formScope === 'private'
                        ? 'bg-amber-50 text-amber-950 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${formScope === 'private' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs">🔒 Meu Plano Pessoal (Privado)</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Privado para você e pelo Administrador</div>
                    </div>
                  </button>
                </div>

                {/* Se for privado e o usuário for Administrador, pode vincular ao colaborador desejado */}
                {formScope === 'private' && isEffectiveAdmin && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 shrink-0">Colaborador Dono:</span>
                    <select
                      value={formOwnerId || currentUser.id}
                      onChange={(e) => {
                        const targetUser = users.find((u) => u.id === e.target.value);
                        setFormOwnerId(e.target.value);
                        if (targetUser) {
                          setFormOwnerName(targetUser.name);
                          if (!editingItem) {
                            setFormResponsible(targetUser.name);
                            setFormDepartment(targetUser.department || 'Geral');
                          }
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Etapa / Passo and Tipo (Método / Resultado) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700">Etapa / Passo do Roteiro *</label>
                  <select
                    value={formStep}
                    onChange={(e) => setFormStep(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {distinctSteps.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700">Tipo de Ação *</label>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setFormKind('metodo')}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                        formKind === 'metodo'
                          ? 'bg-sky-50 text-sky-800 border-sky-300 ring-2 ring-sky-500/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      MÉTODO
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormKind('resultado')}
                      className={`py-2 px-3 rounded-xl border text-center font-bold flex items-center justify-center gap-1 transition-all ${
                        formKind === 'resultado'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      RESULTADO
                    </button>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-slate-700">Título da Ação / Atividade *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Treinamento de Matriz de Habilidades"
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
                    placeholder="Ex: Pilar Educação e Treinamento"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700">Setor / Pilar de Suporte</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="Ex: Superar, GA/MP, Qualidade, MF..."
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
                  placeholder="Ex: Matriz de Habilidades preenchida com gaps identificados"
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

      {/* Modal de Gestão de Usuários & Administrador */}
      <UserManagerModal
        isOpen={isUserManagerOpen}
        onClose={() => setIsUserManagerOpen(false)}
        onOpenAdminAuth={() => requestAdminAccess()}
      />

    </div>
  );
};
