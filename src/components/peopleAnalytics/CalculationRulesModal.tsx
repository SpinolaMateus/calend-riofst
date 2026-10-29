import React, { useState } from 'react';
import { Sliders, X, Check } from 'lucide-react';

interface CalculationRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (rules: any) => void;
}

export const CalculationRulesModal: React.FC<CalculationRulesModalProps> = ({ isOpen, onClose, onSave }) => {
  const [targetAbs, setTargetAbs] = useState('2.5');
  const [bradfordTrigger, setBradfordTrigger] = useState('150');
  const [includeShortMedical, setIncludeShortMedical] = useState(true);
  const [includeUnjustified, setIncludeUnjustified] = useState(true);
  const [includeDelays, setIncludeDelays] = useState(true);
  const [includeMaternity, setIncludeMaternity] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        targetAbs: parseFloat(targetAbs),
        bradfordTrigger: parseInt(bradfordTrigger, 10),
        includeShortMedical,
        includeUnjustified,
        includeDelays,
        includeMaternity,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0a3641]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#306576]/10 text-[#306576] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0b1c30]">Configurar Regras de Apuração</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Defina os parâmetros de ponderação que regem o cálculo de absenteísmo para a planta KBA1. Alterações exigem alinhamento entre Gerência de RH e Operações Industriais.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
              Meta Limite Contratual de Absenteísmo (%)
            </label>
            <input 
              type="number" 
              step="0.1" 
              value={targetAbs} 
              onChange={(e) => setTargetAbs(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#eff4ff] text-sm text-[#0b1c30] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#306576]"
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-semibold text-[#0b1c30]">
              Eventos Computados na Taxa de Absenteísmo:
            </label>
            
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeShortMedical}
                onChange={(e) => setIncludeShortMedical(e.target.checked)}
                className="rounded border-slate-300 text-[#0a3641] focus:ring-[#306576] w-4 h-4"
              />
              <span>Atestados de Doença Comum (&lt; 15 dias)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeUnjustified}
                onChange={(e) => setIncludeUnjustified(e.target.checked)}
                className="rounded border-slate-300 text-[#0a3641] focus:ring-[#306576] w-4 h-4"
              />
              <span>Faltas Injustificadas e Suspensões Disciplinares</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeDelays}
                onChange={(e) => setIncludeDelays(e.target.checked)}
                className="rounded border-slate-300 text-[#0a3641] focus:ring-[#306576] w-4 h-4"
              />
              <span>Atrasos acima de 15 minutos e Saídas Antecipadas</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeMaternity}
                onChange={(e) => setIncludeMaternity(e.target.checked)}
                className="rounded border-slate-300 text-[#0a3641] focus:ring-[#306576] w-4 h-4"
              />
              <span className="text-slate-500">Licença Maternidade / Paternidade (Desmarcado por padrão CLT)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
              Gatilho de Alerta Bradford por Colaborador
            </label>
            <select 
              value={bradfordTrigger}
              onChange={(e) => setBradfordTrigger(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#eff4ff] text-sm text-[#0b1c30] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#306576]"
            >
              <option value="100">100 pontos (Atenção Inicial)</option>
              <option value="150">150 pontos (Padrão KBA1 - Entrevista de Retorno)</option>
              <option value="250">250 pontos (Crítico - Ação Disciplinar / SESMT)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0a3641] hover:bg-[#306576] text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              Salvar Parâmetros
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

