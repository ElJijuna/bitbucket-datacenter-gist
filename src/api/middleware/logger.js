import pino from 'pino';
import pretty from 'pino-pretty';
import { logEmitter } from '../../services/log-emitter.js';

const isDev = process.env.NODE_ENV !== 'production';

const logger = isDev
  ? pino({ level: process.env.LOG_LEVEL || 'info' }, pretty({ colorize: true }))
  : pino({ level: process.env.LOG_LEVEL || 'info' });

for (const level of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
  const orig = logger[level].bind(logger);
  logger[level] = (...args) => {
    const message = typeof args[0] === 'string'
      ? args[0]
      : (args[1] ?? args[0]?.err?.message ?? JSON.stringify(args[0]));
    logEmitter.emit('log', { level, message, timestamp: new Date().toISOString() });
    return orig(...args);
  };
}

export default logger;
