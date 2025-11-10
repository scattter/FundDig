import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// File transport (JSON) for long-term storage
const fileTransport = new (winston.transports as any).DailyRotateFile({
  dirname: 'logs',
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  zippedArchive: false,
});

// Human-friendly console format: [time] [level] [context] message {meta}
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const m = meta as Record<string, any>;
    const context = m?.context || (m?.message && m.message.context) || '';
    if (m && 'context' in m) delete m.context;
    const rest = Object.keys(m).length ? JSON.stringify(m) : '';
    return `[${timestamp}] ${level} ${context ? `[${context}]` : ''} ${message} ${rest}`.trim();
  }),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // file transport uses JSON format for structured logs
    fileTransport,
    // console transport uses friendly colored output
    new winston.transports.Console({ format: consoleFormat }),
  ],
});

export class Logger implements LoggerService {
  log(message: any, context?: string) {
    logger.info(String(message), { context });
  }
  error(message: any, trace?: string, context?: string) {
    const payload: any = { context };
    if (trace) payload.trace = trace;
    logger.error(String(message), payload);
  }
  warn(message: any, context?: string) {
    logger.warn(String(message), { context });
  }
  debug(message: any, context?: string) {
    logger.debug(String(message), { context });
  }
  verbose(message: any, context?: string) {
    logger.verbose(String(message), { context });
  }
}
