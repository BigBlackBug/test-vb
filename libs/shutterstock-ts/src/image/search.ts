import z from 'zod';

import { ShutterstockAPIConfiguration } from '../configuration';
import { ShutterstockLicense, ShutterstockView, buildShutterstockAPIURL } from '../request';
import { ShutterstockImage } from './imageTypes';

export interface ShutterstockImageSearchSpellcheckInfo {
  spellchecked_query?: string;
}

export interface ShutterstockImageSearchResponse {
  data: ShutterstockImage[];
  page: number;
  per_page: number;
  search_id: string;
  spellcheck_info: ShutterstockImageSearchSpellcheckInfo;
  total_count: number;
}

export enum ShutterstockImageSearchSort {
  Newest = 'newest',
  Popular = 'popular',
  Random = 'random',
  Relevance = 'relevance',
}

export enum ShutterstockImageSearchParameters {
  AspectRatio = 'aspect_ratio',
  AspectRatioMax = 'aspect_ratio_max',
  AspectRatioMin = 'aspect_ratio_min',
  Category = 'category',
  HeightFrom = 'height_from',
  HeightTo = 'height_to',
  ImageType = 'image_type',
  License = 'license',
  Orientation = 'orientation',
  Page = 'page',
  PerPage = 'per_page',
  Query = 'query',
  Safe = 'safe',
  Sort = 'sort',
  View = 'view',
  WidthFrom = 'width_from',
  WidthTo = 'width_to',
}

export enum ShutterstockImageSearchOrientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum ShutterstockImageSearchImageType {
  Illustration = 'illustration',
  Photo = 'photo',
  Vector = 'vector',
}

export const ImageSearchQueryParametersSchema = z
  .object({
    aspect_ratio: z.coerce.number().gt(0).optional(),
    aspect_ratio_max: z.coerce.number().gt(0).optional(),
    aspect_ratio_min: z.coerce.number().gte(0).optional(),
    category: z
      .string()
      .regex(/^([A-Za-z]+|[0-9]+)$/, {
        message: 'Must be a single Shutterstock category name or ID',
      })
      .optional(),
    height_from: z.coerce.number().int().gte(0).optional(),
    height_to: z.coerce.number().int().gt(0).optional(),
    image_type: z
      .nativeEnum(ShutterstockImageSearchImageType)
      .optional()
      .default(ShutterstockImageSearchImageType.Photo),
    orientation: z.nativeEnum(ShutterstockImageSearchOrientation).optional(),
    page: z.coerce.number().int().gte(1).optional(),
    per_page: z.coerce.number().int().gte(1).lte(500).optional(),
    query: z.string(),
    sort: z.nativeEnum(ShutterstockImageSearchSort).optional(),
    width_from: z.coerce.number().int().gte(0).optional(),
    width_to: z.coerce.number().int().gt(0).optional(),
  })
  .strict()
  .refine(
    (schema) => {
      if (schema.aspect_ratio_min && schema.aspect_ratio_max) {
        return schema.aspect_ratio_min <= schema.aspect_ratio_max;
      }
      return true;
    },
    {
      message: 'aspect_ratio_min must be less than or equal to aspect_ratio_max',
    },
  )
  .refine(
    (schema) => {
      if (schema.height_from && schema.height_to) {
        return schema.height_from <= schema.height_to;
      }
      return true;
    },
    {
      message: 'height_from must be less than or equal to height_to',
    },
  )
  .refine(
    (schema) => {
      if (schema.width_from && schema.width_to) {
        return schema.width_from <= schema.width_to;
      }
      return true;
    },
    {
      message: 'width_from must be less than or equal to width_to',
    },
  );
export type ImageSearchQueryParametersInput = z.input<typeof ImageSearchQueryParametersSchema>;
export type ImageSearchQueryParameters = z.infer<typeof ImageSearchQueryParametersSchema>;

export function buildImageSearchURL(
  url: URL,
  queryStringParameters: ImageSearchQueryParametersInput,
): URL {
  for (const [parameter, value] of Object.entries(queryStringParameters)) {
    url.searchParams.set(parameter, `${value}`);
  }
  url.searchParams.sort();
  return url;
}

