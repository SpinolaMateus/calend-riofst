import React, { useState, useMemo } from 'react';
import { 
  Users, Briefcase, Clock, Calendar, CheckCircle2, AlertTriangle, 
  Search, Filter, Plus, Edit3, Trash2, ArrowRight, ChevronRight, 
  Check, X, Download, ShieldCheck, Sparkles, Building2, UserCheck,
  FileText, ArrowUpRight, Flame, Layers
} from 'lucide-react';
import { 
  JobVacancy, JobVacantStage, JobVacantPriority, JobVacantReason, 
  GGDeliverable, DeliverableStatus, Employee, ShiftCategory 
} from '../../types/peopleAnalytics';
import { calculateVacancyAnalytics } from '../../data/initialDeliveriesData';

interface DeliveriesAndVacanciesTabProps {
  vacancies: JobVacancy[];
  deliverables: GGDeliverable[];
  employees: Employee[];
  onSaveVacancies: (data: JobVacancy[]) => void;
  onSaveDeliverables: (data: GGDeliverable[]) => void;
}

const STAGES_ORDER: JobVacantStage[] = [
  'RP',
  'Shortlist',
  'Entrevista',
  'Exames Médicos',
  'Integração',
  'Admitido'
];

export const DeliveriesAndVacanciesTab: React.FC<DeliveriesAndVacanciesTabProps> = ({
  vacancies,
  deliverables,
  employees,
  onSaveVacancies,
  onSaveDeliverables,
}) => {
  // Controle de Sub-abas
  const [activeSubTab, setActiveSubTab] = useState<'vacancies' | 'deliverables'>('vacancies');

  // Filtros de Vagas
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtros de Entregáveis G&G
  const [delivCategoryFilter, setDelivCategoryFilter] = useState<string>('all');
  const [delivStatusFilter, setDelivStatusFilter] = useState<string>('all');

  // Modais de Criação e Edição
  const [isVacancyModalOpen, setIsVacancyModalOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<JobVacancy | null>(null);
  const [vacancyForm, setVacancyForm] = useState<Partial<JobVacancy>>({});

  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<GGDeliverable | null>(null);
  const [deliverableForm, setDeliverableForm] = useState<Partial<GGDeliverable>>({});

  // Obter listas dinâmicas de Setores, Cargos e Gestores a partir da base real de colaboradores
  const dynamicOptions = useMemo(() => {
    const locations = Array.from(new Set(employees.map(e => e.locationName).filter(Boolean))).sort();
    const jobs = Array.from(new Set(employees.map(e => e.jobTitle).filter(Boolean))).sort();
    const managers = Array.from(new Set(employees.map(e => e.immediateManager).filter(Boolean))).sort();
    return { locations, jobs, managers };
  }, [employees]);

  // Data de Hoje
  const today = useMemo(() => new Date(), []);
  const todayFormatted = useMemo(() => today.toLocaleDateString('pt-BR'), [today]);

  // =========================================================================
  // ANALYTICS DE VAGAS (SLA, AGING E FUNIL)
  // =========================================================================
  const vacanciesWithAnalytics = useMemo(() => {
    return vacancies.map(v => {
      const analytics = calculateVacancyAnalytics(v, today);
      return { ...v, analytics };
    });
  }, [vacancies, today]);

  // Filtragem de Vagas
  const filteredVacancies = useMemo(() => {
    return vacanciesWithAnalytics.filter(v => {
      if (stageFilter !== 'all' && v.stage !== stageFilter) return false;
      if (locationFilter !== 'all' && v.locationName !== locationFilter) return false;
      if (priorityFilter !== 'all' && v.priority !== priorityFilter) return false;
      if (slaFilter !== 'all' && v.analytics.slaStatus !== slaFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mCode = v.code.toLowerCase().includes(q);
        const mJob = v.jobTitle.toLowerCase().includes(q);
        const mLoc = v.locationName.toLowerCase().includes(q);
        const mMgr = v.manager.toLowerCase().includes(q);
        const mCand = (v.finalCandidateName || '').toLowerCase().includes(q);
        if (!mCode && !mJob && !mLoc && !mMgr && !mCand) return false;
      }
      return true;
    });
  }, [vacanciesWithAnalytics, stageFilter, locationFilter, priorityFilter, slaFilter, searchTerm]);

  // KPIs Globais de Vagas
  const vacancyKpis = useMemo(() => {
    const openVacancies = vacanciesWithAnalytics.filter(v => v.stage !== 'Admitido' && v.stage !== 'Cancelada');
    const totalOpen = openVacancies.length;
    
    let onTimeCount = 0;
    let attentionCount = 0;
    let delayedCount = 0;
    let totalDaysOpen = 0;

    openVacancies.forEach(v => {
      totalDaysOpen += v.analytics.daysOpen;
      if (v.analytics.slaStatus === 'no_prazo') onTimeCount++;
      else if (v.analytics.slaStatus === 'atencao') attentionCount++;
      else delayedCount++;
    });

    const slaOnTimePct = totalOpen > 0 ? Number(((onTimeCount / totalOpen) * 100).toFixed(1)) : 100;
    const avgAgingDays = totalOpen > 0 ? Number((totalDaysOpen / totalOpen).toFixed(1)) : 0;

    // Contagem por fase
    const stageCounts: Record<string, number> = {
      'RP': 0,
      'Shortlist': 0,
      'Entrevista': 0,
      'Exames Médicos': 0,
      'Integração': 0,
      'Admitido': 0,
    };

    vacancies.forEach(v => {
      if (stageCounts[v.stage] !== undefined) {
        stageCounts[v.stage]++;
      }
    });

    return {
      totalOpen,
      slaOnTimePct,
      avgAgingDays,
      onTimeCount,
      attentionCount,
      delayedCount,
      stageCounts,
    };
  }, [vacanciesWithAnalytics, vacancies]);

  // =========================================================================
  // ANALYTICS DE ENTREGÁVEIS G&G
  // =========================================================================
  const filteredDeliverables = useMemo(() => {
    return deliverables.filter(d => {
      if (delivCategoryFilter !== 'all' && d.category !== delivCategoryFilter) return false;
      if (delivStatusFilter !== 'all' && d.status !== delivStatusFilter) return false;
      return true;
    });
  }, [deliverables, delivCategoryFilter, delivStatusFilter]);

  const deliverableKpis = useMemo(() => {
    const total = deliverables.length;
    const completed = deliverables.filter(d => d.status === 'Concluído').length;
    const inProgress = deliverables.filter(d => d.status === 'Em Andamento').length;
    const planned = deliverables.filter(d => d.status === 'Planejado').length;
    const delayed = deliverables.filter(d => d.status === 'Atrasado' || d.status === 'Em Risco').length;
    const avgProgress = total > 0 ? Math.round(deliverables.reduce((acc, d) => acc + d.progressPct, 0) / total) : 0;

    return { total, completed, inProgress, planned, delayed, avgProgress };
  }, [deliverables]);

  // =========================================================================
  // HANDLERS DE CRUD DE VAGAS
  // =========================================================================
  const handleOpenNewVacancyModal = () => {
    const nextNumber = String(vacancies.length + 1).padStart(3, '0');
    setVacancyForm({
      code: `RP-2026-${nextNumber}`,
      jobTitle: dynamicOptions.jobs[0] || 'Operador de Produção',
      locationName: dynamicOptions.locations[0] || 'EXPEDICAO FST',
      macroarea: 'Operação Fabril',
      shiftCategory: 'Turno A',
      manager: dynamicOptions.managers[0] || 'Gestor da Área',
      reason: 'Substituição',
      priority: 'Normal',
      stage: 'RP',
      openDate: new Date().toISOString().slice(0, 10),
      slaTargetDays: 30,
      stageDates: {
        rpDate: new Date().toISOString().slice(0, 10),
      },
    });
    setEditingVacancy(null);
    setIsVacancyModalOpen(true);
  };

  const handleEditVacancy = (v: JobVacancy) => {
    setEditingVacancy(v);
    setVacancyForm({ ...v });
    setIsVacancyModalOpen(true);
  };

  const handleDeleteVacancy = (id: string) => {
    const v = vacancies.find(x => x.id === id);
    if (window.confirm(`Deseja realmente excluir a vaga ${v?.code} (${v?.jobTitle})?`)) {
      const updated = vacancies.filter(x => x.id !== id);
      onSaveVacancies(updated);
    }
  };

  const handleSaveVacancyModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacancyForm.jobTitle || !vacancyForm.code) {
      alert('Código e Cargo são obrigatórios.');
      return;
    }

    if (editingVacancy) {
      // Atualizar existente
      const updated = vacancies.map(v => {
        if (v.id === editingVacancy.id) {
          return {
            ...v,
            ...vacancyForm,
            stageDates: {
              ...v.stageDates,
              ...(vacancyForm.stageDates || {}),
            }
          } as JobVacancy;
        }
        return v;
      });
      onSaveVacancies(updated);
    } else {
      // Criar nova
      const newVac: JobVacancy = {
        id: `vac-${Date.now()}`,
        code: vacancyForm.code || `RP-${Date.now()}`,
        jobTitle: vacancyForm.jobTitle || 'Novo Cargo',
        locationName: vacancyForm.locationName || 'EXPEDICAO FST',
        macroarea: vacancyForm.macroarea || 'Operação Fabril',
        shiftCategory: vacancyForm.shiftCategory || 'Turno A',
        manager: vacancyForm.manager || 'Gestor Imediato',
        reason: vacancyForm.reason || 'Substituição',
        priority: vacancyForm.priority || 'Normal',
        stage: vacancyForm.stage || 'RP',
        openDate: vacancyForm.openDate || new Date().toISOString().slice(0, 10),
        slaTargetDays: vacancyForm.slaTargetDays || 30,
        stageDates: {
          rpDate: vacancyForm.openDate || new Date().toISOString().slice(0, 10),
          ...(vacancyForm.stageDates || {}),
        },
        finalCandidateName: vacancyForm.finalCandidateName || '',
        notes: vacancyForm.notes || '',
      };
      onSaveVacancies([newVac, ...vacancies]);
    }
    setIsVacancyModalOpen(false);
  };

  // Avançar vaga para a próxima fase com 1 clique
  const handleAdvanceStage = (v: JobVacancy) => {
    const currentIdx = STAGES_ORDER.indexOf(v.stage);
    if (currentIdx >= 0 && currentIdx < STAGES_ORDER.length - 1) {
      const nextStage = STAGES_ORDER[currentIdx + 1];
      const todayIso = new Date().toISOString().slice(0, 10);
      const stageDateKey = 
        nextStage === 'Shortlist' ? 'shortlistDate' :
        nextStage === 'Entrevista' ? 'interviewDate' :
        nextStage === 'Exames Médicos' ? 'medicalExamDate' :
        nextStage === 'Integração' ? 'integrationDate' :
        nextStage === 'Admitido' ? 'closedDate' : undefined;

      const updated = vacancies.map(item => {
        if (item.id === v.id) {
          return {
            ...item,
            stage: nextStage,
            stageDates: {
              ...item.stageDates,
              ...(stageDateKey ? { [stageDateKey]: todayIso } : {}),
            }
          };
        }
        return item;
      });
      onSaveVacancies(updated);
    }
  };

  // =========================================================================
  // HANDLERS DE CRUD DE ENTREGÁVEIS G&G
  // =========================================================================
  const handleOpenNewDeliverableModal = () => {
    const nextNumber = String(deliverables.length + 1).padStart(2, '0');
    setDeliverableForm({
      code: `ENT-2026-${nextNumber}`,
      title: '',
      category: 'DHO & Treinamento',
      scope: 'Toda a Fábrica KBA1',
      responsible: 'Gente & Gestão',
      targetDate: new Date().toISOString().slice(0, 10),
      status: 'Planejado',
      progressPct: 0,
      notes: '',
    });
    setEditingDeliverable(null);
    setIsDeliverableModalOpen(true);
  };

  const handleEditDeliverable = (d: GGDeliverable) => {
    setEditingDeliverable(d);
    setDeliverableForm({ ...d });
    setIsDeliverableModalOpen(true);
  };

  const handleDeleteDeliverable = (id: string) => {
    const d = deliverables.find(x => x.id === id);
    if (window.confirm(`Deseja realmente excluir o entregável ${d?.code} (${d?.title})?`)) {
      onSaveDeliverables(deliverables.filter(x => x.id !== id));
    }
  };

  const handleSaveDeliverableModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableForm.title || !deliverableForm.code) {
      alert('Código e Título são obrigatórios.');
      return;
    }

    if (editingDeliverable) {
      const updated = deliverables.map(d => {
        if (d.id === editingDeliverable.id) {
          return { ...d, ...deliverableForm } as GGDeliverable;
        }
        return d;
      });
      onSaveDeliverables(updated);
    } else {
      const newDeliv: GGDeliverable = {
        id: `del-${Date.now()}`,
        code: deliverableForm.code || `ENT-${Date.now()}`,
        title: deliverableForm.title || 'Novo Entregável',
        category: deliverableForm.category || 'DHO & Treinamento',
        scope: deliverableForm.scope || 'Fábrica KBA1',
        responsible: deliverableForm.responsible || 'Gente & Gestão',
        targetDate: deliverableForm.targetDate || new Date().toISOString().slice(0, 10),
        status: deliverableForm.status || 'Planejado',
        progressPct: deliverableForm.progressPct || 0,
        notes: deliverableForm.notes || '',
      };
      onSaveDeliverables([newDeliv, ...deliverables]);
    }
    setIsDeliverableModalOpen(false);
  };

  // Exportar dados filtrados para CSV
  const handleExportCSV = () => {
    if (activeSubTab === 'vacancies') {
      let csv = 'Codigo;Cargo;Setor;Macroarea;Turno;Gestor;Motivo;Prioridade;Fase;DataAbertura;AgingDias;SLATarget;StatusSLA;CandidatoFinalista\n';
      filteredVacancies.forEach(v => {
        csv += `"${v.code}";"${v.jobTitle}";"${v.locationName}";"${v.macroarea}";"${v.shiftCategory}";"${v.manager}";"${v.reason}";"${v.priority}";"${v.stage}";${v.openDate};${v.analytics.daysOpen};${v.slaTargetDays};"${v.analytics.slaStatus}";"${v.finalCandidateName || ''}"\n`;
      });
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vagas_entregas_kba1_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let csv = 'Codigo;Titulo;Categoria;Escopo;Responsavel;Prazo;Status;Progresso;Observacoes\n';
      filteredDeliverables.forEach(d => {
        csv += `"${d.code}";"${d.title}";"${d.category}";"${d.scope}";"${d.responsible}";${d.targetDate};"${d.status}";${d.progressPct}%;"${d.notes || ''}"\n`;
      });
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entregaveis_gg_kba1_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* 1. SELETOR DE SUB-ABAS SUPERIORES & BOTÕES DE AÇÃO */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Toggle de Sub-Abas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('vacancies')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'vacancies'
                ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Vagas Abertas & R&S por Fases ({vacancyKpis.totalOpen})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('deliverables')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'deliverables'
                ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Entregáveis Estratégicos G&G ({deliverableKpis.total})</span>
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            Hoje: <strong>{todayFormatted}</strong>
          </span>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>

          {activeSubTab === 'vacancies' ? (
            <button
              onClick={handleOpenNewVacancyModal}
              className="px-4 py-2 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Nova Vaga (RP)</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewDeliverableModal}
              className="px-4 py-2 text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Entregável G&G</span>
            </button>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-ABA 1: VAGAS ABERTAS POR FASES (R&S E AGING VS HOJE) */}
      {/* ========================================================================= */}
      {activeSubTab === 'vacancies' && (
        <div className="space-y-6">

          {/* Cards Executivos de SLA & Aging */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Vagas */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Vagas em Andamento
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#0b1c30]">{vacancyKpis.totalOpen}</span>
                <span className="text-xs text-slate-400 font-semibold">RPs ativas</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Conectadas com as escalas da fábrica
              </p>
            </div>

            {/* SLA Geral no Prazo */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Aderência ao SLA (Meta: 85%)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-700">{vacancyKpis.slaOnTimePct}%</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {vacancyKpis.onTimeCount} no prazo
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-1">
                Meta corporativa de fechamento
              </p>
            </div>

            {/* Aging Médio das Vagas */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Aging Médio das Vagas
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#0b1c30]">{vacancyKpis.avgAgingDays}</span>
                <span className="text-xs text-slate-500 font-semibold">dias em aberto</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cruzado em tempo real com a data de hoje
              </p>
            </div>

            {/* Vagas Críticas / Atenção */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Alerta de SLA / Estagnação
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-amber-700">{vacancyKpis.attentionCount + vacancyKpis.delayedCount}</span>
                <span className="text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {vacancyKpis.delayedCount} atrasada(s)
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-1">
                {vacancyKpis.attentionCount} em atenção iminente
              </p>
            </div>

            {/* Pronto para Integração */}
            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Fase de Integração (DHO)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-purple-900">{vacancyKpis.stageCounts['Integração']}</span>
                <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Pronto p/ Admissão
                </span>
              </div>
              <p className="text-[11px] text-purple-800/80 mt-1">
                Aprovados no ASO aguardando entrada
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FUNIL VISUAL DAS FASES DE RECRUTAMENTO (RP -> SHORTLIST -> ENTREVISTA -> EXAMES -> INTEGRAÇÃO) */}
          {/* ========================================================================= */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0b1c30]">
                  Funil do Processo Seletivo por Fases (Pipeline Oficial)
                </h3>
                <p className="text-xs text-slate-500">
                  Clique em qualquer fase para filtrar instantaneamente as vagas correspondentes
                </p>
              </div>
              {stageFilter !== 'all' && (
                <button
                  onClick={() => setStageFilter('all')}
                  className="text-xs font-bold text-[#306576] hover:underline"
                >
                  Limpar Filtro de Fase ({stageFilter})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {STAGES_ORDER.map((stg, idx) => {
                const count = vacancyKpis.stageCounts[stg] || 0;
                const isSelected = stageFilter === stg;
                return (
                  <button
                    key={stg}
                    onClick={() => setStageFilter(isSelected ? 'all' : stg)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#0a3641] text-[#6ffbbe] border-[#306576] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        Etapa {idx + 1}
                      </span>
                      {idx < STAGES_ORDER.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                    <span className="font-bold text-xs block truncate">{stg}</span>
                    <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-200/50">
                      <span className="text-lg font-black font-mono">{count}</span>
                      <span className="text-[10px] opacity-70">vagas</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BARRA DE FILTROS CRUZADOS (SETOR, CARGO, PRIORIDADE, SLA & BUSCA) */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
              
              {/* Filtro Setor Fabril */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Setor / Local Fabril</label>
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">Todos os Setores</option>
                  {dynamicOptions.locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Prioridade */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Prioridade</label>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">Todas as Prioridades</option>
                  <option value="Urgente">🚨 Urgente</option>
                  <option value="Alta">⚡ Alta</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>

              {/* Filtro Status SLA */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Status do SLA</label>
                <select
                  value={slaFilter}
                  onChange={e => setSlaFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">Todos os SLAs</option>
                  <option value="no_prazo">🟢 No Prazo</option>
                  <option value="atencao">🟡 Em Atenção</option>
                  <option value="atrasado">🔴 Atrasado / Crítico</option>
                </select>
              </div>

              {/* Busca Textual */}
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Busca Rápida</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="RP, Cargo, Setor, Gestor ou Candidato..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#306576]"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABELA OFICIAL DE VAGAS EM ABERTO */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-[#0b1c30]">
                  Gestão Operacional de Vagas ({filteredVacancies.length} registros)
                </h4>
                <p className="text-xs text-slate-500">
                  Acompanhamento de Lead Time, dias em aberto vs hoje e avanço de etapas de R&S
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Data Base do SLA: <strong>{todayFormatted}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-3">Código RP</th>
                    <th className="py-3 px-4">Cargo & Setor Fabril</th>
                    <th className="py-3 px-3">Gestor & Turno</th>
                    <th className="py-3 px-3 text-center">Fase Atual</th>
                    <th className="py-3 px-3 text-center">Abertura / Aging</th>
                    <th className="py-3 px-3 text-center">SLA Restante</th>
                    <th className="py-3 px-3">Candidato Finalista</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredVacancies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Nenhuma vaga encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredVacancies.map(v => {
                      const isDelayed = v.analytics.slaStatus === 'atrasado';
                      const isAttention = v.analytics.slaStatus === 'atencao';
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Código RP */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-slate-900 block">{v.code}</span>
                            <span className={`inline-block px-1.5 py-0.2 rounded-sm text-[9px] font-bold ${
                              v.priority === 'Urgente'
                                ? 'bg-rose-100 text-rose-800'
                                : v.priority === 'Alta'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {v.priority}
                            </span>
                          </td>

                          {/* Cargo & Setor */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#0b1c30] block">{v.jobTitle}</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {v.locationName}
                            </span>
                          </td>

                          {/* Gestor & Turno */}
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-800 block">{v.manager}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{v.shiftCategory}</span>
                          </td>

                          {/* Fase Atual & Botão Avançar */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                v.stage === 'Integração' || v.stage === 'Admitido'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : v.stage === 'Exames Médicos'
                                  ? 'bg-teal-100 text-teal-900 border border-teal-200'
                                  : v.stage === 'Entrevista'
                                  ? 'bg-sky-100 text-sky-900 border border-sky-200'
                                  : v.stage === 'Shortlist'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}>
                                {v.stage}
                              </span>

                              {v.stage !== 'Admitido' && v.stage !== 'Cancelada' && (
                                <button
                                  onClick={() => handleAdvanceStage(v)}
                                  className="text-[10px] font-bold text-[#306576] hover:text-[#0a3641] hover:underline flex items-center gap-0.5"
                                  title="Avançar vaga para a próxima fase"
                                >
                                  <span>Avançar etapa</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Data Abertura / Aging */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono text-slate-700 block font-bold">
                              {v.analytics.daysOpen} dias
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Aberta em {v.openDate.split('-').reverse().join('/')}
                            </span>
                          </td>

                          {/* SLA Restante */}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isDelayed
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isAttention
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isDelayed 
                                ? `${Math.abs(v.analytics.slaRemaining)}d atraso` 
                                : `${v.analytics.slaRemaining}d restantes`}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Meta: {v.slaTargetDays}d</span>
                          </td>

                          {/* Candidato Finalista */}
                          <td className="py-3 px-3">
                            {v.finalCandidateName ? (
                              <span className="font-bold text-slate-800 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                {v.finalCandidateName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Em processo seletivo</span>
                            )}
                            {v.notes && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-xs mt-0.5" title={v.notes}>
                                {v.notes}
                              </span>
                            )}
                          </td>

                          {/* Ações (Editar / Excluir) */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditVacancy(v)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#eff4ff] text-slate-600 hover:text-[#306576] transition-colors"
                                title="Editar Vaga"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteVacancy(v.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                                title="Excluir Vaga"
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

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-ABA 2: PAINEL DE ENTREGÁVEIS ESTRATÉGICOS G&G */}
      {/* ========================================================================= */}
      {activeSubTab === 'deliverables' && (
        <div className="space-y-6">

          {/* Cards de Entregáveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total de Entregáveis</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#0b1c30]">{deliverableKpis.total}</span>
                <span className="text-xs text-slate-400 font-semibold">projetos G&G</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Concluídos com Êxito</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-700">{deliverableKpis.completed}</span>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">100% entregues</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Em Andamento</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-indigo-700">{deliverableKpis.inProgress}</span>
                <span className="text-xs text-slate-400">em execução</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Em Planejamento</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-amber-700">{deliverableKpis.planned}</span>
                <span className="text-xs text-slate-400">futuros</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Progresso Médio Geral</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-purple-900">{deliverableKpis.avgProgress}%</span>
                <span className="text-xs text-purple-700 font-bold">concluído</span>
              </div>
            </div>
          </div>

          {/* Tabela de Entregáveis */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#0b1c30]">Projetos & Entregáveis Estratégicos de RH</h4>
                <p className="text-xs text-slate-500">Cronograma de entregas de DHO, Treinamentos, Clima e Segurança</p>
              </div>
              <button
                onClick={handleOpenNewDeliverableModal}
                className="px-3.5 py-1.5 bg-[#0a3641] text-[#6ffbbe] text-xs font-bold rounded-xl shadow-2xs"
              >
                + Adicionar Entregável
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-4">Projeto / Entregável</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Escopo / Público</th>
                    <th className="py-3 px-3">Responsável</th>
                    <th className="py-3 px-3 text-center">Prazo</th>
                    <th className="py-3 px-3 text-center">Progresso</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDeliverables.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{d.code}</td>
                      <td className="py-3 px-4 font-bold text-[#0b1c30]">{d.title}</td>
                      <td className="py-3 px-3 text-slate-600">{d.category}</td>
                      <td className="py-3 px-3 text-slate-600">{d.scope}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{d.responsible}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700 font-bold">
                        {d.targetDate.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${d.progressPct === 100 ? 'bg-emerald-500' : 'bg-[#306576]'}`}
                              style={{ width: `${d.progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700">{d.progressPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Concluído'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'Em Andamento'
                            ? 'bg-sky-100 text-sky-800'
                            : d.status === 'Atrasado'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditDeliverable(d)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#eff4ff] text-slate-600 hover:text-[#306576]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeliverable(d.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL DE INCLUSÃO / EDIÇÃO DE VAGA */}
      {/* ========================================================================= */}
      {isVacancyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingVacancy ? `Editar Vaga ${editingVacancy.code}` : 'Abrir Nova Vaga (RP)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Preencha os dados da requisição conectando com os setores e cargos da fábrica
                </p>
              </div>
              <button
                onClick={() => setIsVacancyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVacancyModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Código RP */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código RP *</label>
                  <input
                    type="text"
                    required
                    value={vacancyForm.code || ''}
                    onChange={e => setVacancyForm(f => ({ ...f, code: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cargo *</label>
                  <select
                    value={vacancyForm.jobTitle || ''}
                    onChange={e => setVacancyForm(f => ({ ...f, jobTitle: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {dynamicOptions.jobs.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                {/* Setor Fabril */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Setor / Local Fabril *</label>
                  <select
                    value={vacancyForm.locationName || ''}
                    onChange={e => setVacancyForm(f => ({ ...f, locationName: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {dynamicOptions.locations.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Turno */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Turno / Escala</label>
                  <select
                    value={vacancyForm.shiftCategory || 'Turno A'}
                    onChange={e => setVacancyForm(f => ({ ...f, shiftCategory: e.target.value as ShiftCategory }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Turno A">Turno A (06:00 - 14:20)</option>
                    <option value="Turno B">Turno B (14:20 - 22:30)</option>
                    <option value="Turno C">Turno C (22:30 - 06:00)</option>
                    <option value="Administrativo">Administrativo (08:00 - 17:48)</option>
                    <option value="Outras Jornadas">Outras Jornadas / Jovens</option>
                  </select>
                </div>

                {/* Gestor */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gestor Solicitante</label>
                  <select
                    value={vacancyForm.manager || ''}
                    onChange={e => setVacancyForm(f => ({ ...f, manager: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {dynamicOptions.managers.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Motivo */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Motivo da Vaga</label>
                  <select
                    value={vacancyForm.reason || 'Substituição'}
                    onChange={e => setVacancyForm(f => ({ ...f, reason: e.target.value as JobVacantReason }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Substituição">Substituição (Turnover)</option>
                    <option value="Aumento de Quadro">Aumento de Quadro</option>
                    <option value="Licença/Afastamento">Licença / Afastamento</option>
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prioridade</label>
                  <select
                    value={vacancyForm.priority || 'Normal'}
                    onChange={e => setVacancyForm(f => ({ ...f, priority: e.target.value as JobVacantPriority }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">🚨 Urgente</option>
                  </select>
                </div>

                {/* Fase Atual */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fase Atual da Vaga</label>
                  <select
                    value={vacancyForm.stage || 'RP'}
                    onChange={e => setVacancyForm(f => ({ ...f, stage: e.target.value as JobVacantStage }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-purple-900"
                  >
                    <option value="RP">1. RP (Abertura)</option>
                    <option value="Shortlist">2. Shortlist (Triagem)</option>
                    <option value="Entrevista">3. Entrevista (G&G/Gestor)</option>
                    <option value="Exames Médicos">4. Exames Médicos (ASO)</option>
                    <option value="Integração">5. Integração (Admissão DHO)</option>
                    <option value="Admitido">6. Admitido / Concluído</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Data de Abertura */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data de Abertura da RP</label>
                  <input
                    type="date"
                    required
                    value={vacancyForm.openDate || ''}
                    onChange={e => setVacancyForm(f => ({ ...f, openDate: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                {/* SLA Meta (Dias) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Meta de SLA (Dias Corridos)</label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={vacancyForm.slaTargetDays || 30}
                    onChange={e => setVacancyForm(f => ({ ...f, slaTargetDays: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                {/* Candidato Finalista */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Candidato Finalista / Aprovado (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Nome do candidato aprovado"
                    value={vacancyForm.finalCandidateName || ''}
                    onChange={e => setVacancyForm(f => ({ ...f, finalCandidateName: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Observações Operacionais</label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes sobre perfil, exigências de NR, agendamento de exames..."
                    value={vacancyForm.notes || ''}
                    onChange={e => setVacancyForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVacancyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0a3641] hover:bg-[#134e5e] text-[#6ffbbe] font-black rounded-xl shadow-xs"
                >
                  {editingVacancy ? 'Salvar Alterações' : 'Gravar Vaga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DE INCLUSÃO / EDIÇÃO DE ENTREGÁVEL G&G */}
      {/* ========================================================================= */}
      {isDeliverableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingDeliverable ? `Editar ${editingDeliverable.code}` : 'Novo Entregável Estratégico G&G'}
                </h3>
                <p className="text-xs text-slate-500">Cadastre o compromisso operacional de Gente & Gestão</p>
              </div>
              <button
                onClick={() => setIsDeliverableModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliverableModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={deliverableForm.code || ''}
                    onChange={e => setDeliverableForm(f => ({ ...f, code: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={deliverableForm.category || 'DHO & Treinamento'}
                    onChange={e => setDeliverableForm(f => ({ ...f, category: e.target.value as any }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="DHO & Treinamento">DHO & Treinamento</option>
                    <option value="Recrutamento & Seleção">Recrutamento & Seleção</option>
                    <option value="Clima & Engajamento">Clima & Engajamento</option>
                    <option value="SSMA & Saúde Ocupacional">SSMA & Saúde Ocupacional</option>
                    <option value="Relações Trabalhistas">Relações Trabalhistas</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Título do Entregável *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pesquisa de Clima KBA1"
                    value={deliverableForm.title || ''}
                    onChange={e => setDeliverableForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Escopo</label>
                  <input
                    type="text"
                    value={deliverableForm.scope || ''}
                    onChange={e => setDeliverableForm(f => ({ ...f, scope: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Responsável</label>
                  <input
                    type="text"
                    value={deliverableForm.responsible || ''}
                    onChange={e => setDeliverableForm(f => ({ ...f, responsible: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prazo de Entrega</label>
                  <input
                    type="date"
                    required
                    value={deliverableForm.targetDate || ''}
                    onChange={e => setDeliverableForm(f => ({ ...f, targetDate: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Progresso ({deliverableForm.progressPct || 0}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={deliverableForm.progressPct || 0}
                    onChange={e => setDeliverableForm(f => ({ ...f, progressPct: Number(e.target.value) }))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeliverableModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0a3641] hover:bg-[#134e5e] text-[#6ffbbe] font-black rounded-xl shadow-xs"
                >
                  Salvar Entregável
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

