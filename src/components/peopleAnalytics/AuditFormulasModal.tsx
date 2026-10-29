import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface AuditFormulasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditFormulasModal: React.FC<AuditFormulasModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a3641]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-[#eff4ff] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#306576]/10 text-[#306576] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">Auditoria de Fórmulas e Regras de Negócio</h3>
              <span className="text-xs text-slate-500 font-medium">Manual Oficial de Métricas G&G • Norma KBA1-DHO-2024</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Item 1 */}
          <div className="p-3.5 bg-[#f8f9ff] border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#306576] uppercase tracking-wide">01 • Taxa de Absenteísmo Global (%)</span>
            <p className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Fórmula:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">(Total Horas de Ausência / Horas Homem Trabalhadas Teóricas) × 100</code>.<br/>
              Considera faltas injustificadas, atestados CID e suspensões. Não deduz DSR.
            </p>
          </div>

          {/* Item 2 */}
          <div className="p-3.5 bg-[#f8f9ff] border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#306576] uppercase tracking-wide">02 • Total de Horas de Ausência (Horas)</span>
            <p className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Fórmula:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">Σ Horas de Ausência Apuradas no Mês</code>.<br/>
              Soma aritmética de ausências registradas nos espelhos de ponto (atestados médicos, licenças curtas e faltas).
            </p>
          </div>

          {/* Item 3 */}
          <div className="p-3.5 bg-[#f8f9ff] border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#306576] uppercase tracking-wide">03 • Horas Extras s/ Folha Operacional (%)</span>
            <p className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Fórmula:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">(Total de H.E. 50% + 100% / Total de Horas Normais Trabalhadas) × 100</code>.<br/>
              Apurado diretamente via espelho de ponto eletrônico Totvs dos Turnos T1, T2 e T3.
            </p>
          </div>

          {/* Item 4 */}
          <div className="p-3.5 bg-[#f8f9ff] border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#306576] uppercase tracking-wide">04 • Índice de Turnover Global (%)</span>
            <p className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Fórmula:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">(((Admissões + Desligamentos) / 2) / Headcount Médio Ativo) × 100</code>.<br/>
              Base KBA1 de 353 colaboradores ativos elegíveis na competência.
            </p>
          </div>

          {/* Item 5 e 6 */}
          <div className="p-3.5 bg-[#f8f9ff] border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#306576] uppercase tracking-wide">05 & 06 • Admissões e Desligamentos (Headcount)</span>
            <p className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Métrica:</strong> Contagem direta de admissões efetivas e rescisões processadas pelo DHO no período.
            </p>
          </div>

          {/* Item 7 */}
          <div className="p-3.5 bg-[#f8f9ff] border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#306576] uppercase tracking-wide">07 • Média de Horas Treinamento / Colaborador</span>
            <p className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Fórmula:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">Total de Horas Treinadas no Mês / Efetivo Médio Ativo</code>.<br/>
              Contabiliza formações operacionais, LUPs e integração com lista de presença formalizada.
            </p>
          </div>

          {/* Item 8 */}
          <div className="p-3.5 bg-[#f8f9ff] border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#306576] uppercase tracking-wide">08 • Treinamentos Legais & NRs (% Cobertura)</span>
            <p className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Fórmula:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">(Colaboradores com NR Vigente / Colaboradores Elegíveis à NR) × 100</code>.<br/>
              Abrange NR-10, NR-11, NR-12, NR-33 e NR-35 auditadas pelo SESMT KBA1.
            </p>
          </div>

          {/* Item 9: Regra estrita */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">09 • Avaliação de Competências (Periodicidade Semestral)</span>
            <p className="text-xs text-amber-950 leading-relaxed">
              <strong>Regra Estrita de Governança:</strong> Métrica de ciclo semestral. Nas competências intermitentes exibe-se <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono font-bold text-[11px]">'-'</code> (Sem dados), sendo terminantemente vedada a imputação de 0% ou estimativas aleatórias.
            </p>
          </div>

          {/* Fator Bradford */}
          <div className="p-3.5 bg-[#f8f9ff] border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#306576] uppercase tracking-wide">Fator Bradford de Absenteísmo (B = S² × D)</span>
            <p className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Fórmula:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">B = S² × D</code>, onde <code className="font-mono">S</code> é o número de instâncias (episódios de ausência) e <code className="font-mono">D</code> é o total de dias ausentes. Identifica impactos de ausências curtas repetidas na linha fabril.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#eff4ff] border-t border-slate-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-[#0a3641] hover:bg-[#306576] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};

