import { ShutterstockAPIConfiguration } from './configuration';

export enum ShutterstockLicense {
  Commercial = 'commercial',
  Editorial = 'editorial',
}

export interface ShutterstockPrice {
  local_amount: number;
  local_currency: string;
}

export enum ShutterstockView {
  Full = 'full',
  Minimal = 'minimal',
}

/**
 * Build a Shutterstock API URL with the given path and API_BASE_URL.
 */
export function buildShutterstockAPIURL(
  path: string,
  configuration?: ShutterstockAPIConfiguration,
): URL {
  const baseURL = configuration?.baseURL || 'https://api.shutterstock.com';
  return new URL(path, baseURL);
}
