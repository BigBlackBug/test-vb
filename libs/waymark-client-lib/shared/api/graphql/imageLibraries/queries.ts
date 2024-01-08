import _ from 'lodash';
import { gql } from '@apollo/client';
import { ImageLibraryImageNode } from '@libs/graphql-types/src';

import { apolloClient } from '../index';

const STOCK_IMAGES_FOR_IMAGE_KEYS_QUERY = gql`
  query StockImagesForImageKeys($imageKeys: [String!]!) {
    stockImagesForImageKeys(imageKeys: $imageKeys) {
      id
      stockAssetId
      stockSearchId
    }
  }
`;

interface StockImagesForImageKeysQueryVariables {
  imageKeys: string[];
}

interface StockImagesForImageKeysQueryResponse {
  stockImagesForImageKeys: Pick<
    ImageLibraryImageNode,
    '__typename' | 'id' | 'stockAssetId' | 'stockSearchId'
  >[];
}

/**
 * Query fetches all stock images which match an array of image keys (found in the configuration at imageField.content.location.key)
 */
export const getStockImagesForImageKeys = async (imageKeys: string[]) => {
  if (_.isEmpty(imageKeys)) {
    return [];
  }

  const { data } = await apolloClient.query<
    StockImagesForImageKeysQueryResponse,
    StockImagesForImageKeysQueryVariables
  >({
    query: STOCK_IMAGES_FOR_IMAGE_KEYS_QUERY,
    variables: { imageKeys },
  });

  return data.stockImagesForImageKeys;
};
