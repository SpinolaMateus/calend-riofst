/**
 * Biblioteca de Resiliência de Erros e Telemetria
 * Intercepta exceções globais e rejeições de promises não tratadas para evitar telas brancas
 */

interface ErrorLogEntry {
  id: string;
  timestamp: string;
  type: 'error' | 'unhandledrejection' | 'network' | 'custom';
  message: string;
  source?: string;
  stack?: string;
}

const MAX_LOGS = 20;
const STORAGE_KEY = 'app_error_resilience_logs_v1';

export function getResilienceLogs(): ErrorLogEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logSystemError(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>) {
  try {
    const logs = getResilienceLogs();
    const newEntry: ErrorLogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...logs].slice(0, MAX_LOGS);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Falha silenciosa
  }
}

/**
 * Inicializa os interceptores globais de erro no navegador
 */
export function initResilienceGuard() {
  if (typeof window === 'undefined') return;

  // Evita registrar múltiplos listeners
  if ((window as any).__RESILIENCE_GUARD_INITIALIZED__) return;
  (window as any).__RESILIENCE_GUARD_INITIALIZED__ = true;

  window.addEventListener('error', (event) => {
    console.warn('[ResilienceGuard] Erro global capturado:', event.message);
    logSystemError({
      type: 'error',
      message: event.message || 'Erro de execução desconhecido',
      source: `${event.filename || ''}:${event.lineno || 0}:${event.colno || 0}`,
      stack: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[ResilienceGuard] Promessa rejeitada não tratada:', event.reason);
    logSystemError({
      type: 'unhandledrejection',
      message: typeof event.reason === 'object' && event.reason?.message 
        ? event.reason.message 
        : String(event.reason || 'Rejeição assíncrona'),
      stack: event.reason?.stack,
    });
  });
}

