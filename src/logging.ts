const LOGS_KEY = 'desert-boy:logs';
const LOG_LIMIT = 500;

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

const loadLogs = (): string[] => {
  const raw = localStorage.getItem(LOGS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

let logs = loadLogs();
let renderLogsHandler: (() => void) | null = null;

const saveLogs = (): void => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(-LOG_LIMIT)));
};

const nowIso = (): string => new Date().toISOString();

export const registerLogRenderer = (render: () => void): void => {
  renderLogsHandler = render;
};

export const getLogs = (): string[] => logs;

export const clearLogs = (): void => {
  logs = [];
  saveLogs();
  renderLogsHandler?.();
};

export const writeLog = (level: LogLevel, message: string): void => {
  logs.push(`[${nowIso()}] [${level}] ${message}`);
  if (logs.length > LOG_LIMIT) {
    logs = logs.slice(-LOG_LIMIT);
  }
  saveLogs();
  renderLogsHandler?.();
};
