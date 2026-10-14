import React, { useState } from 'react';
import { X, Building2, Calendar, MapPin, Phone, Award } from 'lucide-react';
import { UnitInfo } from '../types/schedule';

interface UnitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitInfo: UnitInfo;
  onSaveUnitInfo: (info: UnitInfo) => void;
}

export const UnitSettingsModal: React.FC<UnitSettingsModalProps> = ({
  isOpen,
  onClose,
  unitInfo,
  onSaveUnitInfo,
}) => {
  const [formData, setFormData] = useState<UnitInfo>({ ...unitInfo });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUnitInfo(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">Configurações da Unidade e Divulgação</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" /> Nome da Unidade / Localização
            </label>
            <input
              type="text"
              value={formData.unitName}
              onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
              placeholder="Ex: Unidade Fabril & Logística, CD São Paulo"
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-500" /> Nome do Programa / Turma
            </label>
            <input
              type="text"
              value={formData.cohortName}
              onChange={(e) => setFormData({ ...formData, cohortName: e.target.value })}
              placeholder="Ex: Programa de Integração de Novos Colaboradores"
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Período / Edição
            </label>
            <input
              type="text"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              placeholder="Ex: Edição Outubro/2026 - Dias 1, 2 e 3"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" /> Local Padrão de Encontro
            </label>
            <input
              type="text"
              value={formData.locationDefault}
              onChange={(e) => setFormData({ ...formData, locationDefault: e.target.value })}
              placeholder="Ex: Sala de Integração Principal - Bloco Administrativo"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" /> Contato de Apoio / Gente & Gestão
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="Ex: RH: (11) 98765-4321 • ramal 4421"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Salvar Dados
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
