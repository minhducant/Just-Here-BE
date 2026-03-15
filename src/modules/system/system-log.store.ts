export type SystemLogLevel =
  | 'LOG'
  | 'ERROR'
  | 'WARN'
  | 'DEBUG'
  | 'VERBOSE'
  | 'FATAL';

export interface SystemLogEntry {
  timestamp: string;
  level: SystemLogLevel;
  context: string;
  message: string;
}

const MAX_SYSTEM_LOGS = 1500;
const systemLogs: SystemLogEntry[] = [];

export const appendSystemLog = (entry: Omit<SystemLogEntry, 'timestamp'>): void => {
  systemLogs.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });

  if (systemLogs.length > MAX_SYSTEM_LOGS) {
    systemLogs.splice(0, systemLogs.length - MAX_SYSTEM_LOGS);
  }
};

export const readSystemLogs = (limit = 200): SystemLogEntry[] => {
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(Math.floor(limit), MAX_SYSTEM_LOGS))
    : 200;
  return systemLogs.slice(-normalizedLimit).reverse();
};

export const getSystemLogsCount = (): number => systemLogs.length;
