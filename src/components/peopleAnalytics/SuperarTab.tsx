import React, { useState } from 'react';
import { 
  Award, CheckCircle2, AlertTriangle, Clock, TrendingUp, 
  HelpCircle, Sparkles, Filter, ChevronRight, FileText, 
  Edit3, BarChart2, ShieldCheck, Flame, BookOpen, Calendar,
  Table, RefreshCw, Check
} from 'lucide-react';
import { 
  SuperarAudit, SuperarMonthlyIndicator, SeloPremise,
  SUPERAR_AUDITS_2026, SUPERAR_INDICATORS_2026, SELO_PREMISES_INITIAL,
  generateAutoDiagnosis
} from '../../data/superarInitialData';
import { SuperarTableEditModal } from './SuperarTableEditModal';

interface SuperarTabProps {
  onOpenDataEntry?: () => void;
  year: number;
  onYearChange: (year: number) => void;
  audits: SuperarAudit[];
  indicators: SuperarMonthlyIndicator[];
  onSaveYearData: (year: number, indicators: SuperarMonthlyIndicator[], audits: SuperarAudit[]) => void;
}

const MONTHS_LIST = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export const SuperarTab: React.FC<SuperarTabProps> = ({ 
  onOpenDataEntry,
  year,
  onYearChange,
  audits,
  indicators,
  onSaveYearData,
}) => {
  const [selectedAlavanca, setSelectedAlavanca] = useState<string>('all');
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');

  // Filtragem por Alavanca
  const filteredIndicators = indicators.filter(ind => {
    if (selectedAlavanca === 'all') return true;
    return ind.alavanca.toLowerCase() === selectedAlavanca.toLowerCase();
  });

  // Função para retornar a classe de cor da célula baseada na meta
  const getCellColorClass = (ind: SuperarMonthlyIndicator, val: number | null): string => {
    if (val === null || val === undefined) {
      return 'bg-slate-50 text-slate-300';
    }

    if (ind.polarity === 'lower_is_better') {
      // Ex: Turnover ou Perdas (menor é melhor)
      if (val <= ind.meta5) return 'bg-[#e9d5ff] text-[#581c87] font-black border border-purple-300'; // Superação Meta 5
      if (val <= ind.meta3) return 'bg-[#bbf7d0] text-[#14532d] font-bold border border-emerald-300'; // Atingiu Meta 3
      if (val <= ind.meta1) return 'bg-[#fef08a] text-[#713f12] font-semibold border border-amber-300'; // Próximo Meta 1
      return 'bg-[#e11d48] text-white font-bold border border-rose-600'; // GAP crítico
    } else {
      // Maior é melhor
      if (val >= ind.meta5) return 'bg-[#e9d5ff] text-[#581c87] font-black border border-purple-300'; // Superação Meta 5 (Roxo da planilha)
      if (val >= ind.meta3) return 'bg-[#86efac] text-[#064e3b] font-bold border border-emerald-300'; // Superou Meta 3 (Verde)
      if (val >= ind.meta1) return 'bg-[#fef08a] text-[#713f12] font-semibold border border-amber-300'; // Atingiu Meta 1 (Amarelo)
      return 'bg-[#e11d48] text-white font-bold border border-rose-600'; // GAP Crítico abaixo da Meta 1 (Vermelho da planilha)
    }
  };

  const getAuditCellColorClass = (val: string | number | null, metaNumeric: number): string => {
    if (val === null || val === undefined || val === '') return 'bg-slate-50 text-slate-300';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (isNaN(num)) return 'bg-slate-100 text-slate-600';
    if (num >= metaNumeric) return 'bg-[#86efac] text-[#064e3b] font-bold border border-emerald-300';
    if (num >= metaNumeric * 0.95) return 'bg-[#fef08a] text-[#713f12] font-semibold border border-amber-300';
    return 'bg-[#fca5a5] text-[#7f1d1d] font-bold border border-rose-300';
  };

  // Salvar nota individual
  const handleSaveIndividualNote = (indId: string, note: string) => {
    const updated = indicators.map(i => i.id === indId ? { ...i, notes: note } : i);
    onSaveYearData(year, updated, audits);
    setEditingNoteId(null);
  };

  // Gerar diagnóstico individual no card
  const handleGenerateIndividualDiag = (indId: string) => {
    const ind = indicators.find(i => i.id === indId);
    if (!ind) return;
    const diag = generateAutoDiagnosis(ind, year);
    handleSaveIndividualNote(indId, diag);
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO DO PROGRAMA SUPERAR COM SELETOR DE ANO E BOTÃO DE EDIÇÃO */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0a3641] to-[#134e5e] rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#306576]">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6ffbbe]/20 text-[#6ffbbe] text-xs font-bold uppercase tracking-wider border border-[#6ffbbe]/30">
              <Award className="w-3.5 h-3.5" />
              Pilar Educação & Treinamento (ET) • Selo Bronze
            </span>

            {/* SELETOR DE ANO: 2026 vs 2027 */}
            <div className="inline-flex items-center rounded-xl bg-black/25 p-0.5 border border-white/20">
              <button
                onClick={() => onYearChange(2026)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  year === 2026
                    ? 'bg-[#6ffbbe] text-[#002028] shadow-xs'
                    : 'text-[#c1e9f7] hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Ciclo 2026 (Oficial)
              </button>
              <button
                onClick={() => onYearChange(2027)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  year === 2027
                    ? 'bg-[#6ffbbe] text-[#002028] shadow-xs'
                    : 'text-[#c1e9f7] hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Ciclo 2027 (Planejamento)
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Programa Superar — Klabin Bahia (KBA1) • Ciclo {year}
          </h2>
          <p className="text-xs text-[#c1e9f7] max-w-2xl mt-1 leading-relaxed">
            {year === 2026 
              ? 'Acompanhamento oficial de metas realizadas (Jan a Set), auditorias do selo e alavancas estratégicas.'
              : 'Estrutura de metas planejadas e baseline para o próximo ciclo de certificação da fábrica.'}
          </p>
        </div>

        {/* Botão de Edição em Grade / Janela */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6ffbbe] text-[#002028] font-black text-xs hover:bg-[#4edea3] transition-all shadow-md"
          >
            <Table className="w-4 h-4" />
            Editar em Tabela / Grade
          </button>
          {onOpenDataEntry && (
            <button
              onClick={onOpenDataEntry}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Lançamento Rápido
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CARDS DEMOGRÁFICOS DE AUDITORIA & PREMISSAS SELO BRONZE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Auto Avaliação */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Auto Avaliação Selo
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#0b1c30]">
                {typeof audits[4]?.media === 'number' ? `${audits[4].media}%` : audits[4]?.media || '96,0%'}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Meta {audits[4]?.meta || '92%'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {year === 2026 ? 'Jan, Fev e Mar em superação' : 'Planejado para 2027'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Auditoria de Selo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Auditoria de Selo
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#0a3641]">
                {typeof audits[1]?.media === 'number' ? `${audits[1].media}%` : audits[1]?.media || '95,8%'}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Meta {audits[1]?.meta || '92%'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {year === 2026 ? 'Selo Bronze Aprovado (+3.8%)' : 'Rumo ao Selo Prata'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0a3641] text-[#6ffbbe] flex items-center justify-center shadow-xs">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Confirmação de Processo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Confirmação de Processo
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#0b1c30]">
                {typeof audits[3]?.media === 'number' ? audits[3].media : audits[3]?.media || '4,6'}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Meta {audits[3]?.meta || '5,0'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {year === 2026 ? 'Evolução: 3.8 Jan → 4.6 Mar' : 'Foco em 5.0 pontos'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Auditoria de Passo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Auditoria de Passo
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#0b1c30]">
                {typeof audits[0]?.media === 'number' ? `${audits[0].media}%` : audits[0]?.media || '91,0%'}
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Meta {audits[0]?.meta || '92%'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {year === 2026 ? 'Plano de ação em andamento' : 'Meta alinhada para 94%'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. PREMISSAS OBRIGATÓRIAS DO SELO BRONZE (CHECKLIST) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0b1c30] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Critérios & Premissas Obrigatórias para Concessão do Selo Bronze (Pilar ET) • Ciclo {year}
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            4 de 4 Premissas Atendidas (100%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {SELO_PREMISES_INITIAL.map(p => (
            <div key={p.id} className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col justify-between space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 font-medium leading-snug">
                  {p.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-emerald-200/50">
                <span className="text-slate-500 font-medium">Exigido: <strong>{p.target}</strong></span>
                <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  Realizado: {p.currentValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABELA 1: AUDITORIAS DO PROGRAMA SUPERAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0b1c30]">Auditorias & Avaliações Superar ({year})</h3>
            <p className="text-xs text-slate-500">Métricas de conformidade de processos, passos e maturidade do pilar</p>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs font-bold text-[#306576] hover:underline flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Editar Auditorias
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3 min-w-[200px]">Auditoria / Avaliação</th>
                <th className="py-2.5 px-2 text-center bg-slate-200/60 font-bold">Meta</th>
                {MONTHS_LIST.map(m => (
                  <th key={m} className="py-2.5 px-2 text-center min-w-[44px]">{m}</th>
                ))}
                <th className="py-2.5 px-3 text-center bg-slate-100 font-bold min-w-[65px]">MÉDIA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {audits.map(aud => (
                <tr key={aud.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[#0b1c30]">
                    {aud.name}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold bg-slate-100 text-slate-800">
                    {aud.meta}
                  </td>
                  {MONTHS_LIST.map(m => {
                    const val = aud.months[m];
                    const colorClass = getAuditCellColorClass(val, aud.metaNumeric);
                    return (
                      <td key={m} className={`py-2 px-1 text-center font-mono text-[11px] ${colorClass}`}>
                        {val !== null && val !== undefined ? (typeof val === 'number' ? (aud.unit === '%' ? `${val}%` : val) : val) : '—'}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-center font-black bg-slate-50 text-slate-900 font-mono">
                    {typeof aud.media === 'number' ? (aud.unit === '%' ? `${aud.media}%` : aud.media) : (aud.media || '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TABELA 2: PAINEL OFICIAL DE INDICADORES MENSAIS SUPERAR (GRADE COMPLETA) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0b1c30]">
                Painel Oficial de Indicadores Mensais — Pilar Educação & Treinamento ({year})
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0a3641] text-[#6ffbbe]">
                Oficial Superar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grade anual com Meta 1 (Amarelo), Meta 3 (Cinza/Verde) e Meta 5 (Roxo), comparada ao realizado mês a mês
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro por Alavanca */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Alavanca:</span>
              <select
                value={selectedAlavanca}
                onChange={(e) => setSelectedAlavanca(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-[#f8f9ff] text-slate-700 focus:outline-none"
              >
                <option value="all">Todas as Alavancas</option>
                <option value="moral">Moral (6)</option>
                <option value="segurança">Segurança (2)</option>
                <option value="custo">Custo (1)</option>
              </select>
            </div>

            {/* Botão de Edição Rápida da Tabela */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0a3641] hover:bg-[#134e5e] text-[#6ffbbe] text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Table className="w-3.5 h-3.5" />
              Editar Grade
            </button>
          </div>
        </div>

        {/* Legenda de Formatação Condicional Idêntica à Planilha */}
        <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 flex items-center gap-4 text-[11px] flex-wrap">
          <span className="font-bold text-slate-600">Legenda de Realização:</span>
          <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded bg-[#e9d5ff] text-[#581c87] border border-purple-300">
            <span className="w-2 h-2 rounded-full bg-[#9333ea]" /> Superou Meta 5 (Máxima)
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded bg-[#86efac] text-[#064e3b] border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Atingiu Meta 3 (Planejado)
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded bg-[#fef08a] text-[#713f12] border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-[#ca8a04]" /> Atingiu Meta 1 (Atenção)
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded bg-[#e11d48] text-white">
            <span className="w-2 h-2 rounded-full bg-white" /> Abaixo de Meta 1 (GAP Crítico)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Linha de Cabeçalho Superior */}
              <tr className="bg-[#132F46] text-white text-[11px] font-bold">
                <th className="py-2.5 px-3 min-w-[240px]">Indicador</th>
                <th className="py-2.5 px-2 text-center bg-[#fde047] text-[#713f12] font-black min-w-[50px]">Meta 1</th>
                <th className="py-2.5 px-2 text-center bg-[#cbd5e1] text-[#0f172a] font-black min-w-[50px]">Meta 3</th>
                <th className="py-2.5 px-2 text-center bg-[#d8b4fe] text-[#581c87] font-black min-w-[50px]">Meta 5</th>
                {MONTHS_LIST.map(m => (
                  <th key={m} className="py-2.5 px-2 text-center min-w-[42px]">{m}</th>
                ))}
                <th className="py-2.5 px-3 text-center bg-[#0a3641] text-[#6ffbbe] font-black min-w-[60px]">MÉDIA</th>
                <th className="py-2.5 px-2 text-center bg-[#001f27] text-white font-bold min-w-[55px]">ACUM.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIndicators.map(ind => (
                <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Nome do Indicador & Link Alavanca */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-[#0b1c30] block leading-tight">
                        {ind.name}
                      </span>
                      {ind.notes && (
                        <button
                          onClick={() => setExpandedNotesId(expandedNotesId === ind.id ? null : ind.id)}
                          title="Ver Diagnóstico Técnico"
                          className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      Alavanca {ind.alavanca} • Peso: {ind.peso}%
                    </span>
                  </td>

                  {/* Metas */}
                  <td className="py-2 px-1 text-center font-mono font-bold bg-[#fef9c3] text-[#713f12]">
                    {ind.meta1}
                  </td>
                  <td className="py-2 px-1 text-center font-mono font-bold bg-[#f1f5f9] text-[#1e293b]">
                    {ind.meta3}
                  </td>
                  <td className="py-2 px-1 text-center font-mono font-bold bg-[#f3e8ff] text-[#581c87]">
                    {ind.meta5}
                  </td>

                  {/* Meses Realizados com Cores Idênticas à Planilha */}
                  {MONTHS_LIST.map(m => {
                    const val = ind.months[m];
                    const cellColor = getCellColorClass(ind, val);
                    return (
                      <td key={m} className={`py-2 px-1 text-center font-mono text-[11px] ${cellColor}`}>
                        {val !== null && val !== undefined ? val : '—'}
                      </td>
                    );
                  })}

                  {/* Média */}
                  <td className="py-2 px-2 text-center font-mono font-black text-sm bg-slate-50 text-[#0b1c30]">
                    {ind.media}
                  </td>

                  {/* Acumulado */}
                  <td className="py-2 px-2 text-center font-mono text-xs text-slate-500">
                    {ind.acumulado || 'N/A'}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. TABELA 3: ALAVANCAS SUPERAR & CRITÉRIOS DE PONTUAÇÃO DO SELO BRONZE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0b1c30]">
              Matriz de Alavancas Superar & Pontuação do Selo Bronze (Pilar ET) • Ciclo {year}
            </h3>
            <p className="text-xs text-slate-500">
              Classificação por alavanca de resultado, grau de maturidade e comparação com realizado histórico 2025
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Nível: Selo Bronze
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Indicador</th>
                <th className="py-3 px-3 text-center">Alavanca</th>
                <th className="py-3 px-2 text-center">Pilar</th>
                <th className="py-3 px-2 text-center">Peso</th>
                <th className="py-3 px-2 text-center">Total 2025</th>
                <th className="py-3 px-2 text-center bg-amber-50/60 font-bold">Mínimo Aceitável</th>
                <th className="py-3 px-2 text-center bg-slate-100 font-bold">Meta (Grau)</th>
                <th className="py-3 px-2 text-center bg-purple-50 font-bold">Superação</th>
                <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-900 font-black">Média ({year})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {indicators.map(ind => (
                <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#0b1c30]">
                    {ind.name}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ind.alavanca === 'Moral'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : ind.alavanca === 'Segurança'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {ind.alavanca}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-600">
                    {ind.pilar}
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-800">
                    {ind.peso}%
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-500">
                    {ind.seloBronzeCriteria?.total2025 !== undefined ? `${ind.seloBronzeCriteria.total2025}${ind.unit === '%' ? '%' : ''}` : '—'}
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-bold bg-amber-50/40 text-amber-900">
                    {ind.seloBronzeCriteria?.minimoAceitavel !== undefined ? `${ind.seloBronzeCriteria.minimoAceitavel}${ind.unit === '%' ? '%' : ''}` : '—'}
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-bold bg-slate-50 text-slate-800">
                    {ind.seloBronzeCriteria?.metaGrau !== undefined ? `${ind.seloBronzeCriteria.metaGrau}${ind.unit === '%' ? '%' : ''}` : '—'}
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-bold bg-purple-50/40 text-purple-900">
                    {ind.seloBronzeCriteria?.superacao !== undefined ? `${ind.seloBronzeCriteria.superacao}${ind.unit === '%' ? '%' : ''}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-sm bg-emerald-50/60 text-emerald-900">
                    {ind.media}{ind.unit === '%' ? '%' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. DIAGNÓSTICOS TÉCNICOS & MEMORIAIS QUALITATIVOS (NOTAS DO PILAR ET) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#306576]" />
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">
                Diagnósticos Qualitativos & Pareceres Técnicos dos Educadores ({year})
              </h3>
              <p className="text-xs text-slate-500">
                Análises de causa raiz, status operacional e planos de ação para cada um dos indicadores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const updated = indicators.map(i => ({
                  ...i,
                  notes: generateAutoDiagnosis(i, year)
                }));
                onSaveYearData(year, updated, audits);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Atualizar Diagnósticos com IA
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indicators.map(item => (
            <div key={item.id} className="p-4 rounded-xl border border-slate-200/80 bg-[#f8f9ff] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0b1c30] leading-tight">{item.name}</span>
                <span className="text-[10px] font-bold text-[#306576] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 shrink-0">
                  {item.alavanca}
                </span>
              </div>

              {editingNoteId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-indigo-300 text-xs text-slate-800 bg-white focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 rounded border border-slate-200 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveIndividualNote(item.id, editingNoteText)}
                      className="px-3 py-1 text-xs font-bold text-white bg-[#0a3641] rounded hover:bg-[#134e5e]"
                    >
                      Salvar Nota
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-100">
                  "{item.notes || 'Sem diagnóstico cadastrado para este indicador.'}"
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <span className="text-slate-400 font-medium">Média {year}: <strong>{item.media}{item.unit === '%' ? '%' : ''}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingNoteId(item.id);
                      setEditingNoteText(item.notes || '');
                    }}
                    className="text-[#306576] hover:underline font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleGenerateIndividualDiag(item.id)}
                    className="text-purple-700 hover:underline font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Gerar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO EM TABELA / GRADE COMPLETA */}
      <SuperarTableEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        year={year}
        indicators={indicators}
        audits={audits}
        onSave={(updatedIndicators, updatedAudits) => {
          onSaveYearData(year, updatedIndicators, updatedAudits);
        }}
      />

    </div>
  );
};
