import React from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Clock, 
  HelpCircle, ChevronRight, BarChart3, TrendingDown, TrendingUp, Info
} from 'lucide-react';
import { PeopleAnalyticsKPI } from '../../types/peopleAnalytics';

interface IndicatorsGGTabProps {
  kpis: PeopleAnalyticsKPI[];
  onOpenAuditModal: () => void;
  onEditKPI?: (kpi: PeopleAnalyticsKPI) => void;
}

export const IndicatorsGGTab: React.FC<IndicatorsGGTabProps> = ({
  kpis,
  onOpenAuditModal,
  onEditKPI
}) => {
  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOPO: GOVERNANÇA & FILTROS ESTRATÉGICOS */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#0a3641] text-white flex items-center justify-center shadow-sm">
            <BarChart3 className="w-6 h-6 text-[#6ffbbe]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">Indicadores Oficiais de Gente & Gestão</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                Matriz de Metas 1 / 3 / 5
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Governança e auditoria das 9 métricas corporativas regulamentares da planta KBA1 (Feira de Santana - BA)
            </p>
          </div>
        </div>

        <button 
          onClick={onOpenAuditModal}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0a3641] hover:bg-[#306576] text-white transition-colors flex items-center gap-2 shadow-sm self-start md:self-auto"
        >
          <ShieldCheck className="w-4 h-4 text-[#6ffbbe]" />
          Auditar Fórmulas & Metas
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. RESUMO ESTRATÉGICO DOS 9 INDICADORES (6 KPI TILES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Oficiais */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Indicadores Oficiais</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-[#0b1c30]">9</span>
            <span className="text-[10px] text-slate-500">métricas</span>
          </div>
          <span className="text-[10px] text-[#306576] font-medium mt-1 block">100% regulamentadas</span>
        </div>

        {/* Meta 5 Superada */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-[#047857] tracking-wider block">Meta 5 Superada</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-[#047857]">2</span>
            <span className="text-[10px] text-[#047857]/80">nível excelência</span>
          </div>
          <span className="text-[10px] text-[#047857] font-medium mt-1 block">Absenteísmo & Treinamento</span>
        </div>

        {/* Meta 3 Cumprida */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-[#306576] tracking-wider block">Meta 3 Cumprida</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-[#306576]">4</span>
            <span className="text-[10px] text-[#306576]/80">padrão atingido</span>
          </div>
          <span className="text-[10px] text-[#306576] font-medium mt-1 block">Turnover, NRs, Deslig.</span>
        </div>

        {/* Em Atenção */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Em Atenção</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-amber-700">2</span>
            <span className="text-[10px] text-amber-800">desvio moderado</span>
          </div>
          <span className="text-[10px] text-amber-800 font-medium mt-1 block">Horas Extras & Vagas</span>
        </div>

        {/* Desvio Crítico */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Desvio Crítico</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-slate-700">0</span>
            <span className="text-[10px] text-slate-400">intervenções</span>
          </div>
          <span className="text-[10px] text-[#047857] font-semibold mt-1 block">Nenhum indicador crítico</span>
        </div>

        {/* Não Apurado */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Ciclos Periódicos</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-slate-500">1</span>
            <span className="text-[10px] text-slate-400">semestral</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Avaliação Competências</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BENTO GRID DE CARDS ANALÍTICOS (OS 9 INDICADORES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* CARD 1: Taxa de Absenteísmo Global (%) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-[#306576]/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">01 • Taxa de Absenteísmo Global</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Superou Meta 3
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mb-3">Responsável: Júlia Menezes • Gente & Gestão</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">2,14%</span>
                <span className="text-xs text-slate-500">/ 2,50% M3</span>
              </div>
              {/* Mini Sparkline SVG */}
              <svg className="w-20 h-7" viewBox="0 0 80 28">
                <path d="M 0 18 Q 20 22 40 14 T 80 8" fill="none" stroke="#10b981" strokeWidth="2" />
                <circle cx="80" cy="8" r="3" fill="#10b981" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>M1: 3,20%</span>
              <span className="font-semibold text-[#306576]">M3: 2,50%</span>
              <span>M5: 1,80%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#10b981] h-full rounded-full" style={{ width: '74%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
              <span>GAP: -0,36 p.p. (Favorável)</span>
              <span className="text-[#047857] font-semibold">T3 requer atenção</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Total de Horas de Ausência */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-[#306576]/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">02 • Total Horas de Ausência</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Dentro do Esperado
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mb-3">Responsável: Júlia Menezes • Gente & Gestão</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">1.840h</span>
                <span className="text-xs text-slate-500">/ 1.950h M3</span>
              </div>
              <svg className="w-20 h-7" viewBox="0 0 80 28">
                <path d="M 0 20 Q 25 10 50 16 T 80 9" fill="none" stroke="#10b981" strokeWidth="2" />
                <circle cx="80" cy="9" r="3" fill="#10b981" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>M1: 2.200h</span>
              <span className="font-semibold text-[#306576]">M3: 1.950h</span>
              <span>M5: 1.600h</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#10b981] h-full rounded-full" style={{ width: '68%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
              <span>GAP: -110h (Favorável)</span>
              <span>42% causas osteo</span>
            </div>
          </div>
        </div>

        {/* CARD 3: Horas Extras sobre Folha Operacional */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-950">03 • Horas Extras s/ Folha</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Atenção Requerida
              </span>
            </div>
            <span className="text-[11px] text-amber-800/80 block mb-3">Responsável: Carlos Eduardo • Produção</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">6,85%</span>
                <span className="text-xs text-amber-700 font-medium">/ 6,00% meta</span>
              </div>
              <svg className="w-20 h-7" viewBox="0 0 80 28">
                <path d="M 0 24 Q 25 18 50 12 T 80 6" fill="none" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="80" cy="6" r="3" fill="#f59e0b" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-amber-200/60 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>M1: 8,00%</span>
              <span className="font-semibold text-amber-900">M3: 6,00%</span>
              <span>M5: 4,00%</span>
            </div>
            <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-amber-900 pt-0.5 font-mono">
              <span>GAP: +0,85 p.p. (Desvio)</span>
              <span>T3 Martin lidera HE</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Índice de Turnover / Rotatividade */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-[#306576]/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">04 • Índice de Turnover Global</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Superou Meta 3
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mb-3">Responsável: Júlia Menezes • Gente & Gestão</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">1,68%</span>
                <span className="text-xs text-slate-500">/ 2,00% M3</span>
              </div>
              <svg className="w-20 h-7" viewBox="0 0 80 28">
                <path d="M 0 12 Q 25 20 50 15 T 80 18" fill="none" stroke="#10b981" strokeWidth="2" />
                <circle cx="80" cy="18" r="3" fill="#10b981" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>M1: 2,50%</span>
              <span className="font-semibold text-[#306576]">M3: 2,00%</span>
              <span>M5: 1,20%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#10b981] h-full rounded-full" style={{ width: '78%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
              <span>GAP: -0,32 p.p. (Favorável)</span>
              <span>Retenção 98,3%</span>
            </div>
          </div>
        </div>

        {/* CARD 5: Admissões no Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-[#306576]/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">05 • Admissões no Mês</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#306576]">
                Vagas em Andamento
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mb-3">Responsável: Tatiele Santana • R&S</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">8</span>
                <span className="text-xs text-slate-500">/ 10 previstas M3</span>
              </div>
              <svg className="w-20 h-7" viewBox="0 0 80 28">
                <path d="M 0 16 Q 30 10 50 18 T 80 12" fill="none" stroke="#306576" strokeWidth="2" />
                <circle cx="80" cy="12" r="3" fill="#306576" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>M1: 6</span>
              <span className="font-semibold text-[#306576]">M3: 10</span>
              <span>M5: 14</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#306576] h-full rounded-full" style={{ width: '80%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
              <span>GAP: -2 vagas</span>
              <span>SLA R&S: 21 dias</span>
            </div>
          </div>
        </div>

        {/* CARD 6: Desligamentos no Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-[#306576]/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">06 • Desligamentos Totais</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Limite Respeitado
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mb-3">Responsável: Tatiele Santana • R&S</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">8</span>
                <span className="text-xs text-slate-500">/ 9 max M3</span>
              </div>
              <svg className="w-20 h-7" viewBox="0 0 80 28">
                <path d="M 0 10 Q 30 18 55 12 T 80 14" fill="none" stroke="#10b981" strokeWidth="2" />
                <circle cx="80" cy="14" r="3" fill="#10b981" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>M1: 12</span>
              <span className="font-semibold text-[#306576]">M3: 9</span>
              <span>M5: 6</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#10b981] h-full rounded-full" style={{ width: '88%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
              <span>GAP: -1 (Favorável)</span>
              <span>Turnover controlado</span>
            </div>
          </div>
        </div>

        {/* CARD 7: Média Horas Treinamento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-[#306576]/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">07 • Média Horas Treinamento</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Superou Meta 3
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mb-3">Responsável: Bianca Rios • DHO</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">4,80h</span>
                <span className="text-xs text-slate-500">/ 4,00h M3</span>
              </div>
              <svg className="w-20 h-7" viewBox="0 0 80 28">
                <path d="M 0 22 Q 25 15 50 18 T 80 6" fill="none" stroke="#10b981" strokeWidth="2" />
                <circle cx="80" cy="6" r="3" fill="#10b981" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>M1: 3,50h</span>
              <span className="font-semibold text-[#306576]">M3: 4,00h</span>
              <span>M5: 5,00h</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#10b981] h-full rounded-full" style={{ width: '92%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
              <span>GAP: +0,80h (Favorável)</span>
              <span>LUPs operacionais</span>
            </div>
          </div>
        </div>

        {/* CARD 8: Treinamentos Legais & NRs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-[#306576]/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">08 • Treinamentos Legais & NRs</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                Compliance OK
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mb-3">Responsável: Bianca Rios • SESMT</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">98,20%</span>
                <span className="text-xs text-slate-500">/ 98,0% M3</span>
              </div>
              <svg className="w-20 h-7" viewBox="0 0 80 28">
                <path d="M 0 15 Q 25 12 50 14 T 80 8" fill="none" stroke="#10b981" strokeWidth="2" />
                <circle cx="80" cy="8" r="3" fill="#10b981" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>M1: 95,0%</span>
              <span className="font-semibold text-[#306576]">M3: 98,0%</span>
              <span>M5: 100,0%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#10b981] h-full rounded-full" style={{ width: '98.2%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
              <span>GAP: +0,20 p.p.</span>
              <span>NR-10/11/12/35 vigentes</span>
            </div>
          </div>
        </div>

        {/* CARD 9: Aderência à Avaliação de Competências (REGRA ESTRITA: TRAÇO '-' E TAG CINZA) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">09 • Avaliação de Competências</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f1f5f9] text-[#475569]">
                Não apurado nesta competência
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mb-3">Responsável: Bianca Rios • DHO</span>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-400">—</span>
                <span className="text-xs text-slate-400">/ 92,0% M3</span>
              </div>
              <span className="text-[11px] text-slate-400 italic">Ciclo Semestral</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>M1: 85,0%</span>
              <span>M3: 92,0%</span>
              <span>M5: 98,0%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-slate-300 h-full rounded-full" style={{ width: '0%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
              <span>GAP: —</span>
              <span>Próximo ciclo: Julho</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABELA CONSOLIDADA EXECUTIVA DA MATRIZ OFICIAL */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Tabela Consolidada Executiva da Matriz Oficial</h3>
            <p className="text-xs text-slate-500">Mapeamento paramétrico com metas 1, 3 e 5, realizado e status de governança</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#306576]">
            Auditoria KBA1-DHO
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Indicador & Responsável</th>
                <th className="py-3 px-3 text-center">Unid.</th>
                <th className="py-3 px-3 text-right">Meta 1 (Básica)</th>
                <th className="py-3 px-3 text-right">Meta 3 (Padrão)</th>
                <th className="py-3 px-3 text-right">Meta 5 (Desafio)</th>
                <th className="py-3 px-3 text-right">Realizado</th>
                <th className="py-3 px-3 text-right">GAP vs Meta 3</th>
                <th className="py-3 px-4 text-center">Status Semântico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Linha 1 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <div>
                      <strong className="text-[#0b1c30] block">01 • Taxa de Absenteísmo Global</strong>
                      <span className="text-[11px] text-slate-400">Júlia Menezes • Gente & Gestão</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-500">% Horas</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">3,20%</td>
                <td className="py-3 px-3 text-right font-semibold text-[#306576] font-mono">2,50%</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">1,80%</td>
                <td className="py-3 px-3 text-right font-bold text-[#0b1c30] font-mono">2,14%</td>
                <td className="py-3 px-3 text-right font-bold text-[#047857] font-mono">-0,36 p.p.</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Superou Meta 3
                  </span>
                </td>
              </tr>

              {/* Linha 2 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <div>
                      <strong className="text-[#0b1c30] block">02 • Total de Horas de Ausência</strong>
                      <span className="text-[11px] text-slate-400">Júlia Menezes • Gente & Gestão</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-500">Horas</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">2.200h</td>
                <td className="py-3 px-3 text-right font-semibold text-[#306576] font-mono">1.950h</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">1.600h</td>
                <td className="py-3 px-3 text-right font-bold text-[#0b1c30] font-mono">1.840h</td>
                <td className="py-3 px-3 text-right font-bold text-[#047857] font-mono">-110h</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Dentro do Esperado
                  </span>
                </td>
              </tr>

              {/* Linha 3 */}
              <tr className="hover:bg-slate-50/80 transition-colors bg-amber-50/20">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <div>
                      <strong className="text-amber-950 block">03 • Horas Extras s/ Folha Operacional</strong>
                      <span className="text-[11px] text-amber-800">Carlos Eduardo • Produção</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-500">% Folha</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">8,0%</td>
                <td className="py-3 px-3 text-right font-semibold text-amber-900 font-mono">6,0%</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">4,0%</td>
                <td className="py-3 px-3 text-right font-bold text-amber-950 font-mono">6,85%</td>
                <td className="py-3 px-3 text-right font-bold text-amber-800 font-mono">+0,85 p.p.</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Atenção Requerida
                  </span>
                </td>
              </tr>

              {/* Linha 4 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <div>
                      <strong className="text-[#0b1c30] block">04 • Índice de Turnover Global</strong>
                      <span className="text-[11px] text-slate-400">Júlia Menezes • Gente & Gestão</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-500">% Headcount</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">2,50%</td>
                <td className="py-3 px-3 text-right font-semibold text-[#306576] font-mono">2,00%</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">1,20%</td>
                <td className="py-3 px-3 text-right font-bold text-[#0b1c30] font-mono">1,68%</td>
                <td className="py-3 px-3 text-right font-bold text-[#047857] font-mono">-0,32 p.p.</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Superou Meta 3
                  </span>
                </td>
              </tr>

              {/* Linha 5 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#306576]" />
                    <div>
                      <strong className="text-[#0b1c30] block">05 • Admissões no Mês</strong>
                      <span className="text-[11px] text-slate-400">Tatiele Santana • R&S</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-500">Colab</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">6</td>
                <td className="py-3 px-3 text-right font-semibold text-[#306576] font-mono">10</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">14</td>
                <td className="py-3 px-3 text-right font-bold text-[#0b1c30] font-mono">8</td>
                <td className="py-3 px-3 text-right font-bold text-slate-600 font-mono">-2 vagas</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#306576]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#306576]" /> Vagas em Andamento
                  </span>
                </td>
              </tr>

              {/* Linha 6 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <div>
                      <strong className="text-[#0b1c30] block">06 • Desligamentos Totais no Mês</strong>
                      <span className="text-[11px] text-slate-400">Tatiele Santana • R&S</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-500">Colab</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">12</td>
                <td className="py-3 px-3 text-right font-semibold text-[#306576] font-mono">9</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">6</td>
                <td className="py-3 px-3 text-right font-bold text-[#0b1c30] font-mono">8</td>
                <td className="py-3 px-3 text-right font-bold text-[#047857] font-mono">-1 (Favorável)</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Limite Respeitado
                  </span>
                </td>
              </tr>

              {/* Linha 7 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <div>
                      <strong className="text-[#0b1c30] block">07 • Média Horas Treinamento / Colaborador</strong>
                      <span className="text-[11px] text-slate-400">Bianca Rios • DHO</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-500">H/Homem</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">3,50h</td>
                <td className="py-3 px-3 text-right font-semibold text-[#306576] font-mono">4,00h</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">5,00h</td>
                <td className="py-3 px-3 text-right font-bold text-[#0b1c30] font-mono">4,80h</td>
                <td className="py-3 px-3 text-right font-bold text-[#047857] font-mono">+0,80h</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Superou Meta 3
                  </span>
                </td>
              </tr>

              {/* Linha 8 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <div>
                      <strong className="text-[#0b1c30] block">08 • Treinamentos Legais & NRs</strong>
                      <span className="text-[11px] text-slate-400">Bianca Rios • SESMT</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-500">% Cobertura</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">95,0%</td>
                <td className="py-3 px-3 text-right font-semibold text-[#306576] font-mono">98,0%</td>
                <td className="py-3 px-3 text-right text-slate-600 font-mono">100,0%</td>
                <td className="py-3 px-3 text-right font-bold text-[#0b1c30] font-mono">98,20%</td>
                <td className="py-3 px-3 text-right font-bold text-[#047857] font-mono">+0,20 p.p.</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Compliance OK
                  </span>
                </td>
              </tr>

              {/* Linha 9: DADOS NÃO APURADOS (REGRA ESTRITA: TRAÇO '-' E TAG CINZA) */}
              <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <div>
                      <strong className="text-slate-600 block">09 • Aderência à Avaliação de Competências</strong>
                      <span className="text-[11px] text-slate-400">Bianca Rios • DHO</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-400">% Ciclos</td>
                <td className="py-3 px-3 text-right text-slate-400 font-mono">85,0%</td>
                <td className="py-3 px-3 text-right font-semibold text-slate-400 font-mono">92,0%</td>
                <td className="py-3 px-3 text-right text-slate-400 font-mono">98,0%</td>
                <td className="py-3 px-3 text-right font-bold text-slate-400 font-mono">—</td>
                <td className="py-3 px-3 text-right font-bold text-slate-400 font-mono italic">—</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f1f5f9] text-[#475569]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Não apurado nesta competência
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* NOTA DE RODAPÉ DA MATRIZ */}
        <div className="p-3 bg-[#eff4ff] flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] border-t border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#306576]" />
            <span>A apuração da Avaliação de Competências é semestral (próximo fechamento em Julho/2024).</span>
          </div>
          <div>
            <span>Auditoria Interna KBA1 • Norma DHO-2024</span>
          </div>
        </div>
      </div>
    </div>
  );
};

