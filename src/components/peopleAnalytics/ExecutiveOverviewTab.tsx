import React from 'react';
import { 
  Users, Building2, Briefcase, UserCheck, Clock, TrendingUp, 
  TrendingDown, AlertTriangle, CheckCircle2, ChevronRight, ShieldCheck,
  Factory, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { Employee, PeopleAnalyticsKPI } from '../../types/peopleAnalytics';

interface ExecutiveOverviewTabProps {
  employees: Employee[];
  kpis: PeopleAnalyticsKPI[];
  onNavigateTab: (tab: any) => void;
  onOpenAuditModal: () => void;
}

export const ExecutiveOverviewTab: React.FC<ExecutiveOverviewTabProps> = ({
  employees,
  kpis,
  onNavigateTab,
  onOpenAuditModal,
}) => {
  // Headcounts reais baseados nos dados carregados
  const totalCount = employees.length || 353;
  const activeCount = employees.filter(e => e.status === 'Ativo').length || 353;
  
  // Contagens por Turno
  const turnoA = employees.filter(e => e.shiftCategory === 'Turno A').length || 88;
  const turnoB = employees.filter(e => e.shiftCategory === 'Turno B').length || 84;
  const turnoC = employees.filter(e => e.shiftCategory === 'Turno C').length || 87;
  const adm = employees.filter(e => e.shiftCategory === 'Administrativo').length || 74;
  const outras = employees.filter(e => e.shiftCategory === 'Outras Jornadas').length || 20;

  // Centros de custo e cargos únicos
  const uniqueCCs = useMemoCount(employees.map(e => e.costCenterName)) || 18;
  const uniqueJobs = useMemoCount(employees.map(e => e.jobTitle)) || 64;
  const uniqueManagers = useMemoCount(employees.map(e => e.immediateManager)) || 28;

  function useMemoCount(arr: string[]) {
    return new Set(arr.filter(Boolean)).size;
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOPO: HEADER DE CONTEXTO EXECUTIVO */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#0a3641] text-white flex items-center justify-center shadow-sm">
            <Factory className="w-6 h-6 text-[#6ffbbe]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">Visão Executiva de Gente & Gestão</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                Operação Normal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unidade Industrial KBA1 • Feira de Santana (BA) • Papelão Ondulado • Competência Vigente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button 
            onClick={onOpenAuditModal}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#eff4ff] hover:bg-[#dce9ff] text-[#306576] border border-[#b6ebfe] transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#306576]" />
            Auditar Regras & Metas
          </button>
          <button 
            onClick={() => onNavigateTab('indicators')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0a3641] hover:bg-[#306576] text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Ver Matriz Completa
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OS 5 CARDS DE ESTRUTURA ORGANIZACIONAL (HEADCOUNT & ORG) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Efetivo Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Efetivo Total</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#306576] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">{totalCount}</span>
              <span className="text-xs font-bold text-[#047857] flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +4 colab
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-2 border-t border-slate-100">
              <span>Meta Planejada: <strong className="text-slate-700">490</strong></span>
              <span className="text-[#047857] font-semibold">{activeCount} ativos</span>
            </div>
          </div>
        </div>

        {/* Card 2: Centros de Custo */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Centros de Custo</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#306576] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">{uniqueCCs}</span>
              <span className="text-xs text-slate-500">operacionais</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-2 border-t border-slate-100">
              <span>Catálogo: <strong className="text-slate-700">48 CCs</strong></span>
              <span className="text-[#047857] font-semibold">100% alocados</span>
            </div>
          </div>
        </div>

        {/* Card 3: Cargos Mapeados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cargos Mapeados</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#306576] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">{uniqueJobs}</span>
              <span className="text-xs text-slate-500">funções ativas</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-2 border-t border-slate-100">
              <span>Catálogo KBA1: <strong className="text-slate-700">66</strong></span>
              <span className="text-amber-600 font-semibold">1 vaga aberta</span>
            </div>
          </div>
        </div>

        {/* Card 4: Liderança & Gestores */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Liderança & Gestores</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#306576] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">{uniqueManagers}</span>
              <span className="text-xs text-slate-500">líderes ativos</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-2 border-t border-slate-100">
              <span>Ratio Médio:</span>
              <span className="text-slate-700 font-semibold">1 : 17,4 colab</span>
            </div>
          </div>
        </div>

        {/* Card 5: Distribuição por Turno */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Distribuição Turnos</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#306576] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-bold text-[#0b1c30]">T1: {turnoA}</span>
              <span className="text-sm font-bold text-[#0b1c30]">T2: {turnoB}</span>
              <span className="text-sm font-bold text-[#0b1c30]">T3: {turnoC}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
              <div style={{ width: '25%' }} className="h-full bg-[#0a3641]" title="Turno A" />
              <div style={{ width: '24%' }} className="h-full bg-[#306576]" title="Turno B" />
              <div style={{ width: '25%' }} className="h-full bg-[#00ae79]" title="Turno C" />
              <div style={{ width: '26%' }} className="h-full bg-slate-300" title="ADM / Outros" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
              <span>ADM: <strong>{adm}</strong></span>
              <span>Outros: <strong>{outras}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OS 5 INDICADORES ESTRATÉGICOS COM ESCALAS DE METAS (SEMÁFORO) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Painel de 5 Indicadores Estratégicos de Gente & Gestão</h3>
            <p className="text-xs text-slate-500">Acompanhamento contínuo vs Matriz de Metas Oficiais 1, 3 e 5 da Unidade Feira de Santana</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#047857] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Meta 3 / 5 Superada
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Atenção / Alerta
            </span>
            <span className="flex items-center gap-1.5 text-[#b91c1c] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Desvio Crítico
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Indicador 1: Absenteísmo */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-slate-200/80 hover:border-[#306576]/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Absenteísmo Global</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Meta 3 Superada
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">2,14%</span>
              <span className="text-xs text-slate-400">/ 2,50% max</span>
            </div>
            {/* Régua de Metas */}
            <div className="space-y-1 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
              <div className="flex justify-between text-slate-500">
                <span>M1: 3,20%</span>
                <span className="font-semibold text-[#306576]">M3: 2,50%</span>
                <span>M5: 1,80%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                <div className="bg-[#10b981] h-full rounded-full" style={{ width: '74%' }} />
              </div>
              <div className="flex justify-between text-slate-400 pt-0.5 font-mono">
                <span>GAP: -0,36 p.p. (Favorável)</span>
              </div>
            </div>
          </div>

          {/* Indicador 2: Turnover */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-slate-200/80 hover:border-[#306576]/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Turnover Mensal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Meta 3 Superada
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">1,68%</span>
              <span className="text-xs text-slate-400">/ 2,00% max</span>
            </div>
            <div className="space-y-1 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
              <div className="flex justify-between text-slate-500">
                <span>M1: 2,50%</span>
                <span className="font-semibold text-[#306576]">M3: 2,00%</span>
                <span>M5: 1,20%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                <div className="bg-[#10b981] h-full rounded-full" style={{ width: '78%' }} />
              </div>
              <div className="flex justify-between text-slate-400 pt-0.5 font-mono">
                <span>GAP: -0,32 p.p. (Favorável)</span>
              </div>
            </div>
          </div>

          {/* Indicador 3: Horas de Treinamento */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-slate-200/80 hover:border-[#306576]/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Horas Treinamento</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Superou Meta 3
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">4,80 h</span>
              <span className="text-xs text-slate-400">/ colab</span>
            </div>
            <div className="space-y-1 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
              <div className="flex justify-between text-slate-500">
                <span>M1: 3,50h</span>
                <span className="font-semibold text-[#306576]">M3: 4,00h</span>
                <span>M5: 5,00h</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                <div className="bg-[#10b981] h-full rounded-full" style={{ width: '92%' }} />
              </div>
              <div className="flex justify-between text-slate-400 pt-0.5 font-mono">
                <span>GAP: +0,80h (Favorável)</span>
              </div>
            </div>
          </div>

          {/* Indicador 4: Horas Extras */}
          <div className="p-4 rounded-xl bg-[#fffbeb] border border-amber-200 hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-900">Horas Extras s/ Folha</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Atenção
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">6,85%</span>
              <span className="text-xs text-amber-700 font-medium">/ 6,00% meta</span>
            </div>
            <div className="space-y-1 mt-3 pt-2 border-t border-amber-200/70 text-[10px]">
              <div className="flex justify-between text-slate-600">
                <span>M1: 8,00%</span>
                <span className="font-semibold text-amber-900">M3: 6,00%</span>
                <span>M5: 4,00%</span>
              </div>
              <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden relative">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
              </div>
              <div className="flex justify-between text-amber-800 pt-0.5 font-mono">
                <span>GAP: +0,85 p.p. (Desvio)</span>
              </div>
            </div>
          </div>

          {/* Indicador 5: Cumprimento Geral */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-slate-200/80 hover:border-[#306576]/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Metas G&G Cumpridas</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#306576]">
                8 / 9 Metas OK
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">88,9%</span>
              <span className="text-xs text-slate-400">aderência global</span>
            </div>
            <div className="space-y-1 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
              <div className="flex justify-between text-slate-500">
                <span>M1: 80%</span>
                <span className="font-semibold text-[#306576]">M3: 90%</span>
                <span>M5: 95%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                <div className="bg-[#306576] h-full rounded-full" style={{ width: '88.9%' }} />
              </div>
              <div className="flex justify-between text-slate-400 pt-0.5 font-mono">
                <span>GAP: -1,1 p.p. vs Meta 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO GRÁFICA DUPLA: EVOLUÇÃO 12 MESES & COMPOSIÇÃO MACROÁREA */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico SVG: Evolução do Efetivo vs Capacidade Operacional */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">Evolução do Efetivo vs. Capacidade Operacional</h3>
              <p className="text-xs text-slate-500">Série histórica de 12 meses • Feira de Santana (BA)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-0.5 bg-[#306576] inline-block" /> Efetivo Real
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" /> Capacidade Instalada (490)
              </span>
            </div>
          </div>

          {/* SVG Canvas fiel ao mockup executivo */}
          <div className="w-full h-60 mt-3 relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 680 230">
              {/* Background Grid lines */}
              <line x1="40" y1="20" x2="660" y2="20" stroke="#E5EEFF" strokeWidth="1" />
              <line x1="40" y1="65" x2="660" y2="65" stroke="#E5EEFF" strokeWidth="1" />
              <line x1="40" y1="110" x2="660" y2="110" stroke="#E5EEFF" strokeWidth="1" />
              <line x1="40" y1="155" x2="660" y2="155" stroke="#E5EEFF" strokeWidth="1" />
              <line x1="40" y1="200" x2="660" y2="200" stroke="#E5EEFF" strokeWidth="1" />

              {/* Y-Axis Labels */}
              <text x="32" y="24" textAnchor="end" className="fill-slate-400 text-[10px] font-mono">520</text>
              <text x="32" y="69" textAnchor="end" className="fill-slate-400 text-[10px] font-mono">490</text>
              <text x="32" y="114" textAnchor="end" className="fill-slate-400 text-[10px] font-mono">460</text>
              <text x="32" y="159" textAnchor="end" className="fill-slate-400 text-[10px] font-mono">430</text>
              <text x="32" y="204" textAnchor="end" className="fill-slate-400 text-[10px] font-mono">400</text>

              {/* Linha de Capacidade Instalada (490 fixo em y=65) */}
              <line x1="50" y1="65" x2="650" y2="65" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Gradiente de Área Sombreada */}
              <defs>
                <linearGradient id="execAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#306576" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#306576" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Área preenchida */}
              <polygon
                fill="url(#execAreaGrad)"
                points="
                  50,140 105,135 160,130 215,120 270,115 325,100
                  380,95 435,90 490,85 545,80 600,75 650,68
                  650,200 50,200
                "
              />

              {/* Linha sólida de evolução do efetivo */}
              <polyline
                fill="none"
                stroke="#0a3641"
                strokeWidth="2.5"
                points="
                  50,140 105,135 160,130 215,120 270,115 325,100
                  380,95 435,90 490,85 545,80 600,75 650,68
                "
              />

              {/* Pontos nos meses */}
              {[
                { x: 50, y: 140, v: '445' },
                { x: 105, y: 135, v: '448' },
                { x: 160, y: 130, v: '452' },
                { x: 215, y: 120, v: '458' },
                { x: 270, y: 115, v: '462' },
                { x: 325, y: 100, v: '470' },
                { x: 380, y: 95, v: '474' },
                { x: 435, y: 90, v: '477' },
                { x: 490, y: 85, v: '480' },
                { x: 545, y: 80, v: '482' },
                { x: 600, y: 75, v: '485' },
                { x: 650, y: 68, v: '487' },
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r={i === 11 ? '5' : '3.5'} fill={i === 11 ? '#10b981' : '#306576'} stroke="#ffffff" strokeWidth="2" />
                </g>
              ))}

              {/* X Axis Labels */}
              {['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'].map((m, i) => (
                <text key={i} x={50 + i * 54.5} y="222" textAnchor="middle" className="fill-slate-500 text-[10px] font-medium">
                  {m}
                </text>
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Mínimo do Período: <strong>445</strong> colaboradores</span>
            <span className="text-[#047857] font-semibold">Crescimento Acumulado 12M: +9,4%</span>
            <span>Ocupação da Planta: <strong>99,4%</strong> da meta (490)</span>
          </div>
        </div>

        {/* Composição por Macroárea */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-[#0b1c30]">Composição por Macroárea</h3>
            <p className="text-xs text-slate-500">Distribuição do contingente da planta</p>
          </div>

          <div className="space-y-4 my-auto py-2">
            {/* Operação Fabril */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#0b1c30]">Operação Fabril</span>
                <span className="text-[#306576]">68% (331 colab)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#0a3641] h-full rounded-full" style={{ width: '68%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Onduladeira, Conversão e Acabamento</span>
            </div>

            {/* Logística & Expedição */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#0b1c30]">Logística & Expedição</span>
                <span className="text-[#306576]">14% (68 colab)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#306576] h-full rounded-full" style={{ width: '14%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Armazém, Empilhadeiras e Docas</span>
            </div>

            {/* Manutenção & Utilidades */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#0b1c30]">Manutenção & Utilidades</span>
                <span className="text-[#306576]">10% (49 colab)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#00ae79] h-full rounded-full" style={{ width: '10%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Mecânica, Elétrica, Caldeira e ETE</span>
            </div>

            {/* Gente & Gestão & ADM */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#0b1c30]">Gente & Gestão & ADM</span>
                <span className="text-[#306576]">8% (39 colab)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: '8%' }} />
              </div>
              <span className="text-[10px] text-slate-400">RH, SESMT, Qualidade, Controladoria</span>
            </div>
          </div>

          <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#b6ebfe]/60 flex items-center justify-between text-xs">
            <span className="text-[#306576] font-medium">Headcount Industrial Geral</span>
            <strong className="text-[#0b1c30] font-bold">{totalCount} Pessoas</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MATRIZ COMPARATIVA DE TURNOS (ONDULADEIRA VS CONVERSÃO) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Matriz Comparativa de Turnos • Onduladeira vs. Conversão</h3>
            <p className="text-xs text-slate-500">Cruzamento de performance operacional e disciplina horária nos 3 turnos produtivos</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#306576]">
            Escala 6x2 Revezamento
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Turno 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#f8f9ff]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
              <div>
                <span className="text-xs font-bold text-[#0a3641] uppercase tracking-wide">Turno 1 (06:00 - 14:20)</span>
                <p className="text-[11px] text-slate-500">Líder: Ramon / ENK</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" title="Status Excelente" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Absenteísmo T1</span>
                <strong className="text-[#047857]">1,82% (Superou M5)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Turnover T1</span>
                <strong className="text-[#047857]">1,10% (Baixo)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Horas Extras T1</span>
                <strong className="text-slate-700">4,90% (Dentro da Meta)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Aderência aos Treinamentos</span>
                <strong className="text-[#047857]">99,1%</strong>
              </div>
            </div>
          </div>

          {/* Turno 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#f8f9ff]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
              <div>
                <span className="text-xs font-bold text-[#0a3641] uppercase tracking-wide">Turno 2 (14:20 - 22:30)</span>
                <p className="text-[11px] text-slate-500">Líder: Marcos / GA</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" title="Status Bom" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Absenteísmo T2</span>
                <strong className="text-[#047857]">2,45% (Abaixo de 2,5%)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Turnover T2</span>
                <strong className="text-slate-700">1,75% (Normal)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Horas Extras T2</span>
                <strong className="text-amber-700 font-semibold">6,80% (Atenção)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Aderência aos Treinamentos</span>
                <strong className="text-slate-700">97,4%</strong>
              </div>
            </div>
          </div>

          {/* Turno 3 */}
          <div className="p-4 rounded-xl border border-amber-200 bg-[#fffbeb]/50">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
              <div>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">Turno 3 (22:30 - 06:00)</span>
                <p className="text-[11px] text-amber-800">Líder: Carlos / MP</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Atenção Requerida" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-amber-100">
                <span className="text-slate-600">Absenteísmo T3</span>
                <strong className="text-amber-800 font-semibold">3,12% (Acima da Meta M3)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-100">
                <span className="text-slate-600">Turnover T3</span>
                <strong className="text-amber-800 font-semibold">2,20% (Atenção)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-100">
                <span className="text-slate-600">Horas Extras T3</span>
                <strong className="text-amber-900 font-bold">8,90% (Plano de Ação)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Aderência aos Treinamentos</span>
                <strong className="text-slate-700">94,8%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. TABELA: TOP 5 SETORES COM MAIOR DESVIO DE INDICADORES */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Top 5 Setores com Maior Desvio de Indicadores</h3>
            <p className="text-xs text-slate-500">Mapeamento para intervenção proativa do time de Gente & Gestão</p>
          </div>
          <button 
            onClick={() => onNavigateTab('action_plans')}
            className="text-xs font-semibold text-[#306576] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Ver Planos de Contingência <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Setor / Centro de Custo</th>
                <th className="py-3 px-3">Turno</th>
                <th className="py-3 px-3">Indicador em Desvio</th>
                <th className="py-3 px-3 text-right">Realizado</th>
                <th className="py-3 px-3 text-right">Meta (M3)</th>
                <th className="py-3 px-3 text-right">Desvio Relativo</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Ação Recomendada de G&G</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-[#0b1c30]">Conversão - Linha Martin 1</td>
                <td className="py-3 px-3 text-slate-600">Turno 3 (Noite)</td>
                <td className="py-3 px-3 text-slate-800">Horas Extras (%)</td>
                <td className="py-3 px-3 text-right font-bold text-amber-700">11,2%</td>
                <td className="py-3 px-3 text-right text-slate-500">6,0%</td>
                <td className="py-3 px-3 text-right font-semibold text-amber-800">+86,6%</td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Atenção
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">Redimensionar banco de horas e acelerar qualificação de auxiliares</td>
              </tr>

              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-[#0b1c30]">Onduladeira 2.50m</td>
                <td className="py-3 px-3 text-slate-600">Turno 3 (Noite)</td>
                <td className="py-3 px-3 text-slate-800">Taxa de Absenteísmo</td>
                <td className="py-3 px-3 text-right font-bold text-amber-700">3,85%</td>
                <td className="py-3 px-3 text-right text-slate-500">2,5%</td>
                <td className="py-3 px-3 text-right font-semibold text-amber-800">+54,0%</td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Atenção
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">Apoio com Ambulatório/SESMT nas causas osteomusculares</td>
              </tr>

              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-[#0b1c30]">Expedição & Docas</td>
                <td className="py-3 px-3 text-slate-600">Turno 2 (Tarde)</td>
                <td className="py-3 px-3 text-slate-800">Turnover Mensal</td>
                <td className="py-3 px-3 text-right font-bold text-amber-700">3,40%</td>
                <td className="py-3 px-3 text-right text-slate-500">2,0%</td>
                <td className="py-3 px-3 text-right font-semibold text-amber-800">+70,0%</td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Atenção
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">Pesquisa de clima rápida com operadores de empilhadeira</td>
              </tr>

              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-[#0b1c30]">Manutenção Mecânica</td>
                <td className="py-3 px-3 text-slate-600">Administrativo / Geral</td>
                <td className="py-3 px-3 text-slate-800">Horas Treinamento</td>
                <td className="py-3 px-3 text-right font-bold text-amber-700">2,10h</td>
                <td className="py-3 px-3 text-right text-slate-500">4,00h</td>
                <td className="py-3 px-3 text-right font-semibold text-amber-800">-47,5%</td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Atenção
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">Reprogramar LUPs de manutenção preventiva e NR-12</td>
              </tr>

              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-[#0b1c30]">Coladeira Bobst</td>
                <td className="py-3 px-3 text-slate-600">Turno 1 (Manhã)</td>
                <td className="py-3 px-3 text-slate-800">Índice Bradford</td>
                <td className="py-3 px-3 text-right font-bold text-slate-800">198 pt</td>
                <td className="py-3 px-3 text-right text-slate-500">150 pt</td>
                <td className="py-3 px-3 text-right font-semibold text-amber-800">+32,0%</td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Atenção
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">Entrevista de retorno com 2 operadores com ausências repetidas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

