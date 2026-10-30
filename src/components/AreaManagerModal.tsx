import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Palette, RotateCcw, Edit2, Check, AlertCircle } from 'lucide-react';
import { AreaDefinition, IntegrationSession } from '../types/schedule';
import { INITIAL_AREAS } from '../data/initialSchedule';

interface AreaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaDefinition[];
  sessions?: IntegrationSession[];
  onSaveAreas: (newAreas: AreaDefinition[], renameMap?: Record<string, string>) => void;
}

export const AreaManagerModal: React.FC<AreaManagerModalProps> = ({
  isOpen,
  onClose,
  areas,
  sessions = [],
  onSaveAreas,
}) => {
  const [currentAreas, setCurrentAreas] = useState<AreaDefinition[]>(areas);
  const [newAreaName, setNewAreaName] = useState('');
  const [newBgColor, setNewBgColor] = useState('#6b21a8');
  const [newTextColor, setNewTextColor] = useState('#ffffff');

  // Tracking renamed areas to bulk-update sessions: { [originalName]: newName }
  const [renameMap, setRenameMap] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempEditingName, setTempEditingName] = useState('');

  useEffect(() => {
    setCurrentAreas(areas);
    setRenameMap({});
    setEditingId(null);
  }, [areas, isOpen]);

  if (!isOpen) return null;

  const handleAddArea = () => {
    const cleanName = newAreaName.trim().toUpperCase();
    if (!cleanName) return;
    const newId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-') + `-${Date.now()}`;
    const updated = [
      ...currentAreas,
      {
        id: newId,
        name: cleanName,
        bgColor: newBgColor,
        textColor: newTextColor,
      },
    ];
    setCurrentAreas(updated);
    setNewAreaName('');
  };

  const handleStartEditName = (area: AreaDefinition) => {
    setEditingId(area.id);
    setTempEditingName(area.name);
  };

  const handleSaveEditName = (areaId: string) => {
    const clean = tempEditingName.trim().toUpperCase();
    if (!clean) return;

    const original = currentAreas.find((a) => a.id === areaId);
    if (!original) return;

    if (original.name !== clean) {
      setRenameMap((prev) => ({
        ...prev,
        [original.name]: clean,
      }));
    }

    setCurrentAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, name: clean } : a))
    );
    setEditingId(null);
  };

  const handleUpdateColor = (id: string, bgColor: string, textColor: string) => {
    setCurrentAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, bgColor, textColor } : a))
    );
  };

  const handleDeleteArea = (id: string) => {
    const toDelete = currentAreas.find((a) => a.id === id);
    if (!toDelete) return;

    const linkedCount = sessions.filter(
      (s) => (s.area || '').trim().toUpperCase() === toDelete.name.trim().toUpperCase()
    ).length;

    if (linkedCount > 0) {
      const confirmMsg = `A área "${toDelete.name}" está sendo usada em ${linkedCount} atividade(s). Deseja excluí-la? As atividades serão movidas para "OUTROS".`;
      if (!confirm(confirmMsg)) return;
    }

    setCurrentAreas((prev) => prev.filter((a) => a.id !== id));
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar todas as categorias para o padrão original da planilha da unidade?')) {
      setCurrentAreas(INITIAL_AREAS);
      setRenameMap({});
    }
  };

  const handleSave = () => {
    onSaveAreas(currentAreas, renameMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold">Cadastro e Gerenciador de Áreas</h2>
              <p className="text-[11px] text-slate-400">
                Altere nomes e cores para atualizar todas as atividades vinculadas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add New Area */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" /> Cadastrar Nova Área
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Nome da área (ex: LOGÍSTICA, SST)"
                className="flex-1 min-w-[150px] bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cor:</label>
                <input
                  type="color"
                  value={newBgColor}
                  onChange={(e) => setNewBgColor(e.target.value)}
                  className="w-7 h-7 rounded-md cursor-pointer border border-slate-300 p-0.5"
                  title="Cor de Fundo"
                />
              </div>

              <button
                type="button"
                onClick={() => setNewTextColor((t) => (t === '#ffffff' ? '#000000' : '#ffffff'))}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Texto: {newTextColor === '#ffffff' ? 'Branco' : 'Preto'}
              </button>

              <button
                type="button"
                onClick={handleAddArea}
                disabled={!newAreaName.trim()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Area List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Áreas Cadastradas ({currentAreas.length})
              </h4>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {currentAreas.map((area) => {
                const count = sessions.filter(
                  (s) => (s.area || '').trim().toUpperCase() === area.name.trim().toUpperCase()
                ).length;

                return (
                  <div
                    key={area.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors gap-3"
                  >
                    {/* Badge / Editable Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {editingId === area.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={tempEditingName}
                            onChange={(e) => setTempEditingName(e.target.value.toUpperCase())}
                            className="px-2 py-1 text-xs border border-indigo-400 rounded-lg font-bold uppercase w-full max-w-[200px]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditName(area.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditName(area.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Salvar Nome"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="px-2.5 py-1 rounded-md text-xs font-bold uppercase shadow-2xs border border-black/10 truncate"
                            style={{ backgroundColor: area.bgColor, color: area.textColor }}
                          >
                            {area.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditName(area)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                            title="Renomear Categoria"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                            ({count} {count === 1 ? 'linha' : 'linhas'})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Color and Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={area.bgColor}
                          onChange={(e) =>
                            handleUpdateColor(area.id, e.target.value, area.textColor)
                          }
                          className="w-7 h-7 rounded cursor-pointer border border-slate-300 p-0.5"
                          title="Alterar Cor de Fundo"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateColor(
                            area.id,
                            area.bgColor,
                            area.textColor === '#ffffff' ? '#000000' : '#ffffff'
                          )
                        }
                        className="text-[10px] font-semibold px-2 py-1 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                      >
                        {area.textColor === '#ffffff' ? 'Texto Claro' : 'Texto Escuro'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArea(area.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Área"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>As mudanças refletirão em toda a tabela ao salvar.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              Salvar Categorias & Cores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
