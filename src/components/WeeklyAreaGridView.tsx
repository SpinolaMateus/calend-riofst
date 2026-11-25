import React, { useMemo, useState } from 'react';
import {
  Plus, Filter, Sparkles, Palette, ZoomIn, ZoomOut,
  Calendar, Eye, Layers, RotateCcw, Edit2
} from 'lucide-react';
import {
  AreaDefinition,
  INTEGRATION_AUDIENCES,
  IntegrationAudience,
  IntegrationSession,
  UnitInfo,
} from '../types/schedule';
import { timeToMinutes } from '../utils/timeUtils';

interface WeeklyAreaGridViewProps {
  sessions: IntegrationSession[];
  areas: AreaDefinition[];
  unitInfo: UnitInfo;
  selectedAudience: IntegrationAudience;
  selectedDay: number | 'all';
  onUpdateSession: (updated: IntegrationSession) => void;
  onEditSession: (session: IntegrationSession) => void;
  onAddNewSession: (dia: number, startStr?: string, endStr?: string) => void;
}

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo',
};

const isBreakSession = (session: IntegrationSession) => {
  const temaUpper = (session.tema || '').trim().toUpperCase();
  const areaUpper = (session.area || '').trim().toUpperCase();
  return (
    areaUpper === 'N/A' ||
    temaUpper === 'ALMOÇO' ||
    temaUpper === 'ALMOCO' ||
    temaUpper.includes('INTERVALO') ||
    temaUpper.includes('COFFEE') ||
    temaUpper.includes('PAUSA')
  );
};

