import axios, { AxiosResponse } from 'axios';

import { Logger } from './logger';
import { getLoggableError, stringify } from './redact';
import { LogLevel } from './logger';

export interface AxiosLogOptions {
  logger: Logger;
  level?: LogLevel;
  message: string;
  logResponseData?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AxiosErrorLogOptions extends AxiosLogOptions {
  error: unknown;
}

export interface AxiosResponseLogOptions extends AxiosLogOptions {
  response: AxiosResponse;
}

/**
 * Logs a potential Axios error, optionally including the response data or any supplied metadata.
 *
 * If the error is not an AxiosError, it will still be logged, along with the metadata, using
 * getLoggableError.
 */
export function logAxiosError({
  logger,
  level = LogLevel.ERROR,
  message,
  logResponseData = false,
  metadata = {},
  error,
}: AxiosErrorLogOptions) {
  // The response data might be a Buffer, depending on the request responseType, and stringify can
  // produce a less-than-readable rendition of Buffers. This is a delightfully empirical flail at
  // rationalizing some responses I've gotten from third-party services.
  let responseData: string | null = null;
  if (logResponseData) {
    if (axios.isAxiosError(error) && error.response?.data) {
      if (Buffer.isBuffer(error.response.data)) {
        responseData = String(error.response.data);
      } else {
        responseData = stringify(error.response.data) || null;
      }
    }
  }

  logger.log(level, message, {
    ...metadata,
    responseData: responseData,
    error: error,
    errorJSON: axios.isAxiosError(error) ? error.toJSON() : null,
    statusCode: axios.isAxiosError(error) ? error.response?.status : null,
    statusText: axios.isAxiosError(error) ? error.response?.statusText : null,
    originalErrorMessage: getLoggableError(error),
  });
}

/**
 * Logs an Axios response with less noise.
 */
export function logAxiosResponse({
  logger,
  level = LogLevel.INFO,
  message,
  logResponseData = false,
  metadata = {},
  response,
}: AxiosResponseLogOptions) {
  logger.log(level, message, {
    ...metadata,
    data: logResponseData ? response.data : '[NOT LOGGED]',
    config: response.config,
    headers: response.headers,
    statusCode: response.status,
    statusText: response.statusText,
  });
}
