import { getLoggableError, getLogger } from 'libs/logging-ts';

export interface Secret {
  verify(value: string): boolean;
}

function isArrayOfStrings(value: any): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export class MultiValueSecret implements Secret {
  values: string[];

  constructor(secret: string) {
    const logger = getLogger({ metadata: { service: 'MultiValueSecret' } });

    let parsedSecret;
    // try to parse the given string as JSON, and extract an array of strings.
    try {
      parsedSecret = JSON.parse(secret);
      if (isArrayOfStrings(parsedSecret)) {
        this.values = parsedSecret;
      } else {
        throw new Error('Secret input must be a JSON array of strings.');
      }
    } catch (e) {
      throw new Error(`Could not construct MultiValueSecret: ${getLoggableError(e)}`);
    }
  }

  verify(value: string): boolean {
    return this.values.includes(value);
  }

  /**
   * When communicating with Ivory we need to send a single secret value. The switch-ivory-env
   * tool uses the first secret configured in the list of secrets, so we'll do that here as
   * well.
   */
  getPrimaryValue(): string {
    if (this.values.length > 0) {
      return this.values[0];
    }
    throw new Error('No shared secrets have been configured.');
  }
}
