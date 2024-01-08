import z from 'zod';

import { ShutterstockAPIConfiguration } from '../configuration';
import { buildShutterstockAPIURL } from '../request';
import { ShutterstockCategory } from '../response';

export enum ShutterstockVideoCategoriesParameters {
  Language = 'language',
}

export interface ShutterstockVideoCategoriesResponse {
  data: ShutterstockCategory[];
}

export const VideoCategoriesQueryParametersSchema = z
  .object({
    language: z.string().optional(),
  })
  .optional();

export type VideoCategoriesQueryParameters = z.infer<typeof VideoCategoriesQueryParametersSchema>;

export function buildVideoCategoriesURL(
  url: URL,
  queryStringParameters: VideoCategoriesQueryParameters,
): URL {
  if (queryStringParameters) {
    for (const [parameter, value] of Object.entries(queryStringParameters)) {
      url.searchParams.set(parameter, `${value}`);
    }
    url.searchParams.sort();
  }
  return url;
}

export function buildShutterstockVideoCategoriesURL(
  queryStringParameters: VideoCategoriesQueryParameters,
  configuration: ShutterstockAPIConfiguration,
): URL {
  const url = buildShutterstockAPIURL('/v2/videos/categories', configuration);

  if (!queryStringParameters) {
    return url;
  }

  VideoCategoriesQueryParametersSchema.parse(queryStringParameters);

  // Search parameters we accept from the context.
  const language = queryStringParameters[ShutterstockVideoCategoriesParameters.Language];
  if (language) {
    url.searchParams.set(ShutterstockVideoCategoriesParameters.Language, language);
  }

  url.searchParams.sort();

  return url;
}
