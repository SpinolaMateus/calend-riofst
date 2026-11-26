import React, { useMemo, useState } from 'react';
import {
  Plus, Filter, Palette, ZoomIn, ZoomOut,
  Eye, Layers, RotateCcw, Camera, Maximize2, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  AreaDefinition,
  INTEGRATION_AUDIENCES,
  IntegrationAudience,
  IntegrationSession,
  UnitInfo,
} from '../types/schedule';
import { timeToMinutes } from '../utils/timeUtils';
import { copyElementAsImage } from '../utils/exportUtils';

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

interface PositionedBlock {
  id: string;
  sessions: IntegrationSession[];
  area: string;
  startMin: number;
  endMin: number;
  lane: number;
  totalLanes: number;
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

/**
 * Agrupa sessões sobrepostas da mesma Área (quando groupByArea=true) e distribui
 * blocos ainda conflitantes em colunas (lanes) lado a lado.
 */
function layoutOverlappingSessions(
  daySessions: IntegrationSession[],
  minBound: number,
  maxBound: number,
  groupByArea: boolean
): PositionedBlock[] {
  const valid = daySessions
    .map((session) => ({
      session,
      areaKey: (session.area || '').trim().toUpperCase(),
      startMin: Math.max(minBound, timeToMinutes(session.startTime)),
      endMin: Math.min(maxBound, timeToMinutes(session.endTime)),
    }))
    .filter((item) => item.endMin > item.startMin)
    .sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  if (valid.length === 0) return [];

  // 1. Agrupar por mesma Área + sobreposição de horário
  interface RawBlock {
    id: string;
    sessions: IntegrationSession[];
    area: string;
    areaKey: string;
    startMin: number;
    endMin: number;
  }

  const blocks: RawBlock[] = [];

  if (groupByArea) {
    for (const item of valid) {
      const existing = blocks.find(
        (b) =>
          b.areaKey === item.areaKey &&
          item.startMin < b.endMin &&
          item.endMin > b.startMin
      );
      if (existing) {
        existing.sessions.push(item.session);
        existing.startMin = Math.min(existing.startMin, item.startMin);
        existing.endMin = Math.max(existing.endMin, item.endMin);
      } else {
        blocks.push({
          id: item.session.id,
          sessions: [item.session],
          area: item.session.area,
          areaKey: item.areaKey,
          startMin: item.startMin,
          endMin: item.endMin,
        });
      }
    }
  } else {
    for (const item of valid) {
      blocks.push({
        id: item.session.id,
        sessions: [item.session],
        area: item.session.area,
        areaKey: item.areaKey,
        startMin: item.startMin,
        endMin: item.endMin,
      });
    }
  }

  blocks.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  // 2. Agrupar blocos restantes em clusters de sobreposição
  const clusters: RawBlock[][] = [];
  let currentCluster: RawBlock[] = [];
  let clusterEnd = -1;

  for (const block of blocks) {
    if (currentCluster.length === 0 || block.startMin < clusterEnd) {
      currentCluster.push(block);
      clusterEnd = Math.max(clusterEnd, block.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [block];
      clusterEnd = block.endMin;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const result: PositionedBlock[] = [];

  for (const cluster of clusters) {
    const laneEnds: number[] = [];
    const placed: { block: RawBlock; lane: number }[] = [];

    for (const block of cluster) {
      let assignedLane = laneEnds.findIndex((end) => end <= block.startMin);
      if (assignedLane === -1) {
        assignedLane = laneEnds.length;
        laneEnds.push(block.endMin);
      } else {
        laneEnds[assignedLane] = block.endMin;
      }
      placed.push({ block, lane: assignedLane });
    }

    const totalLanes = Math.max(1, laneEnds.length);
    for (const p of placed) {
      result.push({
        id: p.block.id,
        sessions: p.block.sessions,
        area: p.block.area,
        startMin: p.block.startMin,
        endMin: p.block.endMin,
        lane: p.lane,
        totalLanes,
      });
    }
  }

  return result;
}

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
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const [groupByArea, setGroupByArea] = useState<boolean>(true);
  const [hideEmptyDays, setHideEmptyDays] = useState<boolean>(false);
  const [timeStepMinutes, setTimeStepMinutes] = useState<15 | 30 | 60>(15);
  const [pixelsPerHour, setPixelsPerHour] = useState<number>(112);
  const [quickAreaSessionId, setQuickAreaSessionId] = useState<string | null>(null);
  const [isPrintingGrid, setIsPrintingGrid] = useState<boolean>(false);
  const [printToast, setPrintToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const audienceLabel =
    INTEGRATION_AUDIENCES.find((a) => a.id === selectedAudience)?.label || 'Geral';

  // Dias a exibir
  const daysToRender = useMemo(() => {
    const existingDays = Array.from(new Set(sessions.map((s) => s.dia))).sort((a, b) => a - b);
    if (selectedDay !== 'all') return [Number(selectedDay)];
    if (hideEmptyDays && existingDays.length > 0) return existingDays;
    if (existingDays.length > 0) {
      const maxDay = Math.max(...existingDays, 5);
      const fullRange: number[] = [];
      for (let d = 1; d <= maxDay; d++) {
        if (!hideEmptyDays || existingDays.includes(d)) fullRange.push(d);
      }
      return fullRange;
    }
    return [1, 2, 3, 4, 5];
  }, [sessions, selectedDay, hideEmptyDays]);

  // Limites de horário dinâmicos
  const { startMinutes, endMinutes, hourMarks, hasShortSessions } = useMemo(() => {
    let minM = 8 * 60;
    let maxM = 17 * 60 + 30;
    let shortFound = false;

    if (autoFit && sessions.length > 0) {
      const validStarts = sessions.map((s) => timeToMinutes(s.startTime)).filter((m) => m > 0);
      const validEnds = sessions.map((s) => timeToMinutes(s.endTime)).filter((m) => m > 0);
      if (validStarts.length > 0) minM = Math.floor(Math.min(...validStarts) / 60) * 60;
      if (validEnds.length > 0) maxM = Math.ceil(Math.max(...validEnds) / 30) * 30;
    }

    sessions.forEach((s) => {
      const st = timeToMinutes(s.startTime);
      const en = timeToMinutes(s.endTime);
      if (st > 0 && st < minM) minM = Math.floor(st / 60) * 60;
      if (en > maxM) maxM = Math.ceil(en / 30) * 30;
      if (en > st && en - st <= 20) shortFound = true;
    });

    const marks: number[] = [];
    for (let m = minM; m <= maxM; m += timeStepMinutes) {
      marks.push(m);
    }

    return { startMinutes: minM, endMinutes: maxM, hourMarks: marks, hasShortSessions: shortFound };
  }, [sessions, autoFit, timeStepMinutes]);

  const effectivePixelsPerHour =
    timeStepMinutes === 15
      ? Math.max(pixelsPerHour, 108)
      : autoFit && hasShortSessions
      ? Math.max(pixelsPerHour, 108)
      : pixelsPerHour;
  const totalMinutes = Math.max(60, endMinutes - startMinutes);
  const totalHeightPx = (totalMinutes / 60) * effectivePixelsPerHour;

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

  const handlePrintGridImage = async () => {
    try {
      setIsPrintingGrid(true);
      const res = await copyElementAsImage(
        'weekly-area-grid-capture',
        `grade_integracao_${selectedAudience}`
      );
      setPrintToast({
        message:
          res.method === 'clipboard'
            ? 'Tabela copiada como imagem! Cole no WhatsApp, Teams ou e-mail.'
            : 'Imagem da tabela baixada com sucesso!',
        type: 'success',
      });
    } catch (error) {
      setPrintToast({
        message: error instanceof Error ? error.message : 'Não foi possível gerar o print da tabela.',
        type: 'error',
      });
    } finally {
      setIsPrintingGrid(false);
      setTimeout(() => setPrintToast(null), 3500);
    }
  };

  return (
    <div className="space-y-4">
      {printToast && (
        <div
          data-capture-ignore
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold border ${
            printToast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {printToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{printToast.message}</span>
        </div>
      )}

      {/* Barra de Ajuste por Área e Controles (não aparece no print/imagem) */}
      <div
        data-capture-ignore
        className="no-print bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Área:
            </span>

            <button
              type="button"
              onClick={() => setSelectedAreaFilter('all')}
              className={`h-7 px-2.5 rounded-md text-xs font-semibold border transition-colors ${
                selectedAreaFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>

            {legendAreas.map((area) => {
              const clean = area.name.trim().toUpperCase();
              const isActive = selectedAreaFilter === clean;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleToggleAreaFilter(area.name)}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0 border border-black/15"
                    style={{ backgroundColor: area.bgColor }}
                  />
                  <span className="truncate max-w-[140px]">{area.name}</span>
                </button>
              );
            })}
          </div>

          {/* Controles de Auto-Ajuste, Modo, Rótulo dos Dias, Zoom e Print */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoFit((v) => !v)}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                autoFit
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Ajusta automaticamente largura, altura e blocos sobrepostos para não cortar textos"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Auto-Ajuste</span>
            </button>

            <button
              type="button"
              onClick={() => setGroupByArea((v) => !v)}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                groupByArea
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Agrupa atividades da mesma área que acontecem no mesmo horário dentro de um único bloco"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Agrupar</span>
            </button>

            <button
              type="button"
              onClick={() => setHideEmptyDays((v) => !v)}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                hideEmptyDays
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Ocultar ou exibir dias sem atividades"
            >
              {hideEmptyDays ? 'Só dias c/ aula' : 'Semana completa'}
            </button>

            {selectedAreaFilter !== 'all' && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAreaFilterMode('highlight')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
                    areaFilterMode === 'highlight'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Destacar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAreaFilterMode('filter')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
                    areaFilterMode === 'filter'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Só Área</span>
                </button>
              </div>
            )}

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setDayLabelMode('weekday')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  dayLabelMode === 'weekday'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Seg–Sex
              </button>
              <button
                type="button"
                onClick={() => setDayLabelMode('day')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  dayLabelMode === 'day'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dia 1..N
              </button>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium" title="Intervalo da régua de horários">
              {([15, 30, 60] as const).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setTimeStepMinutes(step)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    timeStepMinutes === step
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {step === 60 ? '1h' : `${step}m`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white px-2 h-8 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPixelsPerHour((p) => Math.max(72, p - 12))}
                className="p-0.5 text-slate-500 hover:text-slate-900"
                title="Diminuir altura"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-medium text-slate-600 min-w-[34px] text-center tabular-nums">
                {Math.round((effectivePixelsPerHour / 112) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPixelsPerHour((p) => Math.min(180, p + 12))}
                className="p-0.5 text-slate-500 hover:text-slate-900"
                title="Aumentar altura"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrintGridImage}
              disabled={isPrintingGrid}
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Tirar print completo desta tabela (copia e baixa PNG)"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>{isPrintingGrid ? 'Gerando Print...' : 'Print da Tabela'}</span>
            </button>

            <button
              type="button"
              onClick={() => onAddNewSession(daysToRender[0] || 1, '08:30', '09:30')}
              className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Atividade</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            Clique em um bloco para editar ou use o ícone <Palette className="w-3 h-3 text-slate-600" /> para trocar a área. Atividades no mesmo horário são separadas automaticamente.
          </span>
          {selectedAreaFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedAreaFilter('all')}
              className="text-slate-700 hover:text-slate-900 underline font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Área Principal da Grade (Alvo do Print da Tabela) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <div
          id="weekly-area-grid-capture"
          className={`bg-white p-3 sm:p-4 ${autoFit ? 'w-full' : 'min-w-max'}`}
        >
          <div className={`flex items-start gap-4 ${autoFit ? 'w-full' : ''}`}>
            {/* TABELA / GRADE SEMANAL */}
            <div
              style={autoFit ? undefined : { minWidth: `${Math.max(760, 62 + daysToRender.length * 220)}px` }}
              className="flex-1 min-w-0"
            >
              {/* Título Principal estilo planilha */}
              <div className="border-2 border-slate-900 bg-slate-200 px-3 py-1.5 text-center">
                <h2 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wide">
                  CRONOGRAMA {selectedAudience === 'geral' ? 'INTEGRAÇÃO' : audienceLabel.toUpperCase()} — {unitInfo.unitName.toUpperCase()}
                </h2>
                {selectedAreaFilter !== 'all' && (
                  <div className="text-[10px] font-bold text-slate-700 mt-0.5">
                    Área em destaque: {selectedAreaFilter}
                  </div>
                )}
              </div>

              {/* Cabeçalho dos Dias + Subcolunas (Local / Responsável) */}
              <div className="flex border-x-2 border-b-2 border-slate-900 bg-white">
                {/* Coluna Horário Header */}
                <div className="w-[54px] shrink-0 border-r-2 border-slate-900 flex items-center justify-center p-1 bg-slate-50">
                  <span className="text-[10px] font-bold italic text-slate-800">Horário</span>
                </div>

                {/* Cabeçalhos por Dia */}
                <div
                  className="flex-1 grid divide-x-2 divide-slate-900 min-w-0"
                  style={{ gridTemplateColumns: `repeat(${daysToRender.length}, minmax(0, 1fr))` }}
                >
                  {daysToRender.map((dia) => {
                    const dayTitle =
                      dayLabelMode === 'weekday'
                        ? WEEKDAY_NAMES[dia] || `Dia ${dia}`
                        : `Dia ${dia}`;
                    const defaultLoc = getDefaultLocationForDay(dia);

                    return (
                      <div key={`hdr-${dia}`} className="flex flex-col min-w-0">
                        <div className="bg-slate-100 border-b border-slate-900 py-1 px-1.5 text-center font-black text-[11px] text-slate-950 truncate">
                          {dayTitle}
                        </div>
                        <div className="grid grid-cols-10 text-[9px] sm:text-[10px] font-semibold text-slate-800 bg-white">
                          <div
                            className="col-span-7 min-w-0 border-r border-slate-900 py-1 px-1 text-center whitespace-normal break-words leading-tight"
                            title={`Local: ${defaultLoc}`}
                          >
                            Local: {defaultLoc}
                          </div>
                          <div className="col-span-3 min-w-0 py-1 px-1 text-center whitespace-normal break-words leading-tight">
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
                <div className="w-[54px] shrink-0 border-r-2 border-slate-900 relative bg-slate-50/70">
                  {hourMarks.map((mins) => {
                    const topPx = ((mins - startMinutes) / 60) * effectivePixelsPerHour;
                    const isHour = mins % 60 === 0;
                    const isHalf = mins % 60 === 30;
                    const isFirst = mins === startMinutes;
                    const isLast = mins >= endMinutes;
                    const alignClass = isFirst
                      ? 'translate-y-0 pt-0.5'
                      : isLast
                      ? '-translate-y-full pb-0.5'
                      : '-translate-y-1/2';

                    return (
                      <div
                        key={`t-${mins}`}
                        className={`absolute left-0 right-0 flex items-center justify-end pr-1 ${alignClass}`}
                        style={{ top: `${topPx}px` }}
                      >
                        <span
                          className={`tabular-nums px-0.5 ${
                            isHour
                              ? 'text-[10px] font-bold text-slate-800'
                              : isHalf
                              ? 'text-[9px] font-semibold text-slate-600'
                              : 'text-[8px] font-medium text-slate-400'
                          }`}
                        >
                          {formatMinuteLabel(mins)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Colunas dos Dias */}
                <div
                  className="flex-1 grid divide-x-2 divide-slate-900 relative min-w-0"
                  style={{ gridTemplateColumns: `repeat(${daysToRender.length}, minmax(0, 1fr))` }}
                >
                  {/* Linhas horizontais de grade conforme intervalo escolhido (15m / 30m / 1h) */}
                  <div className="absolute inset-0 pointer-events-none z-0">
                    {hourMarks.map((mins) => {
                      if (mins === startMinutes || mins >= endMinutes) return null;
                      const topPx = ((mins - startMinutes) / 60) * effectivePixelsPerHour;
                      const isHour = mins % 60 === 0;
                      const isHalf = mins % 60 === 30;
                      return (
                        <div
                          key={`grid-${mins}`}
                          className={`absolute left-0 right-0 border-t ${
                            isHour
                              ? 'border-slate-300'
                              : isHalf
                              ? 'border-slate-200'
                              : 'border-dashed border-slate-100'
                          }`}
                          style={{ top: `${topPx}px` }}
                        />
                      );
                    })}
                  </div>

                  {daysToRender.map((dia) => {
                    const allDaySessions = sessions.filter((s) => s.dia === dia);
                    const breakSessions = allDaySessions.filter(isBreakSession);
                    const regularSessions = allDaySessions.filter((s) => {
                      if (isBreakSession(s)) return false;
                      if (areaFilterMode === 'filter' && selectedAreaFilter !== 'all') {
                        return (s.area || '').trim().toUpperCase() === selectedAreaFilter;
                      }
                      return true;
                    });

                    const positionedRegular = layoutOverlappingSessions(
                      regularSessions,
                      startMinutes,
                      endMinutes,
                      groupByArea
                    );
                    const defaultLoc = getDefaultLocationForDay(dia);

                    return (
                      <div key={`col-${dia}`} className="relative h-full min-w-0">
                        {/* Divisor vertical sutil entre Tema (70%) e Responsável (30%) */}
                        <div className="absolute top-0 bottom-0 left-[70%] border-l border-slate-200/70 pointer-events-none z-0" />

                        {/* Intervalos e Almoço (faixa preta ocupando 100% da largura do dia) */}
                        {breakSessions.map((session) => {
                          const sStart = Math.max(startMinutes, timeToMinutes(session.startTime));
                          const sEnd = Math.min(endMinutes, timeToMinutes(session.endTime));
                          if (sEnd <= sStart) return null;

                          const topPx = ((sStart - startMinutes) / 60) * effectivePixelsPerHour;
                          const heightPx = Math.max(18, ((sEnd - sStart) / 60) * effectivePixelsPerHour);

                          return (
                            <div
                              key={session.id}
                              onClick={() => onEditSession(session)}
                              className="absolute left-0 right-0 z-20 bg-slate-950 text-white border-y border-slate-900 flex items-center justify-center px-1 cursor-pointer hover:bg-slate-800 transition-colors"
                              style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                              title={`${session.tema} (${session.startTime} às ${session.endTime}) — Clique para editar`}
                            >
                              <span className="text-[10px] font-bold italic tracking-wide truncate">
                                {session.tema}
                              </span>
                            </div>
                          );
                        })}

                        {/* Atividades Normais (Agrupadas por Área/Horário quando ativo + Lanes) */}
                        {positionedRegular.map((block) => {
                          const primarySession = block.sessions[0];
                          const isGrouped = block.sessions.length > 1;
                          const areaClean = (block.area || '').trim().toUpperCase();
                          const matchesArea =
                            selectedAreaFilter === 'all' || areaClean === selectedAreaFilter;

                          const topPx = ((block.startMin - startMinutes) / 60) * effectivePixelsPerHour;
                          const rawHeightPx = ((block.endMin - block.startMin) / 60) * effectivePixelsPerHour;
                          const heightPx = Math.max(22, rawHeightPx);

                          const widthPct = 100 / block.totalLanes;
                          const leftPct = block.lane * widthPct;

                          const bgColor = getAreaColor(block.area, primarySession.customColor);
                          const textColor = getAreaTextColor(block.area);
                          const isDimmed =
                            areaFilterMode === 'highlight' &&
                            selectedAreaFilter !== 'all' &&
                            !matchesArea;

                          const showCustomLoc =
                            !isGrouped &&
                            primarySession.local &&
                            primarySession.local !== 'N/A' &&
                            primarySession.local.trim().toUpperCase() !== defaultLoc.trim().toUpperCase();

                          const isCompact = block.totalLanes > 1 || heightPx < 36 || (isGrouped && block.sessions.length >= 3);
                          const themeLength = isGrouped
                            ? block.sessions.reduce((acc, s) => acc + (s.tema || '').length, 0)
                            : (primarySession.tema || '').length;
                          const isDenseText = themeLength > 45 || (isGrouped && heightPx / block.sessions.length < 24);

                          // Responsáveis únicos no grupo
                          const uniqueResponsibles = Array.from(
                            new Set(block.sessions.map((s) => (s.responsavel || '').trim()).filter(Boolean))
                          );

                          return (
                            <div
                              key={block.id}
                              className={`absolute z-10 grid grid-cols-10 group transition-opacity ${
                                isDimmed ? 'opacity-20' : 'opacity-100'
                              }`}
                              style={{
                                top: `${topPx}px`,
                                minHeight: `${heightPx}px`,
                                height: autoFit ? 'auto' : `${heightPx}px`,
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                              }}
                            >
                              {/* Subcoluna Tema (colorida pela Área) */}
                              {isGrouped ? (
                                <div
                                  className="col-span-7 min-w-0 border border-slate-900 flex flex-col justify-center relative"
                                  style={{ backgroundColor: bgColor, color: textColor }}
                                >
                                  <div className="flex flex-col divide-y divide-black/15 w-full h-full justify-center">
                                    {block.sessions.map((s) => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => onEditSession(s)}
                                        className="w-full min-w-0 px-1.5 py-0.5 text-center hover:bg-black/10 transition-colors flex-1 flex items-center justify-center"
                                        title={`${s.tema}\nÁrea: ${s.area}\nHorário: ${s.startTime} às ${s.endTime}\nResponsável: ${s.responsavel || '—'}\nClique para editar`}
                                      >
                                        <span
                                          className={`w-full whitespace-normal break-words [overflow-wrap:anywhere] font-bold ${
                                            isDenseText ? 'text-[8px] leading-[1.1]' : 'text-[9px] sm:text-[10px] leading-tight'
                                          }`}
                                        >
                                          {s.tema}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => onEditSession(primarySession)}
                                  className="col-span-7 min-w-0 border border-slate-900 px-1 py-0.5 flex flex-col items-center justify-center text-center cursor-pointer relative hover:brightness-95 transition-all"
                                  style={{ backgroundColor: bgColor, color: textColor }}
                                  title={`${primarySession.tema}\nÁrea: ${primarySession.area}\nHorário: ${primarySession.startTime} às ${primarySession.endTime}\nLocal: ${primarySession.local}\nClique para editar`}
                                >
                                  <span
                                    className={`w-full whitespace-normal break-words [overflow-wrap:anywhere] font-bold ${
                                      isDenseText || isCompact
                                        ? 'text-[8.5px] leading-[1.1]'
                                        : 'text-[10px] leading-tight'
                                    }`}
                                  >
                                    {primarySession.tema}
                                  </span>
                                  {showCustomLoc && heightPx >= 40 && block.totalLanes === 1 && (
                                    <span className="w-full text-[8px] opacity-85 font-medium whitespace-normal break-words leading-tight mt-0.5">
                                      ({primarySession.local})
                                    </span>
                                  )}

                                  {/* Botão rápido de troca de Área */}
                                  <button
                                    type="button"
                                    data-capture-ignore
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickAreaSessionId(
                                        quickAreaSessionId === primarySession.id ? null : primarySession.id
                                      );
                                    }}
                                    className="no-print absolute top-0.5 right-0.5 p-0.5 rounded bg-black/25 hover:bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Ajustar Área rapidamente"
                                  >
                                    <Palette className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}

                              {/* Subcoluna Responsável */}
                              <div
                                onClick={() => onEditSession(primarySession)}
                                className="col-span-3 min-w-0 border-y border-r border-slate-900 bg-white text-slate-900 px-1 py-0.5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
                                title={`Responsável: ${uniqueResponsibles.join(', ') || 'A definir'} — Clique para editar`}
                              >
                                {isGrouped && uniqueResponsibles.length > 1 ? (
                                  <div className="flex flex-col divide-y divide-slate-200 w-full h-full justify-center">
                                    {block.sessions.map((s) => (
                                      <div
                                        key={`resp-${s.id}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditSession(s);
                                        }}
                                        className="flex-1 min-w-0 flex items-center justify-center px-0.5 py-0.5 hover:bg-slate-100"
                                      >
                                        <span className="w-full whitespace-normal break-words [overflow-wrap:anywhere] text-[8px] sm:text-[9px] font-semibold leading-[1.1]">
                                          {s.responsavel || '—'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span
                                    className={`w-full whitespace-normal break-words [overflow-wrap:anywhere] font-semibold ${
                                      isCompact || isDenseText ? 'text-[8px] leading-[1.1]' : 'text-[9px] leading-tight'
                                    }`}
                                  >
                                    {uniqueResponsibles[0] || '—'}
                                  </span>
                                )}
                              </div>

                              {/* Popover rápido para trocar a Área */}
                              {!isGrouped && quickAreaSessionId === primarySession.id && (
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
                                      onClick={() => handleQuickAreaChange(primarySession, a.name)}
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
            <div className="w-36 sm:w-40 shrink-0 pt-1">
              <div className="text-[11px] font-bold italic text-slate-800 mb-1.5 pl-0.5">
                Legenda
              </div>
              <div className="border border-slate-900 divide-y divide-slate-800 bg-white">
                {legendAreas.map((area) => {
                  const clean = area.name.trim().toUpperCase();
                  const isSelected = selectedAreaFilter === clean;
                  return (
                    <button
                      key={`leg-${area.id}`}
                      type="button"
                      onClick={() => handleToggleAreaFilter(area.name)}
                      className={`w-full grid grid-cols-12 text-left transition-colors hover:bg-slate-50 ${
                        isSelected ? 'ring-2 ring-inset ring-slate-900 bg-slate-100' : ''
                      }`}
                      title="Clique para filtrar/destacar esta área na grade"
                    >
                      <div
                        className="col-span-4 border-r border-slate-800 min-h-[20px]"
                        style={{ backgroundColor: area.bgColor }}
                      />
                      <div className="col-span-8 min-w-0 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-900 flex items-center whitespace-normal break-words leading-tight">
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
    </div>
  );
};
