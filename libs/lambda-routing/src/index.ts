// Vendor
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context as LambdaContext,
} from 'aws-lambda';

// Local
import { App } from './app';
import { Router } from './router';
import { CORSMiddleware } from './middleware';

// Re-exports for consumers of this library
export * from './app';
export * from './context';
export * from './router';
export * from './middleware';
export * from './httpLib';

// A standard app handler for our most common use case.
export const createDefaultAppHandler = (router: Router) => {
  const app = new App();

  app.use(CORSMiddleware);

  // Set up the router endpoints.
  app.use(router.middleware());

  const handler = async (
    event: APIGatewayProxyEventV2,
    lambdaContext?: LambdaContext,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    return app.handle(event, lambdaContext);
  };

  return handler;
};
