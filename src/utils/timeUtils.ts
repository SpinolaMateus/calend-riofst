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
