import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Shield, Cloud, FileSpreadsheet, 
  Tv, FileDown, MapPin, ArrowRight, CheckCircle2, Lock, BarChart3,
  Layers, Users, Sparkles, Building2, Check, ArrowUpRight,
  Kanban, CheckSquare, TrendingUp, Globe, Bookmark, Edit3, ExternalLink,
  UserCheck
} from 'lucide-react';
import { UnitInfo } from '../types/schedule';
import { useUserProfile } from '../services/UserProfileContext';
import { UserManagerModal } from './UserManagerModal';

interface HomeScreenProps {
  unitInfo: UnitInfo;
  onSelectIntegration: () => void;
  onSelectCalendar: () => void;
  onSelectFormations: () => void;
  onSelectActionPlan?: () => void;
  onSelectPeopleAnalytics?: () => void;
  onSelectLinks?: () => void;
  integrationEventsCount: number;
  calendarEventsCount: number;
  importantLinksCount?: number;
  onOpenAdminAccess?: () => void;
  isAdmin?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  unitInfo,
  onSelectIntegration,
  onSelectCalendar,
  onSelectFormations,
  onSelectActionPlan,
  onSelectPeopleAnalytics,
  onSelectLinks,
  integrationEventsCount,
  calendarEventsCount,
  importantLinksCount = 8,
  onOpenAdminAccess,
  isAdmin,
}) => {
  const { currentUser, isEffectiveAdmin } = useUserProfile();
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER - ENTERPRISE CLEAN */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-9 border border-slate-800">
        <div className="max-w-5xl space-y-5">
          {/* Top Bar: Context & User/Admin */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Portal Operacional da Unidade
              </span>
              <span>•</span>
              <span className="capitalize">{todayFormatted}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUserManagerOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 transition-colors"
                title="Trocar usuário ou gerenciar permissões administrativas"
              >
                <span className="w-4 h-4 rounded bg-slate-600 text-[10px] font-bold flex items-center justify-center text-white">
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </span>
                <span>{currentUser.name}</span>
                <span className="text-[11px] text-slate-400">
                  ({isEffectiveAdmin ? 'Admin' : 'Usuário'})
                </span>
              </button>

              {onOpenAdminAccess && (
                <button
                  type="button"
                  onClick={onOpenAdminAccess}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isAdmin
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                  }`}
                  title={isAdmin ? 'Sessão administrativa autenticada' : 'Solicitar acesso administrativo'}
                >
                  <Shield className={`w-3.5 h-3.5 ${isAdmin ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{isAdmin ? 'Admin Conectado' : 'Acesso Admin'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Title & Description */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Central de Gestão, Cronogramas e Eventos
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              Ambiente unificado para controle operacional da unidade: cronograma de integração, agenda corporativa de salas, matrizes de formação e plano de ação Gantt.
            </p>
          </div>

          {/* KPI Stat Row */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Integração
              </div>
              <div className="mt-1 text-lg font-bold text-white tabular-nums">
                {integrationEventsCount} <span className="text-xs font-normal text-slate-400">atividades</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                Calendário
              </div>
              <div className="mt-1 text-lg font-bold text-white tabular-nums">
                {calendarEventsCount} <span className="text-xs font-normal text-slate-400">eventos</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                Plano Gantt
              </div>
              <div className="mt-1 text-lg font-bold text-white">
                Projetos <span className="text-xs font-normal text-emerald-400">Ativos</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                Supabase
              </div>
              <div className="mt-1 text-lg font-bold text-white">
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Módulos Operacionais
            </h2>
            <p className="text-xs text-slate-500">
              Selecione a área de trabalho desejada.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            6 módulos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* MÓDULO 1: CRONOGRAMA DE INTEGRAÇÃO */}
          <div 
            onClick={onSelectIntegration}
            className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Onboarding
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                  <span>Cronograma de Integração</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gestão dos dias de acolhimento por público (Geral, Temporários, Aprendizes e Estagiários) com tabela XLS, grade semanal por área e PDF.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                {integrationEventsCount} atividades
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 group-hover:text-indigo-700">
                Acessar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* MÓDULO 2: CALENDÁRIO CORPORATIVO */}
          <div 
            onClick={onSelectCalendar}
            className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Agenda
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                  <span>Calendário & Eventos</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Planejamento mensal de reuniões executivas e treinamentos com controle de ocupação de salas e exportação CSV.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                {calendarEventsCount} eventos
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 group-hover:text-indigo-700">
                Acessar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* MÓDULO 3: PLANO DE AÇÃO (MODELO GANTT) */}
          <div 
            onClick={onSelectActionPlan}
            className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Gantt & Ações
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                  <span>Plano de Ação (Gantt)</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gestão cronológica de entregas, marcos de projetos e planos abertos ou pessoais por usuário com visualização em Gantt.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                Metas & Prazos
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 group-hover:text-indigo-700">
                Acessar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* MÓDULO 4: DASHBOARD DE FORMAÇÕES */}
          <div 
            onClick={onSelectFormations}
            className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  BI Matrizes
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                  <span>Dashboard Formações</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Análise comparativa de matrizes de treinamento (lados A/B), filtros por PRN, código de treinamento e conclusão.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                CSV Nuvem
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 group-hover:text-indigo-700">
                Acessar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* MÓDULO 5: PEOPLE ANALYTICS */}
          <div 
            onClick={onSelectPeopleAnalytics}
            className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Gente & Gestão
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                  <span>People Analytics</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  BI da unidade Bahia (KBA1 / Feira de Santana): quadro de 353 colaboradores, 5 turnos, 48 centros de custo e metas G&G.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                Base KBA1 Oficial
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 group-hover:text-indigo-700">
                Acessar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* MÓDULO 6: LINKS IMPORTANTES & PORTAIS */}
          <div 
            onClick={onSelectLinks}
            className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Portais
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                  <span>Links Importantes & Portais</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Central de links corporativos com categorização personalizada, inclusão, edição e fixação de favoritos.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                {importantLinksCount} links cadastrados
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 group-hover:text-indigo-700">
                Acessar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. UNIT INFORMATION BAR - REFINED INSTITUTIONAL FOOTER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl p-5 border border-slate-200">
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

      {/* Modal de Gestão de Usuários & Administradores */}
      <UserManagerModal
        isOpen={isUserManagerOpen}
        onClose={() => setIsUserManagerOpen(false)}
        onOpenAdminAuth={onOpenAdminAccess}
      />

    </div>
  );
};

