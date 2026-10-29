import React, { useState } from 'react';
import { 
  Clock, TrendingDown, TrendingUp, Sliders, AlertTriangle, 
  CheckCircle2, ArrowRight, UserCheck, ShieldAlert, FileText,
  HelpCircle, ChevronLeft, ChevronRight, Activity, ArrowUpRight
} from 'lucide-react';
import { CalculationRulesModal } from './CalculationRulesModal';

export const AbsenteeismMovementsTab: React.FC = () => {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Lista oficial de movimentações internas da Unidade Bahia
  const movements = [
    {
      name: 'Everton Santos Santana',
      prn: '158921',
      oldJob: 'Operador de Máquinas I',
      newJob: 'Operador de Máquinas II (Onduladeira)',
      sector: 'Onduladeira 2.50m',
      type: 'Promoção Vertical',
      typeColor: 'bg-[#ecfdf5] text-[#047857]',
      reason: 'Aprovação na Matriz de Habilidades nível 3',
      date: '02/05/2024'
    },
    {
      name: 'Lucas Barbosa Pereira',
      prn: '162340',
      oldJob: 'Auxiliar de Produção',
      newJob: 'Operador de Impressora Martin',
      sector: 'Conversão',
      type: 'Promoção Vertical',
      typeColor: 'bg-[#ecfdf5] text-[#047857]',
      reason: 'Conclusão de LUP e treinamento On the Job',
      date: '05/05/2024'
    },
    {
      name: 'Danilo Silva de Alencar',
      prn: '147812',
      oldJob: 'Operador de Empilhadeira',
      newJob: 'Operador de Empilhadeira Líder',
      sector: 'Expedição & Armazém',
      type: 'Meritocracia',
      typeColor: 'bg-[#eff4ff] text-[#306576]',
      reason: 'Excelente índice de segurança e zero avarias em 12 meses',
      date: '10/05/2024'
    },
    {
      name: 'Rafael Mendes Pinheiro',
      prn: '169045',
      oldJob: 'Mecânico de Manutenção Jr',
      newJob: 'Mecânico de Manutenção Pleno',
      sector: 'Manutenção Mecânica',
      type: 'Reenquadramento',
      typeColor: 'bg-[#f1f5f9] text-[#475569]',
      reason: 'Certificação NR-12 e plano de desenvolvimento concluído',
      date: '15/05/2024'
    },
    {
      name: 'Tiago Souza Ribeiro',
      prn: '154032',
      oldJob: 'Operador Conversão T3',
      newJob: 'Operador Conversão T1',
      sector: 'Conversão',
      type: 'Transferência Interturnos',
      typeColor: 'bg-amber-50 text-amber-800 border border-amber-200',
      reason: 'Rebalanceamento de efetivo e demanda de saúde ocupacional',
      date: '20/05/2024'
    },
    {
      name: 'Anderson Ferreira Lima',
      prn: '161109',
      oldJob: 'Auxiliar de Qualidade',
      newJob: 'Assistente de Qualidade Assegurada',
      sector: 'Qualidade & Laboratório',
      type: 'Promoção Vertical',
      typeColor: 'bg-[#ecfdf5] text-[#047857]',
      reason: 'Aprovação em teste técnico de calibração e auditoria ISO',
      date: '22/05/2024'
    }
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOPO: SUBHEADER E AÇÕES OPERACIONAIS */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#0a3641] text-white flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6 text-[#6ffbbe]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">Painel de Absenteísmo & Movimentações</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                Monitoramento Operacional
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unidade Industrial KBA1 • Feira de Santana (BA) • Acompanhamento de Absenteísmo, Horas Perdidas e Movimentações Internas
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsRulesModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#eff4ff] hover:bg-[#dce9ff] text-[#306576] border border-[#b6ebfe] transition-colors flex items-center gap-2 shadow-sm self-start md:self-auto"
        >
          <Sliders className="w-4 h-4 text-[#306576]" />
          Configurar Regras de Apuração
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. OS 5 KPIS RESUMIDOS DE ABSENTEÍSMO & MOVIMENTAÇÕES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Taxa Geral */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Taxa de Absenteísmo</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
              -0,36 p.p.
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">2,14%</span>
              <span className="text-xs text-slate-400">/ 2,50% M3</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Meta Padrão: <strong>2,50%</strong></span>
              <span className="text-[#047857] font-semibold">Dentro do Limite</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Horas Ausência */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Horas Ausência</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
              -110h
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">1.840</span>
              <span className="text-xs text-slate-500 font-semibold">horas</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Mês Anterior: 1.950h</span>
              <span className="text-[#047857] font-semibold">-5,6%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Bradford Factor */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Índice Bradford Médio</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Alerta 12 colab
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">142</span>
              <span className="text-xs text-slate-500 font-semibold">pontos</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Fórmula: <code className="font-mono text-[10px]">B = S² × D</code></span>
              <span className="text-slate-600">Gatilho: 150 pt</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Movimentações Internas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Movimentações Internas</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#306576]">
              +3 vs mês ant.
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">14</span>
              <span className="text-xs text-slate-500 font-semibold">atos</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>9 promoções verticais</span>
              <span className="text-[#306576] font-semibold">64% do total</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Turnover Global */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Turnover Global</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
              -0,32 p.p.
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">1,68%</span>
              <span className="text-xs text-slate-400">/ 2,00% teto</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Retenção 90 dias:</span>
              <span className="text-[#047857] font-semibold">96,4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRÁFICOS ANALÍTICOS: EVOLUÇÃO 12 MESES & QUEBRAS OPERACIONAIS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico SVG Principal: Evolução 12 Meses (Absenteísmo vs Turnover vs Meta 2.5%) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">Evolução Histórica Comparativa (12 Meses)</h3>
              <p className="text-xs text-slate-500">Taxa de Absenteísmo Global (%) vs. Turnover Mensal (%) vs. Meta Padrão (2,50%)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded bg-[#306576] inline-block" /> Absenteísmo
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 rounded bg-[#b3e8fb] inline-block" /> Turnover
              </span>
              <span className="flex items-center gap-1.5 text-red-500">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500 inline-block" /> Meta 2,50%
              </span>
            </div>
          </div>

          {/* SVG Fiel ao Mockup */}
          <div className="w-full h-56 mt-3 relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 720 200">
              <defs>
                <linearGradient id="areaGradientAbs" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#306576" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#306576" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="0" y1="20" x2="720" y2="20" stroke="#E5EEFF" strokeWidth="1" />
              <line x1="0" y1="70" x2="720" y2="70" stroke="#E5EEFF" strokeWidth="1" />
              <line x1="0" y1="120" x2="720" y2="120" stroke="#E5EEFF" strokeWidth="1" />
              <line x1="0" y1="170" x2="720" y2="170" stroke="#E5EEFF" strokeWidth="1" />

              {/* Linha Meta 2.50% (fixa em y=88) */}
              <line x1="0" y1="88" x2="720" y2="88" stroke="#ba1a1a" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="715" y="84" textAnchor="end" className="fill-[#ba1a1a] text-[9px] font-semibold">Meta 2,50%</text>

              {/* Barras de Turnover nos 12 meses */}
              {[
                { x: 30, h: 45 },
                { x: 90, h: 40 },
                { x: 150, h: 38 },
                { x: 210, h: 50 },
                { x: 270, h: 35 },
                { x: 330, h: 42 },
                { x: 390, h: 48 },
                { x: 450, h: 36 },
                { x: 510, h: 44 },
                { x: 570, h: 39 },
                { x: 630, h: 37 },
                { x: 690, h: 34 },
              ].map((bar, i) => (
                <rect key={i} x={bar.x - 10} y={170 - bar.h} width="20" height={bar.h} fill="#b3e8fb" rx="2" />
              ))}

              {/* Curva e Área de Absenteísmo */}
              <polygon
                fill="url(#areaGradientAbs)"
                points="
                  30,105 90,110 150,95 210,98 270,85 330,82
                  390,92 450,90 510,96 570,94 630,98 690,102
                  690,170 30,170
                "
              />

              <polyline
                fill="none"
                stroke="#306576"
                strokeWidth="2.5"
                points="
                  30,105 90,110 150,95 210,98 270,85 330,82
                  390,92 450,90 510,96 570,94 630,98 690,102
                "
              />

              {/* Marcadores */}
              {[
                { x: 30, y: 105 },
                { x: 90, y: 110 },
                { x: 150, y: 95 },
                { x: 210, y: 98 },
                { x: 270, y: 85 },
                { x: 330, y: 82 },
                { x: 390, y: 92 },
                { x: 450, y: 90 },
                { x: 510, y: 96 },
                { x: 570, y: 94 },
                { x: 630, y: 98 },
                { x: 690, y: 102 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r={i === 11 ? '5' : '3.5'} fill={i === 11 ? '#10b981' : '#306576'} stroke="#ffffff" strokeWidth="2" />
              ))}

              {/* X Axis Labels */}
              {['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'].map((m, i) => (
                <text key={i} x={30 + i * 60} y="190" textAnchor="middle" className="fill-slate-500 text-[10px] font-medium">
                  {m}
                </text>
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Média de Absenteísmo 12M: <strong>2,31%</strong></span>
            <span className="text-[#047857] font-semibold">Tendência Atual: Queda (-0,18 p.p.)</span>
            <span>Média Turnover 12M: <strong>1,82%</strong></span>
          </div>
        </div>

        {/* Quebras por Turno & Setor Fabril */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Absenteísmo por Turno</h3>
            <p className="text-xs text-slate-500">Distribuição entre as escalas operacionais</p>

            <div className="space-y-3 mt-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0b1c30]">Turno 1 (06:00 - 14:20)</span>
                  <span className="text-[#047857]">1,82% (Superou M5)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#10b981] h-full rounded-full" style={{ width: '72%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0b1c30]">Turno 2 (14:20 - 22:30)</span>
                  <span className="text-[#047857]">2,45% (Abaixo M3)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#306576] h-full rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0b1c30]">Turno 3 (22:30 - 06:00)</span>
                  <span className="text-amber-700">3,12% (Atenção Requerida)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wide mb-2">Índice por Área Fabril</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[#f8f9ff] border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Onduladeira</span>
                <strong className="text-[#0b1c30] text-sm">2,80%</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#f8f9ff] border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Conversão</span>
                <strong className="text-[#0b1c30] text-sm">2,20%</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#f8f9ff] border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Expedição</span>
                <strong className="text-[#0b1c30] text-sm">1,90%</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#f8f9ff] border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">Manutenção</span>
                <strong className="text-[#0b1c30] text-sm">1,40%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO DONUT: TIPOLOGIA DE AFASTAMENTOS & CAUSAS CID-10 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico Donut SVG: Distribuição das Horas de Ausência */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-[#0b1c30]">Distribuição de Horas de Ausência</h3>
            <p className="text-xs text-slate-500">Tipologia de afastamentos computados no mês (1.840h total)</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto py-4">
            {/* SVG Donut */}
            <div className="relative flex items-center justify-center">
              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#eff4ff" strokeWidth="14" />
                {/* Slice 1: Curta duração (46% -> 109.8 / 238.76) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0a3641" strokeWidth="14" strokeDasharray="109.8 238.76" strokeDashoffset="0" />
                {/* Slice 2: Longa duração (28% -> 66.85) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#306576" strokeWidth="14" strokeDasharray="66.85 238.76" strokeDashoffset="-109.8" />
                {/* Slice 3: Atrasos/Saídas (14% -> 33.42) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#00ae79" strokeWidth="14" strokeDasharray="33.42 238.76" strokeDashoffset="-176.65" />
                {/* Slice 4: Faltas Injustificadas (12% -> 28.65) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ba1a1a" strokeWidth="14" strokeDasharray="28.65 238.76" strokeDashoffset="-210.07" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-[#0b1c30]">1.840</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">horas</span>
              </div>
            </div>

            {/* Legenda com valores */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#0a3641]" />
                <span className="text-slate-600">Curta Duração (&lt; 3 dias):</span>
                <strong className="text-[#0b1c30]">46% (846h)</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#306576]" />
                <span className="text-slate-600">Longa Duração (&gt; 3 dias):</span>
                <strong className="text-[#0b1c30]">28% (515h)</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#00ae79]" />
                <span className="text-slate-600">Atrasos e Saídas:</span>
                <strong className="text-[#0b1c30]">14% (258h)</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#ba1a1a]" />
                <span className="text-slate-600">Faltas Injustificadas:</span>
                <strong className="text-[#ba1a1a]">12% (221h)</strong>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#eff4ff] rounded-xl text-xs text-[#306576] flex items-center justify-between">
            <span>Ponderação Bradford: Ausências curtas têm peso <strong>quadrático</strong></span>
            <span className="font-semibold text-[#0a3641]">Norma KBA1</span>
          </div>
        </div>

        {/* Causas Médicas Primárias (Capítulos CID-10 Agrupados) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">Causas Médicas Primárias (CID-10)</h3>
              <p className="text-xs text-slate-500">Agrupamento corporativo com conformidade LGPD & Sigilo Médico</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#eff4ff] text-[#306576]">
              SESMT KBA1
            </span>
          </div>

          <div className="space-y-4 my-auto py-2">
            {/* Cap. XIII */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#0b1c30]">Cap. XIII (M00-M99) • Doenças Osteomusculares</span>
                <span className="text-[#306576]">42% (773h)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#0a3641] h-full rounded-full" style={{ width: '42%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Lombalgias e tendinopatias na conversão manual</span>
            </div>

            {/* Cap. X */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#0b1c30]">Cap. X (J00-J99) • Aparelho Respiratório</span>
                <span className="text-[#306576]">28% (515h)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#306576] h-full rounded-full" style={{ width: '28%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Sinusites e IVAS sazonais na região de Feira de Santana</span>
            </div>

            {/* Cap. XIX */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#0b1c30]">Cap. XIX (S00-T98) • Lesões & Causas Externas</span>
                <span className="text-[#306576]">18% (331h)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#00ae79] h-full rounded-full" style={{ width: '18%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Contusões e entorses fora da fábrica (trajeto / lazer)</span>
            </div>

            {/* Outros */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#0b1c30]">Outros Capítulos CID-10</span>
                <span className="text-[#306576]">12% (221h)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-slate-300 h-full rounded-full" style={{ width: '12%' }} />
              </div>
              <span className="text-[10px] text-slate-400">Causas gastrointestinais, odontológicas e gerais</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Foco Preventivo SESMT: Ergonomia na alimentação das coladeiras e esteiras de saída.</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TABELA DE MOVIMENTAÇÕES INTERNAS & PROMOÇÕES OPERACIONAIS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Painel de Movimentações Internas & Promoções Operacionais</h3>
            <p className="text-xs text-slate-500">Registro de crescimento profissional, mobilidade de turno e valorização do time KBA1</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#306576]">
            14 Atos Registrados no Mês
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Colaborador / Matrícula</th>
                <th className="py-3 px-3">Cargo de Origem</th>
                <th className="py-3 px-3">Novo Cargo Designado</th>
                <th className="py-3 px-3">Setor Fabril</th>
                <th className="py-3 px-3 text-center">Tipo de Movimento</th>
                <th className="py-3 px-4">Motivação Formalizada</th>
                <th className="py-3 px-3 text-center">Data de Efeito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((mov, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <strong className="text-[#0b1c30] block">{mov.name}</strong>
                    <span className="text-[11px] text-slate-400 font-mono">PRN: {mov.prn}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{mov.oldJob}</td>
                  <td className="py-3 px-3 font-semibold text-[#0a3641]">{mov.newJob}</td>
                  <td className="py-3 px-3 text-slate-600">{mov.sector}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${mov.typeColor}`}>
                      {mov.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{mov.reason}</td>
                  <td className="py-3 px-3 text-center text-slate-500 font-mono">{mov.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela com paginação */}
        <div className="p-3 bg-[#eff4ff] flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/80">
          <span>Mostrando 6 de 14 movimentações registradas na competência</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-40" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 bg-[#0a3641] text-white rounded font-bold text-[11px]">1</span>
            <button className="p-1 rounded text-slate-400 hover:text-slate-700">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. CRITÉRIOS NORMATIVOS & MEMÓRIA DE CÁLCULO */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[#0b1c30] font-bold text-sm">
          <FileText className="w-4 h-4 text-[#306576]" />
          <span>Critérios Normativos & Memória de Cálculo Matemático</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          O absenteísmo da planta industrial de Feira de Santana é apurado de acordo com a norma corporativa <strong>KBA1-DHO-2024</strong>. A taxa representa o quociente entre as horas líquidas de ausência e as horas contratuais teóricas da planta ({'>'} 86.000 h/mês). Para fins do Fator Bradford, considera-se a fórmula padrão internacional <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-[#306576]">B = S² × D</code>, priorizando a estabilização de escalas de revezamento 6x2 e a retenção de operadores qualificados.
        </p>
      </div>

      {/* Modal de Regras */}
      <CalculationRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
};

