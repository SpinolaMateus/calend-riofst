import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Edit2, Copy, Trash2, Clock, 
  MapPin, User, ChevronRight,
  Columns3, Rows3, ZoomIn, ZoomOut, Sparkles
} from 'lucide-react';
import { AreaDefinition, IntegrationSession } from '../types/schedule';
import { 
  calculateCH, formatTimeRange, minutesToTime, 
  snapMinutes, timeToMinutes, isSessionCurrent 
} from '../utils/timeUtils';

interface VisualTimelineViewProps {
  sessions: IntegrationSession[];
  areas: AreaDefinition[];
  selectedDay: number | 'all';
  onUpdateSession: (updated: IntegrationSession) => void;
  onDeleteSession: (id: string) => void;
  onDuplicateSession: (session: IntegrationSession) => void;
  onEditSession: (session: IntegrationSession) => void;
  onAddNewSession: (dia: number, startStr?: string, endStr?: string) => void;
}

export const VisualTimelineView: React.FC<VisualTimelineViewProps> = ({
  sessions,
  areas,
  selectedDay,
  onUpdateSession,
  onDeleteSession,
  onDuplicateSession,
  onEditSession,
  onAddNewSession,
}) => {
  // Timeline hours: 07:00 (420 min) to 18:00 (1080 min)
  const START_HOUR = 7;
  const END_HOUR = 18;
  const START_MINUTES = START_HOUR * 60;
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 660 mins

  // Layout orientation: 'vertical' (columns of days) is the user's requested layout!
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [pixelsPerHour, setPixelsPerHour] = useState<number>(90); // Height per hour in vertical view

  // Active filter by Area
  const [activeAreaFilter, setActiveAreaFilter] = useState<string | null>(null);

  // Available days
  const allDays = Array.from(new Set(sessions.map((s) => s.dia))).sort((a, b) => a - b);
  const daysToRender = selectedDay === 'all' ? (allDays.length > 0 ? allDays : [1, 2, 3]) : [Number(selectedDay)];

  // Active drag state
  const [dragState, setDragState] = useState<{
    sessionId: string;
    action: 'move' | 'resize-start' | 'resize-end';
    startCoord: number; // Y for vertical, X for horizontal
    initialStartMinutes: number;
    initialEndMinutes: number;
    currentStartMinutes: number;
    currentEndMinutes: number;
    currentDay: number;
    targetDay: number;
  } | null>(null);

  const verticalContainerRef = useRef<HTMLDivElement | null>(null);
  const horizontalRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Helper colors
  const getAreaColor = (areaName: string, customColor?: string) => {
    if (customColor) return customColor;
    const found = areas.find((a) => a.name.toLowerCase() === areaName.toLowerCase());
    return found ? found.bgColor : '#64748b';
  };

  const getAreaTextColor = (areaName: string) => {
    const found = areas.find((a) => a.name.toLowerCase() === areaName.toLowerCase());
    return found ? found.textColor : '#ffffff';
  };

  // Generate hour marks
  const hourMarks: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hourMarks.push(h);
  }

  // --- VERTICAL DRAG HANDLERS ---
  const handleVerticalPointerDown = (
    e: React.PointerEvent,
    session: IntegrationSession,
    action: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startMin = timeToMinutes(session.startTime);
    const endMin = timeToMinutes(session.endTime);

    setDragState({
      sessionId: session.id,
      action,
      startCoord: e.clientY,
      initialStartMinutes: startMin,
      initialEndMinutes: endMin,
      currentStartMinutes: startMin,
      currentEndMinutes: endMin,
      currentDay: session.dia,
      targetDay: session.dia,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleVerticalPointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    const pixelDeltaY = e.clientY - dragState.startCoord;
    const minutesDelta = (pixelDeltaY / pixelsPerHour) * 60;

    let newStart = dragState.initialStartMinutes;
    let newEnd = dragState.initialEndMinutes;

    if (dragState.action === 'move') {
      const duration = dragState.initialEndMinutes - dragState.initialStartMinutes;
      newStart = snapMinutes(dragState.initialStartMinutes + minutesDelta, 15);
      newStart = Math.max(START_MINUTES, Math.min(END_HOUR * 60 - duration, newStart));
      newEnd = newStart + duration;
    } else if (dragState.action === 'resize-start') {
      newStart = snapMinutes(dragState.initialStartMinutes + minutesDelta, 15);
      newStart = Math.max(START_MINUTES, Math.min(dragState.initialEndMinutes - 15, newStart));
    } else if (dragState.action === 'resize-end') {
      newEnd = snapMinutes(dragState.initialEndMinutes + minutesDelta, 15);
      newEnd = Math.min(END_HOUR * 60, Math.max(dragState.initialStartMinutes + 15, newEnd));
    }

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentStartMinutes: newStart,
            currentEndMinutes: newEnd,
          }
        : null
    );
  };

  const handleVerticalPointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;

    const session = sessions.find((s) => s.id === dragState.sessionId);
    if (session) {
      const finalStart = minutesToTime(dragState.currentStartMinutes);
      const finalEnd = minutesToTime(dragState.currentEndMinutes);
      const newCh = calculateCH(finalStart, finalEnd);

      onUpdateSession({
        ...session,
        startTime: finalStart,
        endTime: finalEnd,
        horarioText: formatTimeRange(finalStart, finalEnd),
        ch: newCh,
      });
    }

    setDragState(null);
  };

  // --- HORIZONTAL DRAG HANDLERS ---
  const handleHorizontalPointerDown = (
    e: React.PointerEvent,
    session: IntegrationSession,
    action: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startMin = timeToMinutes(session.startTime);
    const endMin = timeToMinutes(session.endTime);

    setDragState({
      sessionId: session.id,
      action,
      startCoord: e.clientX,
      initialStartMinutes: startMin,
      initialEndMinutes: endMin,
      currentStartMinutes: startMin,
      currentEndMinutes: endMin,
      currentDay: session.dia,
      targetDay: session.dia,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleHorizontalPointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const timelineEl = horizontalRefs.current[dragState.currentDay];
    if (!timelineEl) return;

    const rect = timelineEl.getBoundingClientRect();
    const pixelDelta = e.clientX - dragState.startCoord;
    const minutesDelta = (pixelDelta / rect.width) * TOTAL_MINUTES;

    let newStart = dragState.initialStartMinutes;
    let newEnd = dragState.initialEndMinutes;

    if (dragState.action === 'move') {
      const duration = dragState.initialEndMinutes - dragState.initialStartMinutes;
      newStart = snapMinutes(dragState.initialStartMinutes + minutesDelta, 15);
      newStart = Math.max(START_MINUTES, Math.min(END_HOUR * 60 - duration, newStart));
      newEnd = newStart + duration;
    } else if (dragState.action === 'resize-start') {
      newStart = snapMinutes(dragState.initialStartMinutes + minutesDelta, 15);
      newStart = Math.max(START_MINUTES, Math.min(dragState.initialEndMinutes - 15, newStart));
    } else if (dragState.action === 'resize-end') {
      newEnd = snapMinutes(dragState.initialEndMinutes + minutesDelta, 15);
      newEnd = Math.min(END_HOUR * 60, Math.max(dragState.initialStartMinutes + 15, newEnd));
    }

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentStartMinutes: newStart,
            currentEndMinutes: newEnd,
          }
        : null
    );
  };

  const handleHorizontalPointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;
    const session = sessions.find((s) => s.id === dragState.sessionId);
    if (session) {
      const finalStart = minutesToTime(dragState.currentStartMinutes);
      const finalEnd = minutesToTime(dragState.currentEndMinutes);
      const newCh = calculateCH(finalStart, finalEnd);

      onUpdateSession({
        ...session,
        startTime: finalStart,
        endTime: finalEnd,
        horarioText: formatTimeRange(finalStart, finalEnd),
        ch: newCh,
      });
    }
    setDragState(null);
  };

  // Clicking on vertical column adds activity at that time
  const handleVerticalColumnDoubleClick = (e: React.MouseEvent<HTMLDivElement>, day: number) => {
    if (dragState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickMinutes = START_MINUTES + (clickY / (rect.height)) * TOTAL_MINUTES;
    const snappedStart = snapMinutes(clickMinutes, 15);
    const startStr = minutesToTime(Math.max(START_MINUTES, Math.min(END_HOUR * 60 - 60, snappedStart)));
    const endStr = minutesToTime(timeToMinutes(startStr) + 60);

    onAddNewSession(day, startStr, endStr);
  };

  // Layout algorithm for vertical columns with concurrent/overlapping events
  const computeVerticalColumnsForDay = (daySessions: IntegrationSession[]) => {
    const sorted = [...daySessions].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    // Group overlapping sessions into clusters
    const clusters: IntegrationSession[][] = [];
    sorted.forEach((session) => {
      const start = timeToMinutes(session.startTime);
      const end = timeToMinutes(session.endTime);

      let added = false;
      for (const cluster of clusters) {
        const clusterStart = Math.min(...cluster.map((s) => timeToMinutes(s.startTime)));
        const clusterEnd = Math.max(...cluster.map((s) => timeToMinutes(s.endTime)));

        if (start < clusterEnd && end > clusterStart) {
          cluster.push(session);
          added = true;
          break;
        }
      }

      if (!added) {
        clusters.push([session]);
      }
    });

    // Map each session to its sub-column index and total sub-columns in cluster
    const layoutMap = new Map<string, { colIndex: number; totalCols: number }>();

    clusters.forEach((cluster) => {
      const columns: IntegrationSession[][] = [];

      cluster.forEach((item) => {
        let placed = false;
        const itemStart = timeToMinutes(item.startTime);

        for (let i = 0; i < columns.length; i++) {
          const lastItem = columns[i][columns[i].length - 1];
          if (itemStart >= timeToMinutes(lastItem.endTime)) {
            columns[i].push(item);
            placed = true;
            break;
          }
        }

        if (!placed) {
          columns.push([item]);
        }
      });

      const totalCols = columns.length;
      columns.forEach((col, colIndex) => {
        col.forEach((item) => {
          layoutMap.set(item.id, { colIndex, totalCols });
        });
      });
    });

    return layoutMap;
  };

  const totalVerticalHeight = (END_HOUR - START_HOUR) * pixelsPerHour;

  return (
    <div className="space-y-4">
      {/* Top Banner & Orientation Switcher */}
      <div data-capture-ignore className="no-print bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">
                {orientation === 'vertical' ? 'Visão Vertical por Dias (Colunas)' : 'Visão Horizontal (Linha do Tempo)'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                Arrastável & Editável
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Sincronizado com a Tabela XLS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {orientation === 'vertical'
                ? 'Arraste as bordas superior/inferior para alterar os horários ou o centro para mover a atividade. Altere aqui ou na Tabela: ambos compartilham os mesmos dados em tempo real.'
                : 'Arraste as extremidades esquerda/direita para alterar o horário ou o centro para mover a faixa. Sincronização automática com a Tabela.'}
            </p>
          </div>
        </div>

        {/* View Switchers & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end">
          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setOrientation('vertical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                orientation === 'vertical'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Colunas verticais lado a lado para cada dia (ideal para comparar horários)"
            >
              <Columns3 className="w-4 h-4" />
              <span>Colunas Verticais</span>
            </button>
            <button
              onClick={() => setOrientation('horizontal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                orientation === 'horizontal'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Faixas horizontais contínuas"
            >
              <Rows3 className="w-4 h-4" />
              <span>Faixas Horizontais</span>
            </button>
          </div>

          {/* Zoom controls for vertical mode */}
          {orientation === 'vertical' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setPixelsPerHour((p) => Math.max(50, p - 15))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white"
                title="Diminuir espaçamento (Mais compacto)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-slate-700">
                {pixelsPerHour}px/h
              </span>
              <button
                onClick={() => setPixelsPerHour((p) => Math.min(120, p + 15))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white"
                title="Aumentar espaçamento (Mais espaçado)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter by Area Pills */}
      <div data-capture-ignore className="no-print bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-bold text-slate-500 mr-1">Filtrar por Área:</span>
        {areas.map((a) => {
          const isActive = activeAreaFilter === a.name;
          return (
            <button
              key={a.id}
              onClick={() => setActiveAreaFilter(isActive ? null : a.name)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'ring-2 ring-slate-900 scale-105 shadow-xs'
                  : 'opacity-80 hover:opacity-100'
              }`}
              style={{
                backgroundColor: a.bgColor,
                color: a.textColor,
              }}
            >
              <span>{a.name}</span>
            </button>
          );
        })}
        {activeAreaFilter && (
          <button
            onClick={() => setActiveAreaFilter(null)}
            className="text-[11px] font-bold text-rose-600 hover:underline px-2"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: VERTICAL GRID (DAYS AS COLUMNS - USER'S REQUESTED LAYOUT) */}
      {/* ========================================================================= */}
      {orientation === 'vertical' && (
        <div
          ref={verticalContainerRef}
          onPointerMove={handleVerticalPointerMove}
          onPointerUp={handleVerticalPointerUp}
          className="bg-white rounded-2xl border border-slate-300/80 shadow-xs overflow-hidden select-none"
        >
          {/* Calendar Header with Day Columns */}
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Day Header Row */}
              <div className="grid border-b border-slate-200 bg-slate-900 text-white"
                style={{
                  gridTemplateColumns: `70px repeat(${daysToRender.length}, minmax(220px, 1fr))`,
                }}
              >
                {/* Time Axis corner label */}
                <div className="p-3 text-center text-[11px] font-bold text-slate-400 border-r border-slate-700 flex items-center justify-center">
                  HORA
                </div>

                {/* Day column headers */}
                {daysToRender.map((d) => {
                  const count = sessions.filter((s) => s.dia === d).length;
                  return (
                    <div
                      key={d}
                      className="p-3 border-r last:border-r-0 border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {d}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm tracking-wide">DIA {d}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {count} atividades
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddNewSession(d)}
                        data-capture-ignore
                        className="no-print px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        title={`Adicionar atividade no Dia ${d}`}
                      >
                        <Plus className="w-3 h-3" /> Adicionar
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Time Grid and Day Columns Body */}
              <div
                className="relative grid"
                style={{
                  gridTemplateColumns: `70px repeat(${daysToRender.length}, minmax(220px, 1fr))`,
                  height: `${totalVerticalHeight}px`,
                }}
              >
                {/* Left Time Labels Column */}
                <div className="relative border-r border-slate-200 bg-slate-50/70 select-none">
                  {hourMarks.map((hour, idx) => {
                    const topPx = idx * pixelsPerHour;
                    return (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 transform -translate-y-1/2 flex items-center justify-center"
                        style={{ top: `${topPx}px` }}
                      >
                        <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-50 px-1 rounded">
                          {String(hour).padStart(2, '0')}:00
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Day Columns */}
                {daysToRender.map((dayNum) => {
                  const daySessions = sessions.filter(
                    (s) =>
                      s.dia === dayNum &&
                      (!activeAreaFilter || s.area.toLowerCase() === activeAreaFilter.toLowerCase())
                  );

                  const layoutMap = computeVerticalColumnsForDay(daySessions);

                  return (
                    <div
                      key={dayNum}
                      onDoubleClick={(e) => handleVerticalColumnDoubleClick(e, dayNum)}
                      className="relative border-r last:border-r-0 border-slate-200 bg-white hover:bg-slate-50/40 transition-colors cursor-crosshair"
                      title="Clique duas vezes para adicionar uma atividade neste horário"
                    >
                      {/* Horizontal hour lines */}
                      {hourMarks.map((hour, idx) => {
                        const topPx = idx * pixelsPerHour;
                        return (
                          <div
                            key={hour}
                            className="absolute left-0 right-0 border-t border-slate-200 pointer-events-none"
                            style={{ top: `${topPx}px` }}
                          >
                            {/* Half-hour dashed line */}
                            {idx < hourMarks.length - 1 && (
                              <div
                                className="absolute left-0 right-0 border-t border-dashed border-slate-200/60 pointer-events-none"
                                style={{ top: `${pixelsPerHour / 2}px` }}
                              />
                            )}
                          </div>
                        );
                      })}

                      {/* Render Sessions in this Day Column */}
                      {daySessions.map((session) => {
                        const isDragging = dragState?.sessionId === session.id;

                        const startMin = isDragging
                          ? dragState.currentStartMinutes
                          : timeToMinutes(session.startTime);
                        const endMin = isDragging
                          ? dragState.currentEndMinutes
                          : timeToMinutes(session.endTime);

                        // Position calculation
                        const topPx = ((startMin - START_MINUTES) / 60) * pixelsPerHour;
                        const heightPx = Math.max(28, ((endMin - startMin) / 60) * pixelsPerHour);

                        // Concurrent layout calculation
                        const layout = layoutMap.get(session.id) || { colIndex: 0, totalCols: 1 };
                        const colWidthPct = 100 / layout.totalCols;
                        const leftPct = layout.colIndex * colWidthPct;

                        const bgColor = getAreaColor(session.area, session.customColor);
                        const textColor = getAreaTextColor(session.area);

                        const displayStart = minutesToTime(startMin);
                        const displayEnd = minutesToTime(endMin);
                        const displayCH = calculateCH(displayStart, displayEnd);
                        const isCurrent = isSessionCurrent(displayStart, displayEnd);

                        return (
                          <div
                            key={session.id}
                            className={`absolute rounded-xl shadow-md border border-black/10 transition-shadow group flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing ${
                              isDragging
                                ? 'ring-3 ring-indigo-500 z-40 opacity-95 scale-[1.01]'
                                : isCurrent
                                ? 'ring-2 ring-amber-400 z-20 shadow-lg'
                                : 'z-10 hover:z-30 hover:shadow-xl'
                            }`}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `calc(${leftPct}% + 3px)`,
                              width: `calc(${colWidthPct}% - 6px)`,
                              backgroundColor: bgColor,
                              color: textColor,
                            }}
                          >
                            {/* TOP RESIZE HANDLE (Adjust Start Time) */}
                            <div
                              onPointerDown={(e) => handleVerticalPointerDown(e, session, 'resize-start')}
                              className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-black/20 flex items-center justify-center z-30 transition-colors"
                              title="Arraste para ajustar o horário de início"
                            >
                              <div className="w-6 h-1 rounded-full bg-white/70" />
                            </div>

                            {/* MAIN SESSION BODY (Move Time Slot) */}
                            <div
                              onPointerDown={(e) => handleVerticalPointerDown(e, session, 'move')}
                              className="px-2 py-1 flex-1 flex flex-col justify-between overflow-hidden"
                            >
                              {/* Layout Variant 1: Micro Compact (for 15-30min slots or height < 44px) */}
                              {heightPx < 44 ? (
                                <div className="flex items-center justify-between gap-1 h-full">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-mono font-bold text-[9px] bg-black/30 px-1 py-0.5 rounded shrink-0">
                                      {displayStart}
                                    </span>
                                    <span className="font-bold text-[10px] truncate leading-tight">
                                      {session.tema}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded px-1 py-0.5 shrink-0 text-white">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSession(session);
                                      }}
                                      className="p-0.5 hover:text-indigo-200"
                                      title="Editar Atividade"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Excluir a atividade "${session.tema}"?`)) {
                                          onDeleteSession(session.id);
                                        }
                                      }}
                                      className="p-0.5 hover:text-red-300"
                                      title="Excluir Atividade"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : heightPx < 72 ? (
                                /* Layout Variant 2: Compact (for 30min-1h slots or medium height) */
                                <div className="flex flex-col justify-between h-full">
                                  <div className="flex items-start justify-between gap-1">
                                    <h5 className="font-extrabold text-[11px] leading-tight truncate drop-shadow-xs">
                                      {session.tema}
                                    </h5>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded px-1 py-0.5 shrink-0 text-white">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditSession(session);
                                        }}
                                        className="p-0.5 hover:text-indigo-200"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteSession(session.id);
                                        }}
                                        className="p-0.5 hover:text-red-300"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-[9px] font-medium opacity-90 truncate mt-0.5">
                                    <span className="font-mono font-bold bg-black/25 px-1 py-0.5 rounded shrink-0">
                                      {displayStart}-{displayEnd} ({displayCH})
                                    </span>
                                    {session.responsavel && session.responsavel !== 'N/A' && (
                                      <span className="truncate flex items-center gap-0.5">
                                        <User className="w-2.5 h-2.5 inline shrink-0" />
                                        <span className="truncate">{session.responsavel}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Layout Variant 3: Full Detailed (for >= 72px) */
                                <div className="flex flex-col justify-between h-full">
                                  <div>
                                    <div className="flex items-start justify-between gap-1">
                                      <h5 className="font-extrabold text-[11.5px] leading-tight line-clamp-2 drop-shadow-xs">
                                        {session.tema}
                                      </h5>
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded px-1 py-0.5 shrink-0 text-white">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEditSession(session);
                                          }}
                                          className="p-0.5 hover:text-indigo-200"
                                          title="Editar"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDuplicateSession(session);
                                          }}
                                          className="p-0.5 hover:text-indigo-200"
                                          title="Duplicar"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession(session.id);
                                          }}
                                          className="p-0.5 hover:text-red-300"
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="mt-1">
                                      <span className="inline-block text-[8.5px] font-black uppercase tracking-wider bg-black/25 px-1.5 py-0.5 rounded truncate max-w-full">
                                        {session.area}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-0.5 text-[9.5px] font-medium opacity-90 truncate mt-1">
                                    <div className="font-mono font-bold bg-black/25 px-1 py-0.5 rounded inline-block">
                                      {displayStart} - {displayEnd} ({displayCH})
                                    </div>
                                    {session.responsavel && session.responsavel !== 'N/A' && (
                                      <div className="truncate flex items-center gap-1">
                                        <User className="w-2.5 h-2.5 shrink-0 inline" />
                                        <span className="truncate">{session.responsavel}</span>
                                      </div>
                                    )}
                                    {session.local && (
                                      <div className="truncate flex items-center gap-1">
                                        <MapPin className="w-2.5 h-2.5 shrink-0 inline" />
                                        <span className="truncate">{session.local}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* BOTTOM RESIZE HANDLE (Adjust End Time) */}
                            <div
                              onPointerDown={(e) => handleVerticalPointerDown(e, session, 'resize-end')}
                              className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-black/20 flex items-center justify-center z-30 transition-colors"
                              title="Arraste para ajustar o horário de término"
                            >
                              <div className="w-6 h-1 rounded-full bg-white/70" />
                            </div>

                            {/* Floating helper while dragging */}
                            {isDragging && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-mono px-2.5 py-1 rounded-lg shadow-2xl whitespace-nowrap z-50 border border-slate-700 pointer-events-none">
                                {displayStart} às {displayEnd} • {displayCH}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: HORIZONTAL TIMELINE (AVAILABLE AS AN OPTION VIA TOGGLE) */}
      {/* ========================================================================= */}
      {orientation === 'horizontal' && (
        <div className="space-y-6">
          {daysToRender.map((dayNum) => {
            const daySessions = sessions.filter(
              (s) =>
                s.dia === dayNum &&
                (!activeAreaFilter || s.area.toLowerCase() === activeAreaFilter.toLowerCase())
            );

            // Compute overlapping lanes
            const sorted = [...daySessions].sort(
              (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
            );
            const lanes: IntegrationSession[][] = [];
            sorted.forEach((session) => {
              let placed = false;
              const start = timeToMinutes(session.startTime);

              for (let i = 0; i < lanes.length; i++) {
                const lastSessionInLane = lanes[i][lanes[i].length - 1];
                const lastEnd = timeToMinutes(lastSessionInLane.endTime);
                if (start >= lastEnd) {
                  lanes[i].push(session);
                  placed = true;
                  break;
                }
              }
              if (!placed) {
                lanes.push([session]);
              }
            });

            const laneCount = Math.max(lanes.length, 1);
            const laneHeight = 84;
            const totalHeight = laneCount * laneHeight + 20;

            return (
              <div
                key={dayNum}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500 text-white font-black text-base flex items-center justify-center shadow-xs">
                      {dayNum}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm tracking-wide">
                        DIA {dayNum} — Integração da Unidade
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {daySessions.length} atividades • Janela das {START_HOUR}:00 às {END_HOUR}:00
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddNewSession(dayNum)}
                    data-capture-ignore
                    className="no-print px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>

                <div className="overflow-x-auto p-4 select-none">
                  <div className="min-w-[950px]">
                    {/* Time Axis Bar */}
                    <div className="relative h-8 border-b border-slate-300 flex items-end pb-1 text-slate-500 text-[11px] font-mono">
                      {hourMarks.map((hour) => {
                        const leftPct = ((hour * 60 - START_MINUTES) / TOTAL_MINUTES) * 100;
                        return (
                          <div
                            key={hour}
                            className="absolute transform -translate-x-1/2 flex flex-col items-center"
                            style={{ left: `${leftPct}%` }}
                          >
                            <span className="font-semibold text-slate-700">
                              {String(hour).padStart(2, '0')}:00
                            </span>
                            <div className="w-px h-2 bg-slate-400 mt-0.5" />
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline Container */}
                    <div
                      ref={(el) => {
                        horizontalRefs.current[dayNum] = el;
                      }}
                      onPointerMove={handleHorizontalPointerMove}
                      onPointerUp={handleHorizontalPointerUp}
                      className="relative mt-2 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl cursor-crosshair overflow-hidden"
                      style={{ height: `${totalHeight}px` }}
                    >
                      {hourMarks.map((hour) => {
                        const leftPct = ((hour * 60 - START_MINUTES) / TOTAL_MINUTES) * 100;
                        return (
                          <div
                            key={hour}
                            className="absolute top-0 bottom-0 pointer-events-none border-l border-slate-200"
                            style={{ left: `${leftPct}%` }}
                          />
                        );
                      })}

                      {lanes.map((lane, laneIdx) =>
                        lane.map((session) => {
                          const isDraggingThis = dragState?.sessionId === session.id;
                          const startMin = isDraggingThis
                            ? dragState.currentStartMinutes
                            : timeToMinutes(session.startTime);
                          const endMin = isDraggingThis
                            ? dragState.currentEndMinutes
                            : timeToMinutes(session.endTime);

                          const leftPct = Math.max(
                            0,
                            Math.min(100, ((startMin - START_MINUTES) / TOTAL_MINUTES) * 100)
                          );
                          const widthPct = Math.max(
                            3,
                            Math.min(100 - leftPct, ((endMin - startMin) / TOTAL_MINUTES) * 100)
                          );

                          const topPx = laneIdx * laneHeight + 10;
                          const bgColor = getAreaColor(session.area, session.customColor);
                          const textColor = getAreaTextColor(session.area);

                          const displayStart = minutesToTime(startMin);
                          const displayEnd = minutesToTime(endMin);
                          const displayCH = calculateCH(displayStart, displayEnd);

                          return (
                            <div
                              key={session.id}
                              className={`absolute rounded-xl shadow-md border border-black/10 transition-shadow group flex flex-col justify-between overflow-hidden ${
                                isDraggingThis
                                  ? 'ring-3 ring-indigo-500 z-30 opacity-95 scale-[1.01]'
                                  : 'z-10 hover:z-20 hover:shadow-lg'
                              }`}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                top: `${topPx}px`,
                                height: `${laneHeight - 14}px`,
                                backgroundColor: bgColor,
                                color: textColor,
                              }}
                            >
                              <div
                                onPointerDown={(e) => handleHorizontalPointerDown(e, session, 'resize-start')}
                                className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 flex items-center justify-center z-30"
                              >
                                <div className="w-1 h-5 rounded-full bg-white/70" />
                              </div>

                              <div
                                onPointerDown={(e) => handleHorizontalPointerDown(e, session, 'move')}
                                className="px-3.5 py-1.5 flex-1 cursor-grab active:cursor-grabbing flex flex-col justify-between select-none"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-extrabold text-[12px] leading-tight truncate drop-shadow-xs">
                                    {session.tema}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-md px-1 py-0.5 shrink-0 text-white">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSession(session);
                                      }}
                                      className="p-1 hover:text-indigo-200"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicateSession(session);
                                      }}
                                      className="p-1 hover:text-indigo-200"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSession(session.id);
                                      }}
                                      className="p-1 hover:text-red-300"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] font-medium opacity-90 truncate">
                                  <span className="bg-black/25 px-1.5 py-0.5 rounded font-mono font-bold">
                                    {displayStart} - {displayEnd} ({displayCH})
                                  </span>
                                  <span className="truncate flex items-center gap-0.5">
                                    <User className="w-2.5 h-2.5 inline" /> {session.responsavel || 'N/A'}
                                  </span>
                                </div>
                              </div>

                              <div
                                onPointerDown={(e) => handleHorizontalPointerDown(e, session, 'resize-end')}
                                className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 flex items-center justify-center z-30"
                              >
                                <div className="w-1 h-5 rounded-full bg-white/70" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
