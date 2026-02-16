/**
 * Shared Logger Utility
 * Structured JSON logging for production, pretty logging for development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function log(level: LogLevel, msg: string, data?: unknown): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: msg,
    ...(data !== undefined && { data }),
  };

  if (process.env.NODE_ENV === 'production') {
    // Structured JSON logging for production (parseable by log aggregators)
    const consoleFn = level === 'debug' ? 'log' : level;
    console[consoleFn](JSON.stringify(entry));
  } else {
    // Pretty logging for development
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const consoleFn = level === 'debug' ? 'log' : level;
    console[consoleFn](
      `${colors[level]}[${level.toUpperCase()}]${reset} ${msg}`,
      data !== undefined ? data : ''
    );
  }
}

export const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
};

export default logger;