export function buildShutterstockImageSearchURL(
  queryStringParameters: ImageSearchQueryParametersInput,
  configuration: ShutterstockAPIConfiguration,
) {
  const url = buildShutterstockAPIURL('/v2/images/search', configuration);

  ImageSearchQueryParametersSchema.parse(queryStringParameters);

  // Search parameters we accept from the context.
  url.searchParams.set(
    ShutterstockImageSearchParameters.Query,
    queryStringParameters[ShutterstockImageSearchParameters.Query],
  );

  if (queryStringParameters[ShutterstockImageSearchParameters.Category]) {
    url.searchParams.set(
      ShutterstockImageSearchParameters.Category,
      queryStringParameters[ShutterstockImageSearchParameters.Category],
    );
  }

  const image_type = queryStringParameters[ShutterstockImageSearchParameters.ImageType];
  if (image_type) {
    url.searchParams.set(ShutterstockImageSearchParameters.ImageType, image_type);
  }

  const orientation = queryStringParameters[ShutterstockImageSearchParameters.Orientation];
  if (orientation) {
    url.searchParams.set(ShutterstockImageSearchParameters.Orientation, orientation);
  }

  const aspectRatio = queryStringParameters[ShutterstockImageSearchParameters.AspectRatio];
  if (aspectRatio) {
    url.searchParams.set(ShutterstockImageSearchParameters.AspectRatio, `${aspectRatio}`);
  }

  const aspectRatioMax = queryStringParameters[ShutterstockImageSearchParameters.AspectRatioMax];
  if (aspectRatioMax) {
    url.searchParams.set(ShutterstockImageSearchParameters.AspectRatioMax, `${aspectRatioMax}`);
  }

  const aspectRatioMin = queryStringParameters[ShutterstockImageSearchParameters.AspectRatioMin];
  if (aspectRatioMin) {
    url.searchParams.set(ShutterstockImageSearchParameters.AspectRatioMin, `${aspectRatioMin}`);
  }

  const heightFrom = queryStringParameters[ShutterstockImageSearchParameters.HeightFrom];
  if (heightFrom) {
    url.searchParams.set(ShutterstockImageSearchParameters.HeightFrom, `${heightFrom}`);
  }

  const heightTo = queryStringParameters[ShutterstockImageSearchParameters.HeightTo];
  if (heightTo) {
    url.searchParams.set(ShutterstockImageSearchParameters.HeightTo, `${heightTo}`);
  }

  const widthFrom = queryStringParameters[ShutterstockImageSearchParameters.WidthFrom];
  if (widthFrom) {
    url.searchParams.set(ShutterstockImageSearchParameters.WidthFrom, `${widthFrom}`);
  }

  const widthTo = queryStringParameters[ShutterstockImageSearchParameters.WidthTo];
  if (widthTo) {
    url.searchParams.set(ShutterstockImageSearchParameters.WidthTo, `${widthTo}`);
  }

  const page = queryStringParameters[ShutterstockImageSearchParameters.Page];
  if (page) {
    url.searchParams.set(ShutterstockImageSearchParameters.Page, `${page}`);
  }

  const perPage = queryStringParameters[ShutterstockImageSearchParameters.PerPage];
  if (perPage) {
    url.searchParams.set(ShutterstockImageSearchParameters.PerPage, `${perPage}`);
  }

  const sort = queryStringParameters[ShutterstockImageSearchParameters.Sort];
  if (sort) {
    url.searchParams.set(ShutterstockImageSearchParameters.Sort, sort);
  }

  // End of parameters accepted from the context.

  // Search parameters that are always set here, not from the context.
  url.searchParams.set(ShutterstockImageSearchParameters.License, ShutterstockLicense.Commercial);

  url.searchParams.set(ShutterstockImageSearchParameters.View, ShutterstockView.Full);

  url.searchParams.set(ShutterstockImageSearchParameters.Safe, 'true');

  url.searchParams.sort();

  return url;
}
