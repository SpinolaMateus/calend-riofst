import React from 'react';
import { 
  Calendar as CalendarIcon, Clock, Shield, Cloud, FileSpreadsheet, 
  Tv, FileDown, MapPin, ArrowRight, CheckCircle2, Lock, BarChart3,
  Layers, Users, Sparkles, Building2, Check, ArrowUpRight
} from 'lucide-react';
import { UnitInfo } from '../types/schedule';

interface HomeScreenProps {
  unitInfo: UnitInfo;
  onSelectIntegration: () => void;
  onSelectCalendar: () => void;
  onSelectFormations: () => void;
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

        <div className="relative z-10 max-w-4xl space-y-6">
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
              Ambiente unificado para controle operacional da unidade. Acesse o cronograma de integração de novos colaboradores, a agenda corporativa de salas ou o dashboard de análise de matrizes de formação.
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
              <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                Formações
              </div>
              <div className="mt-1 text-xl font-black text-white">
                Matrizes <span className="text-xs font-normal text-slate-400">BI & CSV</span>
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
            3 Módulos Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* ------------------------------------------------------------- */}
          {/* MÓDULO 1: CRONOGRAMA DE INTEGRAÇÃO */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={onSelectIntegration}
            className="group relative bg-white rounded-3xl p-7 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:border-indigo-300"
          >
            <div className="space-y-5">
              {/* Card Header & Badge */}
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200/60">
                  Acolhimento & Onboarding
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight flex items-center gap-1.5">
                  Cronograma de Integração
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-indigo-600" />
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Gestão completa dos 3 dias de acolhimento de novos contratados. Suporta agendas por público (Geral, Temporários, Aprendizes e Estagiários).
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">Faixas Arrastáveis</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Tabela Executiva</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <FileDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">PDF em 1 Clique</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Tv className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Modo Apresentação</span>
                </div>
              </div>
            </div>

            {/* CTA Footer */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {integrationEventsCount} atividades ativas
              </span>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                <span>Abrir Cronograma</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* MÓDULO 2: CALENDÁRIO CORPORATIVO */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={onSelectCalendar}
            className="group relative bg-white rounded-3xl p-7 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:border-sky-300"
          >
            <div className="space-y-5">
              {/* Card Header & Badge */}
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 px-3 py-1 rounded-full border border-sky-200/60">
                  Agenda & Salas
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight flex items-center gap-1.5">
                  Calendário & Eventos
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-sky-600" />
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Planejamento mensal de reuniões corporativas e treinamentos com controle de ocupação de salas e sincronização com o Supabase.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Cloud className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">Nuvem Realtime</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Salas da Unidade</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Acesso Protegido</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">Exportar Planilha</span>
                </div>
              </div>
            </div>

            {/* CTA Footer */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {calendarEventsCount} eventos registrados
              </span>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 group-hover:text-sky-700">
                <span>Abrir Calendário</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* MÓDULO 3: DASHBOARD DE FORMAÇÕES */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={onSelectFormations}
            className="group relative bg-white rounded-3xl p-7 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:border-violet-300"
          >
            <div className="space-y-5">
              {/* Card Header & Badge */}
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 px-3 py-1 rounded-full border border-violet-200/60">
                  BI & Matrizes
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-violet-600 transition-colors tracking-tight flex items-center gap-1.5">
                  Dashboard de Formações
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-violet-600" />
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Análise comparativa de matrizes de treinamento. Compare lados A/B, filtre por PRN, cargo ou unidade organizacional e exporte relatórios.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Layers className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span className="truncate">Comparação A / B</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Filtros por PRN / UO</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Gráficos de Conclusão</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Importar / Exportar</span>
                </div>
              </div>
            </div>

            {/* CTA Footer */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Análise em tempo real
              </span>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 group-hover:text-violet-700">
                <span>Abrir Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
