import z from 'zod';

import { ShutterstockAPIConfiguration } from '../configuration';
import { ShutterstockLicense, ShutterstockView, buildShutterstockAPIURL } from '../request';
import {
  ShutterstockCategory,
  ShutterstockContributor,
  ShutterstockModel,
  ShutterstockRelease,
  ShutterstockURL,
  ShutterstockURLs,
} from '../response';

export enum ShutterstockVideoResolution {
  HighDefinition = 'high_definition',
  StandardDefinition = 'standard_definition',
}

export enum ShutterstockVideoSearchParameters {
  Category = 'category',
  DurationFrom = 'duration_from',
  DurationTo = 'duration_to',
  License = 'license',
  Page = 'page',
  PerPage = 'per_page',
  Query = 'query',
  Resolution = 'resolution',
  Safe = 'safe',
  Sort = 'sort',
  View = 'view',
}

export interface ShutterstockVideoFormat {
  display_name: string;
  file_size: number;
  format: string;
  fps: number;
  height: number;
  is_licensable: boolean;
  name: string;
  width: number;
}

export interface ShutterstockVideoAssetMap {
  '4k'?: ShutterstockVideoFormat;
  hd?: ShutterstockVideoFormat;
  preview_jpg?: ShutterstockURL;
  preview_mp4?: ShutterstockURL;
  preview_webm?: ShutterstockURL;
  sd?: ShutterstockVideoFormat;
  thumb_jpg?: ShutterstockURL;
  thumb_jpgs?: ShutterstockURLs;
  thumb_mp4?: ShutterstockURL;
  thumb_webm?: ShutterstockURL;
  web?: ShutterstockVideoFormat;
}

export interface ShutterstockVideo {
  added_date: string;
  aspect: number;
  aspect_ratio: string;
  assets: ShutterstockVideoAssetMap;
  categories: ShutterstockCategory[];
  contributor: ShutterstockContributor;
  description: string;
  duration: number;
  has_model_release: boolean;
  has_property_release: boolean;
  id: string;
  is_adult: boolean;
  is_editorial: boolean;
  keywords: string[];
  media_type: 'video';
  models?: ShutterstockModel[];
  original_filename: string;
  releases: ShutterstockRelease[];
}

export interface ShutterstockVideoSearchSpellcheckInfo {
  spellchecked_query?: string;
}

export interface ShutterstockVideoSearchResponse {
  data: ShutterstockVideo[];
  page: number;
  per_page: number;
  search_id: string;
  spellcheck_info: ShutterstockVideoSearchSpellcheckInfo;
  total_count: number;
}

export enum ShutterstockVideoSearchSort {
  Newest = 'newest',
  Popular = 'popular',
  Random = 'random',
  Relevance = 'relevance',
}

// Parameters the Shutterstock video search endpoint will accept.
export const VideoSearchQueryParametersSchema = z
  .object({
    category: z
      .string()
      .regex(/^([A-Za-z]+|[0-9]+)$/, {
        message: 'Must be a single Shutterstock category name or ID',
      })
      .optional(),
    duration_from: z.coerce.number().int().gte(1).optional(),
    duration_to: z.coerce.number().int().gte(1).optional(),
    page: z.coerce.number().int().gte(1).optional(),
    per_page: z.coerce.number().int().gte(1).lte(500).optional(),
    query: z.string(),
    sort: z.nativeEnum(ShutterstockVideoSearchSort).optional(),
  })
  .strict()
  .refine(
    (schema) => {
      if (schema.duration_from && schema.duration_to) {
        return schema.duration_from <= schema.duration_to;
      }
      return true;
    },
    {
      message: 'duration_from must be less than or equal to duration_to',
    },
  );

export type VideoSearchQueryParameters = z.infer<typeof VideoSearchQueryParametersSchema>;

export function buildVideoSearchURL(
  url: URL,
  queryStringParameters: VideoSearchQueryParameters,
): URL {
  for (const [parameter, value] of Object.entries(queryStringParameters)) {
    url.searchParams.set(parameter, `${value}`);
  }
  url.searchParams.sort();
  return url;
}

export function buildShutterstockVideoSearchURL(
  queryStringParameters: VideoSearchQueryParameters,
  configuration: ShutterstockAPIConfiguration,
): URL {
  const url = buildShutterstockAPIURL('/v2/videos/search', configuration);

  VideoSearchQueryParametersSchema.parse(queryStringParameters);

  // Search parameters we accept from the context.
  url.searchParams.set(
    ShutterstockVideoSearchParameters.Query,
    queryStringParameters[ShutterstockVideoSearchParameters.Query],
  );

  if (queryStringParameters[ShutterstockVideoSearchParameters.Category]) {
    url.searchParams.set(
      ShutterstockVideoSearchParameters.Category,
      queryStringParameters[ShutterstockVideoSearchParameters.Category],
    );
  }

  const page = queryStringParameters[ShutterstockVideoSearchParameters.Page];
  if (page) {
    url.searchParams.set(ShutterstockVideoSearchParameters.Page, `${page}`);
  }

  const perPage = queryStringParameters[ShutterstockVideoSearchParameters.PerPage];
  if (perPage) {
    url.searchParams.set(ShutterstockVideoSearchParameters.PerPage, `${perPage}`);
  }

  const durationFrom = queryStringParameters[ShutterstockVideoSearchParameters.DurationFrom];
  if (durationFrom) {
    url.searchParams.set(ShutterstockVideoSearchParameters.DurationFrom, `${durationFrom}`);
  }

  const durationTo = queryStringParameters[ShutterstockVideoSearchParameters.DurationTo];
  if (durationTo) {
    url.searchParams.set(ShutterstockVideoSearchParameters.DurationTo, `${durationTo}`);
  }

  const sort = queryStringParameters[ShutterstockVideoSearchParameters.Sort];
  if (sort) {
    url.searchParams.set(ShutterstockVideoSearchParameters.Sort, sort);
  }
  // End of parameters accepted from the context.
  // Search parameters that are always set here, not from the context.
  url.searchParams.set(ShutterstockVideoSearchParameters.License, ShutterstockLicense.Commercial);

  url.searchParams.set(ShutterstockVideoSearchParameters.View, ShutterstockView.Full);

  url.searchParams.set(ShutterstockVideoSearchParameters.Safe, 'true');

  url.searchParams.set(
    ShutterstockVideoSearchParameters.Resolution,
    ShutterstockVideoResolution.HighDefinition,
  );

  url.searchParams.sort();

  return url;
}