export const WeeklyAreaGridView: React.FC<WeeklyAreaGridViewProps> = ({
  sessions,
  areas,
  unitInfo,
  selectedAudience,
  selectedDay,
  onUpdateSession,
  onEditSession,
  onAddNewSession,
}) => {
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [areaFilterMode, setAreaFilterMode] = useState<'highlight' | 'filter'>('highlight');
  const [dayLabelMode, setDayLabelMode] = useState<'weekday' | 'day'>('weekday');
  const [pixelsPerHour, setPixelsPerHour] = useState<number>(84);
  const [quickAreaSessionId, setQuickAreaSessionId] = useState<string | null>(null);

  const audienceLabel =
    INTEGRATION_AUDIENCES.find((a) => a.id === selectedAudience)?.label || 'Geral';

  // Dias a exibir
  const daysToRender = useMemo(() => {
    const existingDays = Array.from(new Set(sessions.map((s) => s.dia))).sort((a, b) => a - b);
    if (selectedDay !== 'all') return [Number(selectedDay)];
    if (existingDays.length > 0) return existingDays;
    return [1, 2, 3, 4, 5];
  }, [sessions, selectedDay]);

  // Limites de horário dinâmicos (mínimo 08:00 às 17:30)
  const { startMinutes, endMinutes, hourMarks } = useMemo(() => {
    let minM = 8 * 60; // 08:00
    let maxM = 17 * 60 + 30; // 17:30

    sessions.forEach((s) => {
      const st = timeToMinutes(s.startTime);
      const en = timeToMinutes(s.endTime);
      if (st > 0 && st < minM) minM = Math.floor(st / 60) * 60;
      if (en > maxM) maxM = Math.ceil(en / 30) * 30;
    });

    const marks: number[] = [];
    for (let m = minM; m <= maxM; m += 60) {
      marks.push(m);
    }

    return { startMinutes: minM, endMinutes: maxM, hourMarks: marks };
  }, [sessions]);

  const totalMinutes = Math.max(60, endMinutes - startMinutes);
  const totalHeightPx = (totalMinutes / 60) * pixelsPerHour;

  // Helpers de cor da área
  const getAreaDefinition = (areaName: string) => {
    const clean = (areaName || '').trim().toUpperCase();
    return areas.find((a) => a.name.trim().toUpperCase() === clean);
  };

  const getAreaColor = (areaName: string, customColor?: string) => {
    const found = getAreaDefinition(areaName);
    return found ? found.bgColor : customColor || '#cbd5e1';
  };

  const getAreaTextColor = (areaName: string) => {
    const found = getAreaDefinition(areaName);
    return found ? found.textColor : '#0f172a';
  };

  // Áreas presentes nas sessões atuais + áreas cadastradas
  const legendAreas = useMemo(() => {
    const map = new Map<string, AreaDefinition>();
    areas.forEach((a) => {
      if (a.name.trim().toUpperCase() !== 'N/A') {
        map.set(a.name.trim().toUpperCase(), a);
      }
    });
    sessions.forEach((s) => {
      const clean = (s.area || '').trim().toUpperCase();
      if (clean && clean !== 'N/A' && !map.has(clean)) {
        map.set(clean, {
          id: `dyn-${clean}`,
          name: s.area.trim(),
          bgColor: s.customColor || '#94a3b8',
          textColor: '#ffffff',
        });
      }
    });
    return Array.from(map.values());
  }, [areas, sessions]);

  // Local predominante de cada dia para o subcabeçalho "Local: ..."
  const getDefaultLocationForDay = (dia: number) => {
    const daySessions = sessions.filter((s) => s.dia === dia && !isBreakSession(s) && s.local && s.local !== 'N/A');
    if (daySessions.length === 0) return unitInfo.locationDefault || 'Sala Integração';
    const counts = new Map<string, number>();
    daySessions.forEach((s) => {
      counts.set(s.local, (counts.get(s.local) || 0) + 1);
    });
    let best = daySessions[0].local;
    let bestCount = 0;
    counts.forEach((cnt, loc) => {
      if (cnt > bestCount) {
        best = loc;
        bestCount = cnt;
      }
    });
    return best;
  };

  const formatMinuteLabel = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleToggleAreaFilter = (areaName: string) => {
    const clean = areaName.trim().toUpperCase();
    setSelectedAreaFilter((prev) => (prev === clean ? 'all' : clean));
  };

  const handleQuickAreaChange = (session: IntegrationSession, newAreaName: string) => {
    onUpdateSession({
      ...session,
      area: newAreaName,
    });
    setQuickAreaSessionId(null);
  };

  const gridMinWidth = Math.max(760, 72 + daysToRender.length * 230);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Barra de Ajuste por Área e Controles (não aparece no print/imagem) */}
      <div
        data-capture-ignore
        className="no-print bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-800">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              Ajustar por Área:
            </span>

            <button
              type="button"
              onClick={() => setSelectedAreaFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                selectedAreaFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas as Áreas
            </button>

            {legendAreas.map((area) => {
              const clean = area.name.trim().toUpperCase();
              const isActive = selectedAreaFilter === clean;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleToggleAreaFilter(area.name)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'ring-2 ring-offset-1 ring-slate-900 shadow-xs scale-[1.02]'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: area.bgColor,
                    color: area.textColor,
                    borderColor: isActive ? '#0f172a' : 'rgba(15,23,42,0.2)',
                  }}
                >
                  <span className="truncate max-w-[140px]">{area.name}</span>
                </button>
              );
            })}
          </div>

          {/* Controles de Modo, Rótulo dos Dias e Zoom */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedAreaFilter !== 'all' && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setAreaFilterMode('highlight')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                    areaFilterMode === 'highlight'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Mantém toda a grade e destaca a área selecionada"
                >
                  <Eye className="w-3 h-3" />
                  <span>Destacar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAreaFilterMode('filter')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                    areaFilterMode === 'filter'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Exibe apenas os blocos da área selecionada"
                >
                  <Layers className="w-3 h-3" />
                  <span>Filtrar Só Área</span>
                </button>
              </div>
            )}

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setDayLabelMode('weekday')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  dayLabelMode === 'weekday'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Seg–Sex
              </button>
              <button
                type="button"
                onClick={() => setDayLabelMode('day')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  dayLabelMode === 'day'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Dia 1..N
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPixelsPerHour((p) => Math.max(60, p - 12))}
                className="p-0.5 text-slate-600 hover:text-slate-900"
                title="Diminuir altura"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-600 min-w-[34px] text-center">
                {Math.round((pixelsPerHour / 84) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPixelsPerHour((p) => Math.min(132, p + 12))}
                className="p-0.5 text-slate-600 hover:text-slate-900"
                title="Aumentar altura"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onAddNewSession(daysToRender[0] || 1, '08:30', '09:30')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Atividade</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <span>
            💡 Clique em qualquer bloco para editar, ou passe o mouse e clique no ícone{' '}
            <Palette className="w-3 h-3 inline text-indigo-600" /> para ajustar a <strong>Área</strong> diretamente na grade.
          </span>
          {selectedAreaFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedAreaFilter('all')}
              className="text-rose-600 hover:underline font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Limpar filtro de área
            </button>
          )}
        </div>
      </div>

      {/* Área Principal da Grade (Modelo Planilha Semanal + Legenda Lateral) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-3 sm:p-5 overflow-x-auto">
        <div className="flex items-start gap-5 min-w-max">
          {/* TABELA / GRADE SEMANAL */}
          <div style={{ minWidth: `${gridMinWidth}px` }} className="flex-1">
            {/* Título Principal estilo planilha */}
            <div className="border-2 border-slate-900 bg-slate-200 px-4 py-2 text-center">
              <h2 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wide">
                CRONOGRAMA {selectedAudience === 'geral' ? 'INTEGRAÇÃO' : audienceLabel.toUpperCase()} — {unitInfo.unitName.toUpperCase()}
              </h2>
              {selectedAreaFilter !== 'all' && (
                <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                  Filtro por Área: {selectedAreaFilter}
                </div>
              )}
            </div>

            {/* Cabeçalho dos Dias + Subcolunas (Local / Responsável) */}
            <div className="flex border-x-2 border-b-2 border-slate-900 bg-white">
              {/* Coluna Horário Header */}
              <div className="w-[62px] shrink-0 border-r-2 border-slate-900 flex items-center justify-center p-1.5 bg-slate-50">
                <span className="text-[11px] font-bold italic text-slate-800">Horário</span>
              </div>

              {/* Cabeçalhos por Dia */}
              <div
                className="flex-1 grid divide-x-2 divide-slate-900"
                style={{ gridTemplateColumns: `repeat(${daysToRender.length}, minmax(0, 1fr))` }}
              >
                {daysToRender.map((dia) => {
                  const dayTitle =
                    dayLabelMode === 'weekday'
                      ? WEEKDAY_NAMES[dia] || `Dia ${dia}`
                      : `Dia ${dia}`;
                  const defaultLoc = getDefaultLocationForDay(dia);

                  return (
                    <div key={`hdr-${dia}`} className="flex flex-col">
                      <div className="bg-slate-100 border-b border-slate-900 py-1 px-2 text-center font-black text-xs text-slate-950">
                        {dayTitle}
                      </div>
                      <div className="grid grid-cols-10 text-[10px] font-semibold text-slate-800 bg-white">
                        <div className="col-span-7 border-r border-slate-900 py-1 px-1.5 text-center truncate" title={`Local: ${defaultLoc}`}>
                          Local: {defaultLoc}
                        </div>
                        <div className="col-span-3 py-1 px-1 text-center truncate">
                          Responsável
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Corpo da Grade Horária */}
            <div
              className="flex border-x-2 border-b-2 border-slate-900 relative bg-white"
              style={{ height: `${totalHeightPx}px` }}
            >
              {/* Coluna de Horários (Esquerda) */}
              <div className="w-[62px] shrink-0 border-r-2 border-slate-900 relative bg-slate-50/70">
                {hourMarks.map((mins) => {
                  const topPx = ((mins - startMinutes) / 60) * pixelsPerHour;
                  return (
                    <div
                      key={`t-${mins}`}
                      className="absolute left-0 right-0 flex items-start justify-end pr-1.5 -translate-y-2"
                      style={{ top: `${topPx}px` }}
                    >
                      <span className="text-[10px] font-bold text-slate-700 tabular-nums bg-slate-50/90 px-0.5">
                        {formatMinuteLabel(mins)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Colunas dos Dias */}
              <div
                className="flex-1 grid divide-x-2 divide-slate-900 relative"
                style={{ gridTemplateColumns: `repeat(${daysToRender.length}, minmax(0, 1fr))` }}
              >
                {/* Linhas horizontais de grade a cada 30 min / 1h */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  {hourMarks.map((mins) => {
                    const topPx = ((mins - startMinutes) / 60) * pixelsPerHour;
                    const halfTopPx = ((mins + 30 - startMinutes) / 60) * pixelsPerHour;
                    return (
                      <React.Fragment key={`grid-${mins}`}>
                        <div
                          className="absolute left-0 right-0 border-t border-slate-200"
                          style={{ top: `${topPx}px` }}
                        />
                        {mins + 30 < endMinutes && (
                          <div
                            className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                            style={{ top: `${halfTopPx}px` }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {daysToRender.map((dia) => {
                  const daySessions = sessions
                    .filter((s) => s.dia === dia)
                    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

                  const defaultLoc = getDefaultLocationForDay(dia);

                  return (
                    <div key={`col-${dia}`} className="relative h-full">
                      {/* Divisor vertical sutil entre Tema/Local (70%) e Responsável (30%) */}
                      <div className="absolute top-0 bottom-0 left-[70%] border-l border-slate-200 pointer-events-none z-0" />

                      {daySessions.map((session) => {
                        const sStart = Math.max(startMinutes, timeToMinutes(session.startTime));
                        const sEnd = Math.min(endMinutes, timeToMinutes(session.endTime));
                        if (sEnd <= sStart) return null;

                        const isBreak = isBreakSession(session);
                        const areaClean = (session.area || '').trim().toUpperCase();
                        const matchesArea =
                          selectedAreaFilter === 'all' || areaClean === selectedAreaFilter;

                        if (!isBreak && areaFilterMode === 'filter' && !matchesArea) {
                          return null;
                        }

                        const topPx = ((sStart - startMinutes) / 60) * pixelsPerHour;
                        const heightPx = Math.max(20, ((sEnd - sStart) / 60) * pixelsPerHour);

                        const bgColor = getAreaColor(session.area, session.customColor);
                        const textColor = getAreaTextColor(session.area);
                        const isDimmed =
                          !isBreak &&
                          areaFilterMode === 'highlight' &&
                          selectedAreaFilter !== 'all' &&
                          !matchesArea;

                        if (isBreak) {
                          return (
                            <div
                              key={session.id}
                              onClick={() => onEditSession(session)}
                              className="absolute left-0 right-0 z-20 bg-slate-950 text-white border-y border-slate-900 flex items-center justify-center px-2 cursor-pointer hover:bg-slate-800 transition-colors"
                              style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                              title={`${session.tema} (${session.startTime} às ${session.endTime}) — Clique para editar`}
                            >
                              <span className="text-[11px] font-bold italic tracking-wide truncate">
                                {session.tema}
                              </span>
                            </div>
                          );
                        }

                        const showCustomLoc =
                          session.local &&
                          session.local !== 'N/A' &&
                          session.local.trim().toUpperCase() !== defaultLoc.trim().toUpperCase();

                        return (
                          <div
                            key={session.id}
                            className={`absolute left-0 right-0 z-10 grid grid-cols-10 group transition-opacity ${
                              isDimmed ? 'opacity-20' : 'opacity-100'
                            }`}
                            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                          >
                            {/* Subcoluna Tema (colorida pela Área) */}
                            <div
                              onClick={() => onEditSession(session)}
                              className="col-span-7 border border-slate-900 px-1.5 py-0.5 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden hover:brightness-95 transition-all"
                              style={{ backgroundColor: bgColor, color: textColor }}
                              title={`${session.tema}\nÁrea: ${session.area}\nHorário: ${session.startTime} às ${session.endTime}\nLocal: ${session.local}\nClique para editar`}
                            >
                              <span className="text-[10px] sm:text-[11px] font-bold leading-tight line-clamp-3">
                                {session.tema}
                              </span>
                              {showCustomLoc && heightPx >= 36 && (
                                <span className="text-[9px] opacity-85 font-medium truncate max-w-full mt-0.5">
                                  ({session.local})
                                </span>
                              )}

                              {/* Botão rápido de troca de Área */}
                              <button
                                type="button"
                                data-capture-ignore
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickAreaSessionId(
                                    quickAreaSessionId === session.id ? null : session.id
                                  );
                                }}
                                className="no-print absolute top-0.5 right-0.5 p-1 rounded bg-black/25 hover:bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Ajustar Área rapidamente"
                              >
                                <Palette className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Subcoluna Responsável */}
                            <div
                              onClick={() => onEditSession(session)}
                              className="col-span-3 border-y border-r border-slate-900 bg-white text-slate-900 px-1 py-0.5 flex items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden"
                              title={`Responsável: ${session.responsavel || 'A definir'} — Clique para editar`}
                            >
                              <span className="text-[10px] font-semibold leading-tight line-clamp-3 break-words">
                                {session.responsavel || '—'}
                              </span>
                            </div>

                            {/* Popover rápido para trocar a Área */}
                            {quickAreaSessionId === session.id && (
                              <div
                                data-capture-ignore
                                onClick={(e) => e.stopPropagation()}
                                className="no-print absolute left-1 top-full mt-1 z-50 bg-white border border-slate-300 rounded-xl shadow-xl p-1.5 w-48 space-y-0.5 max-h-56 overflow-y-auto"
                              >
                                <div className="text-[10px] font-black text-slate-500 uppercase px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                                  <span>Trocar Área</span>
                                  <button
                                    type="button"
                                    onClick={() => setQuickAreaSessionId(null)}
                                    className="text-slate-400 hover:text-slate-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {legendAreas.map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => handleQuickAreaChange(session, a.name)}
                                    className="w-full text-left px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-[11px] font-bold text-slate-800"
                                  >
                                    <span
                                      className="w-3 h-3 rounded-xs border border-slate-400 shrink-0"
                                      style={{ backgroundColor: a.bgColor }}
                                    />
                                    <span className="truncate">{a.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LEGENDA LATERAL (Modelo idêntico à imagem) */}
          <div className="w-44 shrink-0 pt-2">
            <div className="text-xs font-bold italic text-slate-800 mb-2 pl-1">
              Legenda
            </div>
            <div className="border border-slate-900 divide-y divide-slate-800 bg-white shadow-2xs">
              {legendAreas.map((area) => {
                const clean = area.name.trim().toUpperCase();
                const isSelected = selectedAreaFilter === clean;
                return (
                  <button
                    key={`leg-${area.id}`}
                    type="button"
                    onClick={() => handleToggleAreaFilter(area.name)}
                    className={`w-full grid grid-cols-12 text-left transition-all hover:bg-slate-50 ${
                      isSelected ? 'ring-2 ring-inset ring-slate-900 bg-slate-100' : ''
                    }`}
                    title="Clique para filtrar/destacar esta área na grade"
                  >
                    <div
                      className="col-span-4 border-r border-slate-800 min-h-[22px]"
                      style={{ backgroundColor: area.bgColor }}
                    />
                    <div className="col-span-8 px-2 py-1 text-[10px] font-bold text-slate-900 flex items-center truncate">
                      {area.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
