import axios from 'axios';
import compose from 'koa-compose';
import { HttpStatusCode } from './httpLib';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context as LambdaContext,
} from 'aws-lambda';
import type { HttpStatusCodeValue } from './httpLib';
import { MiddlewareFunction, NoOpMiddleware } from './middleware';
import { Context } from './context';

/*
 * Extends Error with HTTP status and control of message conveyance.
 *
 * If the error message should not be conveyed to user-visible contexts, set shouldExpose to false.
 */
export class AppError extends Error {
  statusCode: HttpStatusCodeValue = HttpStatusCode.INTERNAL_SERVER_ERROR;
  shouldExpose = true;
  original?: Error;

  constructor(
    message: string,
    original?: Error,
    statusCode?: HttpStatusCodeValue,
    shouldExpose: boolean = true,
  ) {
    super(message);

    if (statusCode) {
      this.statusCode = statusCode;
    } else if (axios.isAxiosError(original) && original.response) {
      this.statusCode = original.response.status as HttpStatusCodeValue;
    }

    if (shouldExpose !== undefined) {
      this.shouldExpose = shouldExpose;
    }

    this.original = original;
  }
}

export class HandlerError extends AppError {
  constructor(message: string, statusCode: HttpStatusCodeValue) {
    super(message);
    this.statusCode = statusCode;
    this.shouldExpose = true;
  }
}

/**
 * The app used to handle Lambda Proxy Events.
 *
 * @example
 *
 * // This is a lambda handler file.
 *
 * const { App } = require('lambda-routing');
 *
 * const app = new App();
 * // Attach some middleware
 * app.use(async (ctx, next) => {
 *  console.log('MY LAMBDA EVENT', ctx.event);
 *  console.log('Query parameters:', ctx.event.queryStringParameters);
 *  ctx.response.statusCode = 202;
 *  ctx.response.body = { foo: 'bar' };
 *  await next();
 * })
 *
 * exports.handler = (event) => {
 *  return app.handle(event);
 * }
 */
export class App {
  middlewares = [] as Array<MiddlewareFunction>;

  constructor() {
    this.middlewares = [];
  }

  use(...middlewares: Array<MiddlewareFunction>) {
    this.middlewares.push(...middlewares);
  }

  async handle(
    event: APIGatewayProxyEventV2,
    lambdaContext?: LambdaContext,
  ): Promise<APIGatewayProxyStructuredResultV2> {
    const ctx = new Context(event, lambdaContext);
    // Execute middleware
    try {
      await compose(this.middlewares.length ? this.middlewares : [NoOpMiddleware])(ctx);
    } catch (error: unknown) {
      const safeError: Error | AppError =
        error instanceof Error ? error : new Error(`Non-error thrown: ${error}`);

      let message = '';
      let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR as HttpStatusCodeValue;

      if (safeError.hasOwnProperty('statusCode')) {
        statusCode = (safeError as AppError).statusCode as HttpStatusCodeValue;
      }

      if (safeError.hasOwnProperty('shouldExpose') && (safeError as AppError).shouldExpose) {
        message = safeError.message;
      }

      ctx.response.statusCode = statusCode;

      ctx.response.body = {
        message,
      };
    }

    // Return lambda response
    return ctx.response.asLambdaProxyResult();
  }
}
