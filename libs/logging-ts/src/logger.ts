import voca from 'voca';

import { LogRecordData } from './record';
import { getLoggableError, redact, stringify } from './redact';

/**
 * LogLevel correlates to the console methods we use.
 *
 * The reverse mapping TypeScript creates is used to add the level labels to log messages, which is
 * why they're all caps.
 */
export enum LogLevel {
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

/**
 * The foundation of all loggers! The root of a mighty tree!
 *
 * Kidding. We log JSON to the console. But maybe.
 */
export interface Logger {
  configuration: LoggerConfiguration;

  log(level: LogLevel, message: string, data?: LogRecordData): void;

  debug(message: string, data?: LogRecordData): void;
  error(message: string, data?: LogRecordData): void;
  info(message: string, data?: LogRecordData): void;
  warn(message: string, data?: LogRecordData): void;
}

export class FormatOptions {
  level: LogLevel = LogLevel.DEBUG;
  message = '';
  metadata: LogRecordData = {};
  recordData: LogRecordData = {};
}

/**
 * Allows for theoretical flexibility in how we format log messages.
 */
export interface Formatter {
  // Produces a string ready to be written to the log.
  format(options: FormatOptions): string;
}

/**
 * Formats log messages as JSON, redacting any sensitive data.
 */
export class SafeJSONFormatter implements Formatter {
  format(options: FormatOptions): string {
    try {
      const redactedMetadata = redact(options.metadata);
      const redactedRecordData = redact(options.recordData);
      return stringify({
        level: LogLevel[options.level],
        message: options.message,
        metadata: redactedMetadata,
        recordData: redactedRecordData,
      }) as string;
    } catch (e) {
      return stringify({
        level: LogLevel[options.level],
        message: 'Redaction of this message failed',
        metadata: {
          errorMessage: getLoggableError(e),
        },
      }) as string;
    }
  }
}

/**
 * Things you can control when constructing a logger.
 *
 * The formatter controls the final presentation of log messages.
 *
 * The level controls which log messages will actually be handled.
 *
 * The metadata will be logged with the data supplied with each log message, so this is where you
 * can set things like a service name to mark all logging from that code.
 */
export interface LoggerConfiguration {
  formatter: Formatter;
  metadata?: LogRecordData;
  level?: LogLevel;
}

/**
 * Base class implementing logic that should be common to most loggers.
 */
export abstract class BaseLogger implements Logger {
  public configuration: LoggerConfiguration;

  constructor(configuration: LoggerConfiguration) {
    this.configuration = configuration;
    this.configuration.metadata ||= {};
    const envLevel = voca.upperCase(
      process.env.LOGLEVEL || process.env.LOG_LEVEL,
    ) as keyof typeof LogLevel; // :^|
    this.configuration.level ||= LogLevel[envLevel] || LogLevel.INFO;
  }

  /**
   * Write the log message to the destination.
   */
  private write(level: LogLevel, message: string) {
    if (level === LogLevel.ERROR) {
      console.error(message);
    } else if (level === LogLevel.WARN) {
      console.warn(message);
    } else if (level === LogLevel.DEBUG) {
      console.debug(message);
    } else {
      console.log(message);
    }
  }

  debug(message: string, recordData: LogRecordData = {}): void {
    this.log(LogLevel.DEBUG, message, recordData);
  }

  error(message: string, recordData: LogRecordData = {}): void {
    this.log(LogLevel.ERROR, message, recordData);
  }

  info(message: string, recordData: LogRecordData = {}): void {
    this.log(LogLevel.INFO, message, recordData);
  }

  /**
   * Finalize data, format the message, and write it to its destination.
   */
  log(level: LogLevel, message: string, recordData: LogRecordData = {}): void {
    if (this.configuration.level !== undefined && level < this.configuration.level) {
      return;
    }
    const formattedMessage = this.configuration.formatter.format({
      level,
      message,
      metadata: this.configuration.metadata || {},
      recordData,
    });
    this.write(level, formattedMessage);
  }

  warn(message: string, recordData: LogRecordData = {}): void {
    this.log(LogLevel.WARN, message, recordData);
  }
}

/**
 * Redacts data and formats the log message as JSON.
 */
export class SafeJSONLogger extends BaseLogger {
  constructor(configuration: Omit<LoggerConfiguration, 'formatter'>) {
    super({ formatter: new SafeJSONFormatter(), ...configuration });
  }
}

export interface Timer extends Logger {
  elapsedTime(): number;
}

/**
 * Logs JSON messages with the time since the timer was created.
 */
export class Timer extends SafeJSONLogger {
  private _startTime: number;

  constructor(configuration: Omit<LoggerConfiguration, 'formatter'>) {
    super(configuration);
    this._startTime = Date.now();
  }

  public startTime(): number {
    return this._startTime;
  }

  public elapsedTime(): number {
    return Date.now() - this.startTime();
  }

  log(level: LogLevel, message: string, recordData: LogRecordData = {}): void {
    super.log(level, message, { ...(recordData || {}), durationMs: this.elapsedTime() });
  }
}

/**
 * Creates a default logger, with data redaction and JSON output.
 *
 * Does not allow specification of the formatter, for obvious reasons.
 */
export function getLogger(configuration: Omit<LoggerConfiguration, 'formatter'>): Logger {
  return new SafeJSONLogger(configuration);
}
