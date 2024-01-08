// Vendor
import { getLogger } from 'libs/logging-ts';

// Local
import { Context } from './context';

export type MiddlewareFunction = (ctx: Context, next: () => void) => void;

const logger = getLogger({ metadata: { service: 'lambda-routing' } });

// TODO: figure out how to remove this linting error.
/* eslint-disable-next-line @typescript-eslint/ban-types */
export const JSONBodyParser = async (ctx: Context, next: Function) => {
  ctx.state.requestBody = ctx.event.body ? JSON.parse(ctx.event.body) : ctx.event.body;
  await next();
};

/* eslint-disable-next-line @typescript-eslint/ban-types */
export const NoOpMiddleware = async (ctx: Context, next: Function) => await next();

/**
 * Check if a request's Origin header value is an origin we'll allow via CORS.
 */
function isAllowedOrigin(origin: string): boolean {
  const allowedDomains = ['video-preview.com', 'waymark.com'];
  const allowedOrigins = [...allowedDomains];
  if (process.env.APPLICATION_ENVIRONMENT !== 'wm-prod') {
    allowedOrigins.unshift('localhost');
  }

  if (origin === null || origin === undefined) {
    return false;
  }

  const originURL = new URL(origin);

  // Return true immediately for an exact match to one of our allowed origins.
  if (allowedOrigins.includes(originURL.hostname)) {
    return true;
  }

  // If the origin doesn't exactly match an allowed origin, see if it's a subdomain of one of our
  // allowed domains.
  return allowedDomains.some((domain) => {
    return originURL.hostname.endsWith(`.${domain}`);
  });
}

// Return CORS headers for all requests.
/* eslint-disable-next-line @typescript-eslint/ban-types */
export const CORSMiddleware = async (ctx: Context, next: Function) => {
  logger.debug('Setting CORS headers', ctx);

  // https://w3c.github.io/webappsec-cors-for-developers/#use-vary
  ctx.response.setHeader('Vary', 'Origin');

  const { origin } = ctx.event.headers;

  // We only set the ACAO header for allowed origins, and never to null.
  // https://w3c.github.io/webappsec-cors-for-developers/#avoid-returning-access-control-allow-origin-null
  if (origin && isAllowedOrigin(origin)) {
    logger.debug('Setting Access-Control-Allow-Origin', { origin });
    ctx.response.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Include the AWS authorization headers
  ctx.response.setHeader(
    'Access-Control-Allow-Headers',
    'accept, origin, content-type, authorization, x-api-key, x-amz-date, x-amz-security-token',
  );
  ctx.response.setHeader('Access-Control-Allow-Methods', 'HEAD,POST,OPTIONS,GET,PATCH,PUT');
  ctx.response.setHeader('Access-Control-Allow-Credentials', 'true');
  ctx.response.setHeader('Access-Control-Max-Age', '86400');

  // OPTIONS requests don't need a response other than the headers, but all requests need the
  // CORS headers.
  if (ctx.event.requestContext.http.method === 'OPTIONS') {
    return;
  }

  await next();
};
