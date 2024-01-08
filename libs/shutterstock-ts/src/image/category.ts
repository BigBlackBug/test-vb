import z from 'zod';

import { ShutterstockAPIConfiguration } from '../configuration';
import { buildShutterstockAPIURL } from '../request';
import { ShutterstockCategory } from '../response';

export enum ShutterstockImageCategoriesParameters {
  Language = 'language',
}

export interface ShutterstockImageCategoriesResponse {
  data: ShutterstockCategory[];
}

export const ImageCategoriesQueryParametersSchema = z
  .object({
    language: z.string().optional(),
  })
  .optional();

export type ImageCategoriesQueryParameters = z.infer<typeof ImageCategoriesQueryParametersSchema>;

export function buildImageCategoriesURL(
  url: URL,
  queryStringParameters: ImageCategoriesQueryParameters,
): URL {
  if (queryStringParameters) {
    for (const [parameter, value] of Object.entries(queryStringParameters)) {
      url.searchParams.set(parameter, `${value}`);
    }
    url.searchParams.sort();
  }
  return url;
}

export function buildShutterstockImageCategoriesURL(
  queryStringParameters: ImageCategoriesQueryParameters,
  configuration: ShutterstockAPIConfiguration,
): URL {
  const url = buildShutterstockAPIURL('/v2/images/categories', configuration);

  if (!queryStringParameters) {
    return url;
  }

  ImageCategoriesQueryParametersSchema.parse(queryStringParameters);

  // Search parameters we accept from the context.
  const language = queryStringParameters[ShutterstockImageCategoriesParameters.Language];
  if (language) {
    url.searchParams.set(ShutterstockImageCategoriesParameters.Language, language);
  }
  url.searchParams.sort();

  return url;
}
