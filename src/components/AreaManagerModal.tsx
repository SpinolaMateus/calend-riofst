import React, { useState } from 'react';
import { X, Plus, Trash2, Palette, RotateCcw } from 'lucide-react';
import { AreaDefinition } from '../types/schedule';
import { INITIAL_AREAS } from '../data/initialSchedule';

interface AreaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaDefinition[];
  onSaveAreas: (newAreas: AreaDefinition[]) => void;
}

export const AreaManagerModal: React.FC<AreaManagerModalProps> = ({
  isOpen,
  onClose,
  areas,
  onSaveAreas,
}) => {
  const [currentAreas, setCurrentAreas] = useState<AreaDefinition[]>(areas);
  const [newAreaName, setNewAreaName] = useState('');
  const [newBgColor, setNewBgColor] = useState('#7c3aed');
  const [newTextColor, setNewTextColor] = useState('#ffffff');

  if (!isOpen) return null;

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    const newId = newAreaName.toLowerCase().replace(/\s+/g, '-');
    const updated = [
      ...currentAreas,
      {
        id: `${newId}-${Date.now()}`,
        name: newAreaName.trim().toUpperCase(),
        bgColor: newBgColor,
        textColor: newTextColor,
      },
    ];
    setCurrentAreas(updated);
    setNewAreaName('');
  };

  const handleUpdateColor = (id: string, bgColor: string, textColor: string) => {
    setCurrentAreas(
      currentAreas.map((a) => (a.id === id ? { ...a, bgColor, textColor } : a))
    );
  };

  const handleDeleteArea = (id: string) => {
    setCurrentAreas(currentAreas.filter((a) => a.id !== id));
  };

  const handleResetDefaults = () => {
    setCurrentAreas(INITIAL_AREAS);
  };

  const handleSave = () => {
    onSaveAreas(currentAreas);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">Gerenciar Áreas e Cores das Faixas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Add New Area */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Adicionar Nova Área
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Nome da área (ex: LOGÍSTICA)"
                className="flex-1 min-w-[150px] bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-slate-500">Cor:</label>
                <input
                  type="color"
                  value={newBgColor}
                  onChange={(e) => setNewBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  title="Cor de Fundo"
                />
              </div>
              <button
                type="button"
                onClick={handleAddArea}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Area List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Áreas Atuais ({currentAreas.length})
              </h4>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões da Planilha
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {currentAreas.map((area) => (
                <div
                  key={area.id}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2.5 py-1 rounded text-xs font-bold uppercase shadow-2xs"
                      style={{ backgroundColor: area.bgColor, color: area.textColor }}
                    >
                      {area.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">Mudar cor:</span>
                      <input
                        type="color"
                        value={area.bgColor}
                        onChange={(e) =>
                          handleUpdateColor(area.id, e.target.value, area.textColor)
                        }
                        className="w-7 h-7 rounded cursor-pointer border border-slate-300 p-0.5"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateColor(
                          area.id,
                          area.bgColor,
                          area.textColor === '#ffffff' ? '#1e293b' : '#ffffff'
                        )
                      }
                      className="text-[11px] px-2 py-0.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-100"
                    >
                      {area.textColor === '#ffffff' ? 'Texto Branco' : 'Texto Escuro'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteArea(area.id)}
                      className="p-1 text-slate-400 hover:text-red-500"
                      title="Excluir Área"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
          >
            Salvar Paleta
          </button>
        </div>
      </div>
    </div>
  );
};
