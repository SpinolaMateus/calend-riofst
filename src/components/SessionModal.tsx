import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, User, Tag, FileText, Hash, Check, Trash2 } from 'lucide-react';
import { AreaDefinition, IntegrationSession } from '../types/schedule';
import { calculateCH, formatTimeRange } from '../utils/timeUtils';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: IntegrationSession) => void;
  onDelete?: (id: string) => void;
  sessionToEdit?: IntegrationSession | null;
  areas: AreaDefinition[];
  defaultDia?: number;
  existingDays: number[];
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  sessionToEdit,
  areas,
  defaultDia = 1,
  existingDays,
}) => {
  const [dia, setDia] = useState<number>(defaultDia);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [ch, setCh] = useState<string>('1h');
  const [autoCh, setAutoCh] = useState<boolean>(true);
  const [tema, setTema] = useState<string>('');
  const [area, setArea] = useState<string>(areas[0]?.name || 'GENTE E GESTÃO');
  const [responsavel, setResponsavel] = useState<string>('');
  const [prn, setPrn] = useState<string>('');
  const [local, setLocal] = useState<string>('Sala de Integração');
  const [codigo, setCodigo] = useState<string>('');
  const [entregavel, setEntregavel] = useState<string>('Lançamento em aplicativo ou lista');
  const [customColor, setCustomColor] = useState<string>('');

  useEffect(() => {
    if (sessionToEdit) {
      setDia(sessionToEdit.dia);
      setStartTime(sessionToEdit.startTime || '08:00');
      setEndTime(sessionToEdit.endTime || '09:00');
      setCh(sessionToEdit.ch || '1h');
      setAutoCh(false);
      setTema(sessionToEdit.tema);
      setArea(sessionToEdit.area);
      setResponsavel(sessionToEdit.responsavel || '');
      setPrn(sessionToEdit.prn || '');
      setLocal(sessionToEdit.local || 'Sala de Integração');
      setCodigo(sessionToEdit.codigo || '');
      setEntregavel(sessionToEdit.entregavel || 'Lançamento em aplicativo ou lista');
      setCustomColor(sessionToEdit.customColor || '');
    } else {
      setDia(defaultDia);
      setStartTime('08:00');
      setEndTime('09:00');
      setCh('1h');
      setAutoCh(true);
      setTema('');
      setArea(areas[0]?.name || 'GENTE E GESTÃO');
      setResponsavel('');
      setPrn('');
      setLocal('Sala de Integração');
      setCodigo('');
      setEntregavel('Lançamento em aplicativo ou lista');
      setCustomColor('');
    }
  }, [sessionToEdit, isOpen, defaultDia, areas]);

  // Recalculate CH when times change if autoCh is true
  useEffect(() => {
    if (autoCh && startTime && endTime) {
      setCh(calculateCH(startTime, endTime));
    }
  }, [startTime, endTime, autoCh]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;

    const newSession: IntegrationSession = {
      id: sessionToEdit ? sessionToEdit.id : `session-${Date.now()}`,
      dia,
      startTime,
      endTime,
      horarioText: formatTimeRange(startTime, endTime),
      ch: ch.trim() || calculateCH(startTime, endTime),
      tema: tema.trim(),
      area: area.trim(),
      responsavel: responsavel.trim() || 'N/A',
      prn: prn.trim() || 'N/A',
      local: local.trim() || 'Sala de Integração',
      codigo: codigo.trim() || 'N/A',
      entregavel: entregavel.trim() || 'N/A',
      customColor: customColor || undefined,
    };

    onSave(newSession);
    onClose();
  };

  const selectedAreaDef = areas.find((a) => a.name.toLowerCase() === area.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
              style={{ backgroundColor: customColor || selectedAreaDef?.bgColor || '#7c3aed' }}
            />
            <div>
              <h2 className="text-lg font-bold">
                {sessionToEdit ? 'Editar Treinamento / Atividade' : 'Novo Treinamento de Integração'}
              </h2>
              <p className="text-xs text-slate-300">
                Configure os horários, área responsável, facilitador e entregáveis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Dia & Horários */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dia do Cronograma</label>
              <select
                value={dia}
                onChange={(e) => setDia(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {Array.from(new Set([...existingDays, 1, 2, 3]))
                  .sort((a, b) => a - b)
                  .map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                <option value={Math.max(...existingDays, 1) + 1}>
                  + Novo Dia ({Math.max(...existingDays, 1) + 1})
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Término
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600">CH (Carga Horária)</label>
                <button
                  type="button"
                  onClick={() => {
                    setAutoCh(true);
                    setCh(calculateCH(startTime, endTime));
                  }}
                  className="text-[10px] text-indigo-600 hover:underline font-medium"
                >
                  Auto
                </button>
              </div>
              <input
                type="text"
                value={ch}
                onChange={(e) => {
                  setAutoCh(false);
                  setCh(e.target.value);
                }}
                placeholder="Ex: 1h40, 2h"
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tema / Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Tema / Conteúdo da Atividade *
            </label>
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Gente & Gestão, Treinamento On the Job, Uso de EPIs - NR-6"
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Área / Departamento e Cores */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-500" /> Área / Departamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {areas.map((a) => {
                const isSelected = area.toLowerCase() === a.name.toLowerCase();
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setArea(a.name);
                      setCustomColor('');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: a.bgColor }}
                    />
                    <span className="truncate text-slate-700">{a.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsável & PRN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" /> Responsável / Facilitador
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Mateus/Julia/Tatiele, Andre, Lidiane"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-500" /> PRN / Matrícula
              </label>
              <input
                type="text"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                placeholder="Ex: 159172/163286/147597, TCAM00996674"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Local & Código do Treinamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Local
              </label>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex: Sala de Integração, Refeitório, Fábrica"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-500" /> Código do Treinamento
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: 50018722, 50389664, N/A"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Entregável */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Entregável / Evidência
            </label>
            <input
              type="text"
              value={entregavel}
              onChange={(e) => setEntregavel(e.target.value)}
              placeholder="Ex: Lançamento em aplicativo ou lista, Rota Comunicada, Ficha de EPI/Certificado"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Personalização de Cor da Faixa */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">Cor personalizada para este bloco (opcional):</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor || selectedAreaDef?.bgColor || '#7c3aed'}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
              />
              {customColor && (
                <button
                  type="button"
                  onClick={() => setCustomColor('')}
                  className="text-xs text-slate-500 hover:text-red-500"
                >
                  Restaurar padrão da área
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {sessionToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Deseja realmente excluir a atividade "${sessionToEdit.tema}"?`)) {
                    onDelete(sessionToEdit.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Atividade
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow-md transition-all"
              >
                {sessionToEdit ? 'Salvar Alterações' : 'Adicionar ao Cronograma'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
