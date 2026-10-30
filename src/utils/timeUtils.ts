export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().replace('h', ':');
  const parts = clean.split(':').map((p) => parseInt(p, 10) || 0);
  const hours = parts[0] || 0;
  const mins = parts[1] || 0;
  return hours * 60 + mins;
}

export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function calculateCH(startTime: string, endTime: string): string {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const diff = Math.max(0, endMins - startMins);

  if (diff === 0) return '0min';

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h${mins < 10 ? '0' : ''}${mins}`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}min`;
  }
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} às ${endTime}`;
}

export function snapMinutes(minutes: number, step = 15): number {
  return Math.round(minutes / step) * step;
}

/**
 * Parses time expressions such as "08:15 às 10:00", "08:15-10:00", "8:15 as 10", "08h15 às 10h00".
 */
export function parseTimeRange(input: string): { startTime: string; endTime: string } | null {
  if (!input) return null;
  const clean = input.trim();

  // Match times with colon or 'h' (e.g. 08:15, 8h15, 10:00, 10h)
  const timeRegex = /\b(\d{1,2})(?:[:hH](\d{2})?|h\b)/g;
  const matches = [...clean.matchAll(timeRegex)];

  if (matches.length >= 2) {
    const formatMatch = (m: RegExpMatchArray) => {
      const h = String(parseInt(m[1], 10)).padStart(2, '0');
      const min = String(parseInt(m[2] || '0', 10)).padStart(2, '0');
      return `${h}:${min}`;
    };

    const start = formatMatch(matches[0]);
    const end = formatMatch(matches[1]);
    return { startTime: start, endTime: end };
  }

  // Fallback: split by common range separators
  const parts = clean.split(/às|as|até|ate|–|-|\/|a\b/i).map((p) => p.trim());
  if (parts.length >= 2) {
    const parseSingle = (str: string) => {
      const m = str.match(/(\d{1,2})[:hH](\d{2})?/i);
      if (m) {
        const h = String(parseInt(m[1], 10)).padStart(2, '0');
        const min = String(parseInt(m[2] || '0', 10)).padStart(2, '0');
        return `${h}:${min}`;
      }
      const rawHour = parseInt(str, 10);
      if (!isNaN(rawHour) && rawHour >= 0 && rawHour <= 23) {
        return `${String(rawHour).padStart(2, '0')}:00`;
      }
      return null;
    };

    const s = parseSingle(parts[0]);
    const e = parseSingle(parts[1]);
    if (s && e) {
      return { startTime: s, endTime: e };
    }
  }

  return null;
}

/**
 * Converts a CH string (e.g. "1h45", "1h", "20min", "1h 20min") to total minutes.
 */
export function chToMinutes(chStr: string): number {
  if (!chStr) return 0;
  const clean = chStr.toLowerCase().trim();
  let totalMinutes = 0;

  const hoursMatch = clean.match(/(\d+)\s*h(?:oras?)?/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }

  const minsMatch = clean.match(/(\d+)\s*(?:min|m\b|minutos?)/) || clean.match(/h\s*(\d{1,2})\b/);
  if (minsMatch) {
    totalMinutes += parseInt(minsMatch[1], 10);
  }

  if (!hoursMatch && !minsMatch) {
    const num = parseInt(clean, 10);
    if (!isNaN(num)) return num;
  }

  return totalMinutes;
}

/**
 * Synchronizes startTime, endTime, horarioText, and CH so they are always 100% mathematically consistent.
 */
export function syncSessionTimeAndCH<T extends { startTime: string; endTime: string; horarioText?: string; ch: string }>(
  session: T
): T {
  let startTime = session.startTime || '08:00';
  let endTime = session.endTime || '09:00';

  if (session.horarioText) {
    const parsed = parseTimeRange(session.horarioText);
    if (parsed) {
      startTime = parsed.startTime;
      endTime = parsed.endTime;
    }
  }

  const startMins = timeToMinutes(startTime);
  let endMins = timeToMinutes(endTime);

  if (endMins <= startMins) {
    endMins = startMins + 60;
    endTime = minutesToTime(endMins);
  }

  const horarioText = formatTimeRange(startTime, endTime);
  const ch = calculateCH(startTime, endTime);

  return {
    ...session,
    startTime,
    endTime,
    horarioText,
    ch,
  };
}

export function isSessionCurrent(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return currentMinutes >= start && currentMinutes <= end;
}

export function isSessionUpcoming(startTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  return start > currentMinutes;
}

/**
 * Ordena sessões rigorosamente por Dia crescente e depois por Horário de Início (startMins).
 * Isso garante que nenhuma atividade fique espalhada ou fora de ordem cronológica.
 */
export function sortSessionsByDayAndTime<T extends { dia: number; startTime: string; endTime?: string; id?: string }>(
  sessionsList: T[]
): T[] {
  return [...sessionsList].sort((a, b) => {
    // 1º critério: Dia (Dia 1 antes de Dia 2, Dia 2 antes de Dia 3...)
    if (a.dia !== b.dia) {
      return a.dia - b.dia;
    }
    // 2º critério: Horário de Início em minutos
    const aStart = timeToMinutes(a.startTime);
    const bStart = timeToMinutes(b.startTime);
    if (aStart !== bStart) {
      return aStart - bStart;
    }
    // 3º critério: Horário de Fim (se houver empate de início)
    const aEnd = timeToMinutes(a.endTime || '');
    const bEnd = timeToMinutes(b.endTime || '');
    return aEnd - bEnd;
  });
}
