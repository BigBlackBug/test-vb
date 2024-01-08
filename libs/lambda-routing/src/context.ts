import type { APIGatewayProxyEventV2, Context as LambdaContext } from 'aws-lambda';
import { Response } from './response';

export interface ContextState {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: any;
}

/**
 * The context that is passed through all the middleware.
 */
export class Context {
  state = {} as ContextState;
  response = new Response();

  constructor(public event: APIGatewayProxyEventV2, public lambdaContext?: LambdaContext) {}
}
