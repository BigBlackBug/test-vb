import compose from 'koa-compose';
import { HttpStatusCode } from './httpLib';

import type { Context } from './context';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { HttpMethodString } from './httpLib';
import { MiddlewareFunction } from './middleware';

export interface Route {
  method: HttpMethodString;
  path: string;
  // eslint-disable-next-line
  handler: Function;
}

export interface RouteMatch extends Route {
  pathParameters: { [key: string]: string };
}

const getRoute = (routes: Array<Route>, event: APIGatewayProxyEventV2): RouteMatch | undefined => {
  const eventPath = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  let matchingRoute;

  for (const route of routes) {
    // Fast fail if methods don't match
    if (method !== route.method) {
      continue;
    }

    // Exact match, exit early
    if (eventPath === route.path) {
      matchingRoute = { ...route, pathParameters: {} };
      break;
    }

    // Retrieve path parameters (if all of the path parameters match)
    const parsedPathParameters = extractPathParametersIfMatchingRoute(eventPath, route);

    // No path parameters matched, so we can move to the next route
    if (Object.keys(parsedPathParameters).length === 0) {
      continue;
    }

    // We found patching path parameters! Let's create a copy of the route with the
    // path parameters. We're done.
    matchingRoute = {
      ...route,
      pathParameters: parsedPathParameters,
    };
    break;
  }

  return matchingRoute;
};

const extractPathParametersIfMatchingRoute = (
  eventPath: string,
  route: Route,
): { [key: string]: string } => {
  const eventPathParts = eventPath.split('/');
  const routePathParts = route.path.split('/');

  // Fail fast if they're not the same length
  if (eventPathParts.length !== routePathParts.length) {
    return {};
  }

  const tokens = {} as { [key: string]: string };

  for (const [index, pathPart] of eventPathParts.entries()) {
    const routePart = routePathParts[index];

    // If the part is a curly braces value
    const pathPartMatch = /\{(\w+)}/g.exec(routePart);
    if (pathPartMatch) {
      tokens[pathPartMatch[1]] = pathPart;
      continue;
    }

    // Fail fast if a part doesn't match
    if (routePart !== pathPart) {
      return {};
    }
  }

  return tokens;
};

/**
 * A way to register route handlers as middleware.
 *
 * @example
 * const { App, Router, JSONBodyParser } = require('lambda-routing');
 *
 * const router = new Router();
 *
 * router.register('GET', '/return-object-body', (ctx) => {
 *   ctx.response.statusCode = 200;
 *   ctx.response.body = {
 *     foo: 'bar',
 *     baz: 'bat'
 *   }
 * })
 *
 * router.register('POST', '/post-201-echo', JSONBodyParser, (ctx) => {
 *   ctx.response.statusCode = 201;
 *   // Echoing whatever came in with the request
 *   ctx.response.body = ctx.state.requestBody;
 * })
 *
 * router.register('GET', '/echo-dynamic-path/{foo}/{bar}', (ctx) => {
 *   // Echoing all path parameters in the route
 *   ctx.response.body = ctx.state.matchedRoute.pathParameters;
 * });
 *
 * const app = new App();
 * app.use(router.middleware());
 *
 * exports.handler = async (event) => {
 *   return app.handle(event);
 * };
 */
export class Router {
  routes = [] as Array<Route>;

  register(
    method: HttpMethodString,
    path: string,
    ...middlewaresAndHandler: Array<MiddlewareFunction>
  ) {
    this.routes.push({ method, path, handler: compose(middlewaresAndHandler) });
  }

  middleware() {
    // eslint-disable-next-line
    return async (ctx: Context, next: Function) => {
      // let routeKey = ctx.event.routeKey;
      // For some reason, `event.routeKey` uses <> for path parameters instead of {}
      // when running in `sam local`. So, we transform `/my/path/<parameter>` to `/my/path/{parameter}`
      // so it matches the registered route and matches how AWS performs in the cloud.
      // if (process.env.AWS_SAM_LOCAL) {
      //   routeKey = routeKey.replace(/<(.*?)>/g, '{$1}');
      // }
      const matchedRoute = getRoute(this.routes, ctx.event);
      if (!matchedRoute) {
        ctx.response.statusCode = HttpStatusCode.NOT_FOUND;
        ctx.response.body = {
          message: `No route found for ${ctx.event.requestContext.http.path}`,
        };
        return;
      }
      ctx.state.matchedRoute = matchedRoute;
      return matchedRoute.handler(ctx, next);
    };
  }

  /**
   * Incorporate another Router's routes into this one.
   */
  merge(router: Router) {
    this.routes = this.routes.concat(router.routes);
  }

  toString() {
    return `${JSON.stringify(this.routes, null, 2)}`;
  }
}
