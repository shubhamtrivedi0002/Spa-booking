const LOG_LEVELS = { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR', ACTION: 'ACTION' };

const logs = [];

function createLogEntry(level, message, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data }),
  };
  logs.push(entry);
  if (logs.length > 1000) logs.shift();
  return entry;
}

export const logger = {
  info(message, data) {
    const entry = createLogEntry(LOG_LEVELS.INFO, message, data);
    console.log(`[${entry.timestamp}] INFO: ${message}`, data || '');
  },
  warn(message, data) {
    const entry = createLogEntry(LOG_LEVELS.WARN, message, data);
    console.warn(`[${entry.timestamp}] WARN: ${message}`, data || '');
  },
  error(message, data) {
    const entry = createLogEntry(LOG_LEVELS.ERROR, message, data);
    console.error(`[${entry.timestamp}] ERROR: ${message}`, data || '');
  },
  action(message, data) {
    const entry = createLogEntry(LOG_LEVELS.ACTION, message, data);
    console.log(`[${entry.timestamp}] ACTION: ${message}`, data || '');
  },
  getLogs() {
    return [...logs];
  },
};
