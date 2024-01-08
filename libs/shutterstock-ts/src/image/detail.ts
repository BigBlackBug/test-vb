import { getLogger } from 'libs/logging-ts';
import z from 'zod';
import { ShutterstockAPIConfiguration } from '../configuration';
import { ShutterstockError } from '../error';
import { ShutterstockView, buildShutterstockAPIURL } from '../request';
import { ShutterstockImage } from './imageTypes';

export enum ShutterstockImageDetailParameters {
  ID = 'id',
  SearchID = 'search_id',
  View = 'view',
}

export const ImageDetailQueryParametersSchema = z.object({
  id: z.array(z.string()),
  search_id: z.string().optional(),
});
export type ImageDetailQueryParameters = z.infer<typeof ImageDetailQueryParametersSchema>;

export interface ShutterstockImageDetailResponse {
  data: ShutterstockImage[];
  errors?: ShutterstockError[];
  message: string;
  page: number;
  per_page: number;
  total_count: number;
}

export function buildShutterstockImageDetailURL(
  queryStringParameters: ImageDetailQueryParameters,
  configuration: ShutterstockAPIConfiguration,
) {
  const logger = getLogger({ metadata: { service: 'buildShutterstockImageDetailURL' } });
  const url = buildShutterstockAPIURL('/v2/images', configuration);

  ImageDetailQueryParametersSchema.parse(queryStringParameters);

  if (queryStringParameters.id.length < 1) {
    const message = 'Cannot get details without at least one image ID';
    logger.error(message, { queryStringParameters });
    throw new Error(message);
  }

  for (const id of queryStringParameters.id) {
    url.searchParams.append(ShutterstockImageDetailParameters.ID, id);
  }

  if (queryStringParameters[ShutterstockImageDetailParameters.SearchID]) {
    url.searchParams.set(
      ShutterstockImageDetailParameters.SearchID,
      queryStringParameters[ShutterstockImageDetailParameters.SearchID],
    );
  }

  url.searchParams.set(ShutterstockImageDetailParameters.View, ShutterstockView.Full);

  url.searchParams.sort();

  return url;
}
