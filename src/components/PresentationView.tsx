import React, { useState, useEffect } from 'react';
import { 
  Clock, MapPin, User, CheckCircle2, 
  Maximize2, Minimize2, Sparkles, AlertCircle, FileCheck, Building2
} from 'lucide-react';
import { AreaDefinition, IntegrationSession, UnitInfo } from '../types/schedule';
import { isSessionCurrent, isSessionUpcoming, timeToMinutes } from '../utils/timeUtils';

interface PresentationViewProps {
  sessions: IntegrationSession[];
  areas: AreaDefinition[];
  unitInfo: UnitInfo;
  selectedDay: number | 'all';
  onEditSession: (session: IntegrationSession) => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  sessions,
  areas,
  unitInfo,
  selectedDay,
  onEditSession,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('light');

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getAreaDef = (areaName: string) => {
    return areas.find((a) => a.name.toLowerCase() === areaName.toLowerCase());
  };

  // Days list
  const days = selectedDay === 'all'
    ? Array.from(new Set(sessions.map((s) => s.dia))).sort((a, b) => a - b)
    : [Number(selectedDay)];

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="presentation-container"
      className={`rounded-2xl transition-all p-6 sm:p-8 ${
        themeMode === 'dark'
          ? 'bg-slate-950 text-white border border-slate-800'
          : 'bg-white text-slate-900 border border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Top Bar for Display */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200/60 dark:border-slate-800 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400">
              PROGRAMA DE INTEGRAÇÃO
            </span>
            <span className="text-xs text-slate-500 font-medium capitalize">
              • {formattedDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {unitInfo.unitName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unitInfo.cohortName} — {unitInfo.period}
          </p>
        </div>

        {/* Live Clock & Display Controls */}
        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <div className="text-right">
              <div className="font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formattedTime}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">
                Horário de Brasília
              </div>
            </div>
          </div>

          <div className="no-print flex items-center gap-2">
            <button
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              title="Alternar tema claro / escuro"
            >
              {themeMode === 'dark' ? '☀️ Claro' : '🌙 TV / Escuro'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
              title="Tela cheia"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Days Content */}
      <div className="mt-8 space-y-10">
        {days.map((dayNum) => {
          const daySessions = sessions
            .filter((s) => s.dia === dayNum)
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

          // Find current and upcoming sessions
          const currentSession = daySessions.find((s) => isSessionCurrent(s.startTime, s.endTime));
          const upcomingSession = daySessions.find((s) => isSessionUpcoming(s.startTime));

          return (
            <div key={dayNum} className="space-y-4">
              {/* Day Section Header */}
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                    {dayNum}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      Cronograma do DIA {dayNum}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total de {daySessions.length} tópicos e alinhamentos práticos
                    </p>
                  </div>
                </div>

                {currentSession && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Atividade em curso: {currentSession.tema}
                  </div>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {daySessions.map((s) => {
                  const areaDef = getAreaDef(s.area);
                  const isCurrent = isSessionCurrent(s.startTime, s.endTime);
                  const isLunch = s.tema.toLowerCase().includes('almoço');
                  const bgColor = s.customColor || areaDef?.bgColor || '#64748b';
                  const textColor = areaDef?.textColor || '#ffffff';

                  return (
                    <div
                      key={s.id}
                      onClick={() => onEditSession(s)}
                      className={`relative rounded-2xl p-4 transition-all cursor-pointer border ${
                        isCurrent
                          ? 'ring-2 ring-indigo-500 shadow-xl bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300'
                          : themeMode === 'dark'
                          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {/* Top Time and Area */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {s.horarioText || `${s.startTime} às ${s.endTime}`}
                        </span>

                        <span
                          className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider truncate max-w-[130px]"
                          style={{
                            backgroundColor: bgColor,
                            color: textColor,
                          }}
                        >
                          {s.area}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className={`font-bold text-base leading-snug mb-2 ${isLunch ? 'text-slate-900 dark:text-white font-black' : ''}`}>
                        {s.tema}
                      </h3>

                      {/* CH badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          Duração: {s.ch}
                        </span>
                        {s.codigo && s.codigo !== 'N/A' && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            Cód: {s.codigo}
                          </span>
                        )}
                      </div>

                      {/* Instructor, Room & Deliverables */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                        {s.responsavel && s.responsavel !== 'N/A' && (
                          <div className="flex items-center gap-2 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              <strong>Facilitador:</strong> {s.responsavel}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            <strong>Local:</strong> {s.local || 'Sala de Integração'}
                          </span>
                        </div>

                        {s.entregavel && s.entregavel !== 'N/A' && (
                          <div className="flex items-center gap-2 truncate text-indigo-600 dark:text-indigo-400 font-medium">
                            <FileCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              <strong>Entregável:</strong> {s.entregavel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info for Divulgação */}
      <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>
            {unitInfo.companyName} • {unitInfo.locationDefault}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Dúvidas ou suporte: <strong>{unitInfo.contactPerson}</strong></span>
        </div>
      </div>
    </div>
  );
};
