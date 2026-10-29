import React, { useState } from 'react';
import { 
  X, Save, Sparkles, Plus, Trash2, Check, AlertCircle, 
  HelpCircle, Calendar, RefreshCw, Award, Table
} from 'lucide-react';
import { 
  SuperarMonthlyIndicator, SuperarAudit, 
  calculateIndicatorMedia, generateAutoDiagnosis 
} from '../../data/superarInitialData';

interface SuperarTableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  indicators: SuperarMonthlyIndicator[];
  audits: SuperarAudit[];
  onSave: (updatedIndicators: SuperarMonthlyIndicator[], updatedAudits: SuperarAudit[]) => void;
}

const MONTHS_LIST = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export const SuperarTableEditModal: React.FC<SuperarTableEditModalProps> = ({
  isOpen,
  onClose,
  year,
  indicators,
  audits,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'indicators' | 'audits'>('indicators');
  const [editableIndicators, setEditableIndicators] = useState<SuperarMonthlyIndicator[]>(() => 
    JSON.parse(JSON.stringify(indicators))
  );
  const [editableAudits, setEditableAudits] = useState<SuperarAudit[]>(() => 
    JSON.parse(JSON.stringify(audits))
  );
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Sincroniza quando abrir
  React.useEffect(() => {
    if (isOpen) {
      setEditableIndicators(JSON.parse(JSON.stringify(indicators)));
      setEditableAudits(JSON.parse(JSON.stringify(audits)));
    }
  }, [isOpen, indicators, audits]);

  if (!isOpen) return null;

  // Atualização de célula de mês de indicador
  const handleMonthChange = (indId: string, month: string, rawVal: string) => {
    setEditableIndicators(prev => prev.map(ind => {
      if (ind.id === indId) {
        const val = rawVal.trim() === '' ? null : parseFloat(rawVal.replace(',', '.'));
        const newMonths = { ...ind.months, [month]: isNaN(val as number) ? null : val };
        const newMedia = calculateIndicatorMedia(newMonths);
        return {
          ...ind,
          months: newMonths,
          media: newMedia,
        };
      }
      return ind;
    }));
  };

  // Atualização de meta
  const handleMetaChange = (indId: string, metaKey: 'meta1' | 'meta3' | 'meta5', rawVal: string) => {
    const val = parseFloat(rawVal.replace(',', '.'));
    if (isNaN(val)) return;
    setEditableIndicators(prev => prev.map(ind => {
      if (ind.id === indId) {
        return { ...ind, [metaKey]: val };
      }
      return ind;
    }));
  };

  // Atualização de diagnóstico / observação
  const handleNoteChange = (indId: string, text: string) => {
    setEditableIndicators(prev => prev.map(ind => {
      if (ind.id === indId) {
        return { ...ind, notes: text };
      }
      return ind;
    }));
  };

  // Geração de diagnóstico automático para um indicador
  const handleGenerateDiagnosis = (indId: string) => {
    const ind = editableIndicators.find(i => i.id === indId);
    if (!ind) return;
    const diag = generateAutoDiagnosis(ind, year);
    handleNoteChange(indId, diag);
    setExpandedNoteId(indId);
  };

  // Gerar diagnóstico para todos os indicadores de uma vez
  const handleGenerateAllDiagnoses = () => {
    setEditableIndicators(prev => prev.map(ind => ({
      ...ind,
      notes: generateAutoDiagnosis(ind, year)
    })));
  };

  // Atualização de auditoria
  const handleAuditMonthChange = (audId: string, month: string, rawVal: string) => {
    setEditableAudits(prev => prev.map(aud => {
      if (aud.id === audId) {
        const val = rawVal.trim() === '' ? null : parseFloat(rawVal.replace(',', '.'));
        const newMonths = { ...aud.months, [month]: isNaN(val as number) ? null : val };
        const filled = Object.values(newMonths).filter(v => v !== null && v !== undefined && typeof v === 'number') as number[];
        const newMedia = filled.length > 0 ? Number((filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1)) : 'Em ciclo';
        return {
          ...aud,
          months: newMonths,
          media: newMedia,
        };
      }
      return aud;
    }));
  };

  const handleAuditMetaChange = (audId: string, rawVal: string) => {
    setEditableAudits(prev => prev.map(aud => {
      if (aud.id === audId) {
        const num = parseFloat(rawVal.replace(',', '.').replace('%', ''));
        return {
          ...aud,
          meta: rawVal,
          metaNumeric: isNaN(num) ? aud.metaNumeric : num
        };
      }
      return aud;
    }));
  };

  const handleSaveAll = () => {
    onSave(editableIndicators, editableAudits);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#0a3641] to-[#134e5e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6ffbbe]/20 border border-[#6ffbbe]/30 flex items-center justify-center text-[#6ffbbe]">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Edição em Grade — Programa Superar (Ciclo {year})
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#6ffbbe] text-[#002028]">
                  Ano {year}
                </span>
              </div>
              <p className="text-xs text-[#c1e9f7]">
                Edite metas, meses (Jan a Dez) e gere diagnósticos operacionais em formato de planilha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAllDiagnoses}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#6ffbbe] border border-[#6ffbbe]/30 text-xs font-bold transition-colors"
              title="Gera diagnóstico automatizado para todos os indicadores"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Diagnóstico Geral
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Sub-Abas do Modal */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('indicators')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'indicators'
                  ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Indicadores do Pilar ET ({editableIndicators.length})
            </button>
            <button
              onClick={() => setActiveTab('audits')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'audits'
                  ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Auditorias Superar ({editableAudits.length})
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden md:block">
            Dica: Valores são calculados instantaneamente ao digitar.
          </div>
        </div>

        {/* Corpo com a Tabela Editável */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100/50">
          {activeTab === 'indicators' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#132F46] text-white text-[11px] font-bold sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 min-w-[220px]">Indicador</th>
                        <th className="py-2.5 px-1.5 text-center bg-[#fde047] text-[#713f12] min-w-[55px]">M1</th>
                        <th className="py-2.5 px-1.5 text-center bg-[#cbd5e1] text-[#0f172a] min-w-[55px]">M3</th>
                        <th className="py-2.5 px-1.5 text-center bg-[#d8b4fe] text-[#581c87] min-w-[55px]">M5</th>
                        {MONTHS_LIST.map(m => (
                          <th key={m} className="py-2.5 px-1 text-center min-w-[48px]">{m}</th>
                        ))}
                        <th className="py-2.5 px-2 text-center bg-[#0a3641] text-[#6ffbbe] min-w-[60px]">MÉDIA</th>
                        <th className="py-2.5 px-3 min-w-[120px] text-center">Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {editableIndicators.map(ind => (
                        <React.Fragment key={ind.id}>
                          <tr className="hover:bg-slate-50 transition-colors">
                            
                            {/* Nome */}
                            <td className="py-2 px-3">
                              <span className="font-bold text-[#0b1c30] block leading-tight">{ind.name}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {ind.alavanca} • Peso: {ind.peso}%
                              </span>
                            </td>

                            {/* Metas M1, M3, M5 */}
                            <td className="p-1 text-center bg-[#fef9c3]/50">
                              <input
                                type="text"
                                value={ind.meta1}
                                onChange={(e) => handleMetaChange(ind.id, 'meta1', e.target.value)}
                                className="w-full text-center py-1 px-0.5 rounded bg-white border border-amber-300 font-mono font-bold text-[11px] text-[#713f12]"
                              />
                            </td>
                            <td className="p-1 text-center bg-[#f1f5f9]/50">
                              <input
                                type="text"
                                value={ind.meta3}
                                onChange={(e) => handleMetaChange(ind.id, 'meta3', e.target.value)}
                                className="w-full text-center py-1 px-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-[11px] text-[#1e293b]"
                              />
                            </td>
                            <td className="p-1 text-center bg-[#f3e8ff]/50">
                              <input
                                type="text"
                                value={ind.meta5}
                                onChange={(e) => handleMetaChange(ind.id, 'meta5', e.target.value)}
                                className="w-full text-center py-1 px-0.5 rounded bg-white border border-purple-300 font-mono font-bold text-[11px] text-[#581c87]"
                              />
                            </td>

                            {/* 12 Meses */}
                            {MONTHS_LIST.map(m => {
                              const val = ind.months[m];
                              return (
                                <td key={m} className="p-1 text-center">
                                  <input
                                    type="text"
                                    placeholder="—"
                                    value={val !== null && val !== undefined ? String(val) : ''}
                                    onChange={(e) => handleMonthChange(ind.id, m, e.target.value)}
                                    className={`w-full text-center py-1 px-0.5 rounded border font-mono text-[11px] transition-all ${
                                      val !== null && val !== undefined
                                        ? 'bg-white font-bold border-slate-300 text-slate-900 focus:border-[#306576] focus:ring-1 focus:ring-[#306576]'
                                        : 'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}
                                  />
                                </td>
                              );
                            })}

                            {/* Média Calculada */}
                            <td className="py-2 px-2 text-center font-mono font-black text-xs bg-slate-50 text-[#0b1c30]">
                              {ind.media}
                            </td>

                            {/* Ação Diagnóstico */}
                            <td className="py-2 px-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setExpandedNoteId(expandedNoteId === ind.id ? null : ind.id)}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                                    ind.notes 
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {ind.notes ? 'Ver/Editar' : '+ Nota'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateDiagnosis(ind.id)}
                                  title="Gerar diagnóstico por IA com base nos números"
                                  className="p-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>

                          {/* Linha expansível para diagnóstico daquele indicador */}
                          {expandedNoteId === ind.id && (
                            <tr className="bg-indigo-50/40">
                              <td colSpan={17} className="p-3">
                                <div className="space-y-1.5 max-w-4xl">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                                      Diagnóstico & Parecer Operacional: {ind.name}
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleGenerateDiagnosis(ind.id)}
                                      className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1"
                                    >
                                      <Sparkles className="w-3 h-3" /> Gerar Diagnóstico Baseado nos Dados
                                    </button>
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={ind.notes || ''}
                                    onChange={(e) => handleNoteChange(ind.id, e.target.value)}
                                    placeholder="Digite a justificativa, análise de causa raiz ou plano de ação..."
                                    className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Aba de Auditorias */}
          {activeTab === 'audits' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#132F46] text-white text-[11px] font-bold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[220px]">Auditoria / Avaliação</th>
                      <th className="py-2.5 px-2 text-center bg-slate-200 text-slate-900 min-w-[70px]">Meta</th>
                      {MONTHS_LIST.map(m => (
                        <th key={m} className="py-2.5 px-1 text-center min-w-[48px]">{m}</th>
                      ))}
                      <th className="py-2.5 px-2 text-center bg-[#0a3641] text-[#6ffbbe] min-w-[70px]">MÉDIA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {editableAudits.map(aud => (
                      <tr key={aud.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-[#0b1c30]">
                          {aud.name}
                        </td>
                        <td className="p-1 text-center bg-slate-50">
                          <input
                            type="text"
                            value={aud.meta}
                            onChange={(e) => handleAuditMetaChange(aud.id, e.target.value)}
                            className="w-full text-center py-1 px-1 rounded bg-white border border-slate-300 font-mono font-bold text-[11px]"
                          />
                        </td>
                        {MONTHS_LIST.map(m => {
                          const val = aud.months[m];
                          return (
                            <td key={m} className="p-1 text-center">
                              <input
                                type="text"
                                placeholder="—"
                                value={val !== null && val !== undefined ? String(val) : ''}
                                onChange={(e) => handleAuditMonthChange(aud.id, m, e.target.value)}
                                className={`w-full text-center py-1 px-0.5 rounded border font-mono text-[11px] ${
                                  val !== null && val !== undefined
                                    ? 'bg-white font-bold border-slate-300 text-slate-900'
                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                              />
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center font-mono font-black text-xs bg-slate-50 text-[#0b1c30]">
                          {typeof aud.media === 'number' ? (aud.unit === '%' ? `${aud.media}%` : aud.media) : aud.media}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Ciclo em edição: <strong>{year}</strong> • As alterações serão salvas imediatamente no sistema.</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl text-xs font-black bg-[#0a3641] hover:bg-[#134e5e] text-[#6ffbbe] shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
