import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { HttpStatusCodeValue } from './httpLib';

export type ValueOf<T> = T[keyof T];

export interface ResponseHeaders {
  [key: string]: boolean | number | string;
}

/**
 * Handles the forming of the ultimate HTTP response.
 */
export class Response {
  statusCode = 200 as HttpStatusCodeValue;
  headers = { 'content-type': 'application/json' } as ResponseHeaders;
  body = undefined as object | string | undefined;
  isBase64Encoded = false as boolean;
  cookies = [] as Array<string>;

  setHeader(name: keyof ResponseHeaders, value: ValueOf<ResponseHeaders>) {
    this.setHeaders({
      [name]: value,
    });
  }

  setHeaders(headers: ResponseHeaders) {
    this.headers = {
      ...this.headers,
      ...headers,
    };
  }

  asLambdaProxyResult(): APIGatewayProxyStructuredResultV2 {
    return {
      statusCode: this.statusCode,
      headers: this.headers,
      body: typeof this.body === 'object' ? JSON.stringify(this.body) : this.body,
      isBase64Encoded: this.isBase64Encoded,
      cookies: this.cookies,
    };
  }
}
