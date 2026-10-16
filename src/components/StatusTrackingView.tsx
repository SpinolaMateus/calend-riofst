import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Clock3, Search, RotateCcw } from 'lucide-react';
import { IntegrationSession } from '../types/schedule';
import { formatTimeRange } from '../utils/timeUtils';

type StatusFilter = 'all' | 'pending' | 'done';

interface StatusTrackingViewProps {
  sessions: IntegrationSession[];
  selectedDay: number | 'all';
  isSyncReady: boolean;
  syncMessage: string;
  onToggleStatus: (session: IntegrationSession, isCompleted: boolean) => Promise<void>;
}

export const StatusTrackingView: React.FC<StatusTrackingViewProps> = ({
  sessions,
  selectedDay,
  isSyncReady,
  syncMessage,
  onToggleStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(() => new Set());

  const daySessions = useMemo(() => sessions.filter(
    (session) => selectedDay === 'all' || session.dia === selectedDay,
  ), [selectedDay, sessions]);

  const counts = useMemo(() => daySessions.reduce(
    (result, session) => {
      if (session.isCompleted) result.done += 1;
      else result.pending += 1;
      return result;
    },
    { done: 0, pending: 0 },
  ), [daySessions]);

  const filteredSessions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    return daySessions.filter((session) => {
      if (statusFilter === 'done' && !session.isCompleted) return false;
      if (statusFilter === 'pending' && session.isCompleted) return false;
      if (!normalizedQuery) return true;
      return [
        session.tema,
        session.area,
        session.responsavel,
        session.local,
        String(session.dia),
      ].some((value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR').includes(normalizedQuery));
    });
  }, [daySessions, searchQuery, statusFilter]);

  const toggleStatus = async (session: IntegrationSession) => {
    if (updatingIds.has(session.id)) return;
    setUpdatingIds((current) => new Set(current).add(session.id));
    try {
      await onToggleStatus(session, !session.isCompleted);
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(session.id);
        return next;
      });
    }
  };

  const statusFilters: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Todas', count: daySessions.length },
    { value: 'pending', label: 'Pendentes', count: counts.pending },
    { value: 'done', label: 'Concluídas', count: counts.done },
  ];

  return (
    <section className="space-y-4" aria-labelledby="status-tracking-title">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="status-tracking-title" className="text-lg font-black text-slate-900">
            Acompanhamento de atividades
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Marque o que já foi realizado e acompanhe as pendências. Os status são compartilhados com a equipe.
          </p>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar atividade..."
            aria-label="Buscar atividade por tema, área ou responsável"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </header>

      {!isSyncReady && syncMessage && (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {syncMessage}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Clock3 size={20} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Pendentes</p>
            <p className="text-2xl font-black text-amber-950">{counts.pending}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Concluídas</p>
            <p className="text-2xl font-black text-emerald-950">{counts.done}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar atividades por status">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                statusFilter === filter.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
              }`}
            >
              {filter.label} <span className="ml-1 opacity-75">{filter.count}</span>
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-slate-500">
          {selectedDay === 'all' ? 'Todos os dias' : `Dia ${selectedDay}`} · {filteredSessions.length} atividade(s)
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
              <tr>
                <th scope="col" className="px-4 py-3">Dia / Horário</th>
                <th scope="col" className="px-4 py-3">Atividade / Área</th>
                <th scope="col" className="px-4 py-3">Responsável</th>
                <th scope="col" className="px-4 py-3">Local</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((session) => {
                const isCompleted = Boolean(session.isCompleted);
                const isUpdating = updatingIds.has(session.id);
                return (
                  <tr key={session.id} className={isCompleted ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <span className="block font-bold text-slate-800">Dia {session.dia}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {session.horarioText || formatTimeRange(session.startTime, session.endTime)}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3 align-top">
                      <span className="block font-bold text-slate-900">{session.tema}</span>
                      <span className="mt-1 inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
                        {session.area || 'Área não informada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">{session.responsavel || 'Não informado'}</td>
                    <td className="px-4 py-3 align-top text-slate-700">{session.local || 'Não informado'}</td>
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        disabled={isUpdating}
                        aria-label={isCompleted
                          ? `Marcar ${session.tema} como pendente`
                          : `Marcar ${session.tema} como feito`}
                        aria-pressed={isCompleted}
                        onClick={() => { void toggleStatus(session); }}
                        className={`inline-flex min-w-32 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                          isCompleted
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        {isCompleted ? <Check size={15} /> : <RotateCcw size={14} />}
                        {isUpdating ? 'Salvando...' : isCompleted ? 'Feito' : 'Marcar feito'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filteredSessions.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    Nenhuma atividade corresponde aos filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
