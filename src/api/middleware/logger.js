import pino from 'pino';
import pretty from 'pino-pretty';

const isDev = process.env.NODE_ENV !== 'production';

const logger = isDev
  ? pino({ level: process.env.LOG_LEVEL || 'info' }, pretty({ colorize: true }))
  : pino({ level: process.env.LOG_LEVEL || 'info' });

export default logger;
