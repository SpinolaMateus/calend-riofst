import React from 'react';
import { 
  Calendar as CalendarIcon, Clock, Shield, Cloud, FileSpreadsheet, 
  Tv, FileDown, MapPin, ArrowRight, CheckCircle2, Lock, BarChart3,
  Layers, Users, Sparkles, Building2, Check, ArrowUpRight,
  Kanban, CheckSquare, TrendingUp
} from 'lucide-react';
import { UnitInfo } from '../types/schedule';

interface HomeScreenProps {
  unitInfo: UnitInfo;
  onSelectIntegration: () => void;
  onSelectCalendar: () => void;
  onSelectFormations: () => void;
  onSelectActionPlan?: () => void;
  integrationEventsCount: number;
  calendarEventsCount: number;
  onOpenAdminAccess?: () => void;
  isAdmin?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  unitInfo,
  onSelectIntegration,
  onSelectCalendar,
  onSelectFormations,
  onSelectActionPlan,
  integrationEventsCount,
  calendarEventsCount,
  onOpenAdminAccess,
  isAdmin,
}) => {
  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER - EXECUTIVE & MODERN */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
        
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 max-w-5xl space-y-6">
          {/* Badge & Date */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Portal Corporativo Integrado
              </span>
              <span className="text-xs text-slate-400 capitalize flex items-center gap-1.5">
                <span>•</span>
                {todayFormatted}
              </span>
            </div>

            {onOpenAdminAccess && (
              <button
                type="button"
                onClick={onOpenAdminAccess}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  isAdmin
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 border-white/20'
                }`}
                title={isAdmin ? 'Sessão administrativa autenticada' : 'Solicitar acesso administrativo'}
              >
                <Shield className={`w-3.5 h-3.5 ${isAdmin ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span>{isAdmin ? 'Admin Conectado' : 'Acesso Admin'}</span>
              </button>
            )}
          </div>

          {/* Main Title & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Central de Gestão, Cronogramas e Eventos
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl font-normal">
              Ambiente unificado para controle operacional da unidade. Acesse o cronograma de integração, a agenda corporativa de salas, o dashboard de matrizes e o plano de ação no modelo Gantt.
            </p>
          </div>

          {/* KPI Stat Cards / Pills */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/[0.08] transition-colors">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Integração
              </div>
              <div className="mt-1 text-xl font-black text-white">
                {integrationEventsCount} <span className="text-xs font-normal text-slate-400">atividades</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/[0.08] transition-colors">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-sky-400" />
                Calendário
              </div>
              <div className="mt-1 text-xl font-black text-white">
                {calendarEventsCount} <span className="text-xs font-normal text-slate-400">eventos</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/[0.08] transition-colors">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                Plano Gantt
              </div>
              <div className="mt-1 text-xl font-black text-white">
                Projetos <span className="text-xs font-normal text-emerald-400">Ativos</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/[0.08] transition-colors">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                Supabase
              </div>
              <div className="mt-1 text-xl font-black text-white">
                Conectado <span className="text-xs font-normal text-emerald-400">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODULE SELECTION CARDS - CLEAN ENTERPRISE DESIGN */}
      {/* ========================================================================= */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Módulos Operacionais Disponíveis
            </h2>
            <p className="text-xs text-slate-500">
              Escolha a área de trabalho que você deseja acessar e gerenciar.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            4 Módulos Integrados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* ------------------------------------------------------------- */}
          {/* MÓDULO 1: CRONOGRAMA DE INTEGRAÇÃO */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={onSelectIntegration}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:border-indigo-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200/60">
                  Onboarding
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight flex items-center gap-1">
                  Cronograma de Integração
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-indigo-600" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gestão dos 3 dias de acolhimento de novos colaboradores por públicos (Geral, Temporários, Aprendizes e Estagiários).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate text-[11px]">Faixas Horário</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate text-[11px]">Tabela XLS</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <FileDown className="w-3 h-3 text-rose-600 shrink-0" />
                  <span className="truncate text-[11px]">PDF Imediato</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Tv className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="truncate text-[11px]">Modo TV</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                {integrationEventsCount} atividades
              </span>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                <span>Acessar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* MÓDULO 2: CALENDÁRIO CORPORATIVO */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={onSelectCalendar}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:border-sky-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full border border-sky-200/60">
                  Agenda
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight flex items-center gap-1">
                  Calendário & Eventos
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-sky-600" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Planejamento mensal de reuniões executivas e treinamentos com controle de ocupação de salas e nuvem Supabase.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Cloud className="w-3 h-3 text-sky-600 shrink-0" />
                  <span className="truncate text-[11px]">Nuvem Realtime</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate text-[11px]">Gestão Salas</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Shield className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="truncate text-[11px]">Protegido</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <FileSpreadsheet className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate text-[11px]">Exportar CSV</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                {calendarEventsCount} eventos
              </span>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:text-sky-700">
                <span>Acessar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* MÓDULO 3: PLANO DE AÇÃO (MODELO GANTT) */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={onSelectActionPlan}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:border-emerald-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  Gantt & Ações
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight flex items-center gap-1">
                  Plano de Ação (Gantt)
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-600" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gestão cronológica de entregas operacionais, marcos de projetos e acompanhamento com visualização em Gantt.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <BarChart3 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate text-[11px]">Linha Gantt</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <CheckSquare className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate text-[11px]">Cadastro Ações</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <TrendingUp className="w-3 h-3 text-teal-600 shrink-0" />
                  <span className="truncate text-[11px]">Avanço em %</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Cloud className="w-3 h-3 text-sky-600 shrink-0" />
                  <span className="truncate text-[11px]">Nuvem Realtime</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Metas & Prazos
              </span>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                <span>Acessar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* MÓDULO 4: DASHBOARD DE FORMAÇÕES */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={onSelectFormations}
            className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:border-violet-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200/60">
                  BI Matrizes
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-violet-600 transition-colors tracking-tight flex items-center gap-1">
                  Dashboard Formações
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-violet-600" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Análise comparativa de matrizes de treinamento. Compare lados A/B, filtre por PRN e analise conclusões.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Layers className="w-3 h-3 text-violet-600 shrink-0" />
                  <span className="truncate text-[11px]">Lados A / B</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Users className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate text-[11px]">Filtro PRN</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <BarChart3 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate text-[11px]">Gráficos</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <FileSpreadsheet className="w-3 h-3 text-purple-600 shrink-0" />
                  <span className="truncate text-[11px]">CSV Nuvem</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Apresentação Nuvem
              </span>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 group-hover:text-violet-700">
                <span>Acessar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. UNIT INFORMATION BAR - REFINED INSTITUTIONAL FOOTER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <Building2 className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Unidade Ativa
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Em Operação
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                {unitInfo.unitName}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto text-xs text-slate-600">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Ciclo & Período</div>
                <div className="font-bold text-slate-800">{unitInfo.cohortName} • {unitInfo.period}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Local Padrão</div>
                <div className="font-bold text-slate-800 truncate max-w-[180px]">{unitInfo.locationDefault}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Responsável / Contato</div>
                <div className="font-bold text-slate-800 truncate max-w-[180px]">{unitInfo.contactPerson}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

