import { gql } from '@apollo/client';

import {
  StockVideoAssetNode,
  StockVideoLibraryVideoNode,
  StockVideoLibraryVideoNodeConnection,
  StockVideoLibraryVideoNodeEdge,
  StockVideoLibraryNode,
} from '@libs/graphql-types';

// StockVideoAsset
export type StockVideoAssetFragment = Pick<
  StockVideoAssetNode,
  '__typename' | 'id' | 'source' | 'sourceAssetId' | 'width' | 'height' | 'length' | 'vpsKey'
>;

const stockVideoAssetFragmentName = 'StockVideoAssetFragment' as const;

const stockVideoAssetFragment = {
  name: stockVideoAssetFragmentName,
  fragment: gql`
    fragment ${stockVideoAssetFragmentName} on StockVideoAssetNode {
      __typename
      id
      source
      sourceAssetId
      width
      height
      length
      vpsKey
    }
  `,
};

// StockVideoLibraryVideo
export type StockVideoLibraryVideoFragment = Pick<
  StockVideoLibraryVideoNode,
  '__typename' | 'id' | 'guid' | 'removedAt' | 'updatedAt' | 'stockAsset'
> & {
  stockAsset: StockVideoAssetFragment;
};

const stockVideoLibraryVideoFragmentName = 'StockVideoLibraryVideoFragment' as const;

export const stockVideoLibraryVideoFragment = {
  name: stockVideoLibraryVideoFragmentName,
  fragment: gql`
    ${stockVideoAssetFragment.fragment}

    fragment ${stockVideoLibraryVideoFragmentName} on StockVideoLibraryVideoNode {
      __typename
      id
      guid
      removedAt
      updatedAt
      stockAsset {
        ...${stockVideoAssetFragment.name}
      }
    }
  `,
};

// StockVideoLibrary
export type StockVideoLibraryFragmentType = Pick<
  StockVideoLibraryNode,
  '__typename' | 'id' | 'guid' | 'displayName'
> & {
  stockVideoLibraryVideos: StockVideoLibraryVideoNodeConnection & {
    edges: Array<
      StockVideoLibraryVideoNodeEdge & {
        node: StockVideoLibraryVideoFragment;
      }
    >;
  };
};

const stockVideoLibraryFragmentName = 'StockVideoLibraryFragment' as const;

export const stockVideoLibraryFragment = {
  name: stockVideoLibraryFragmentName,
  fragment: gql`
    ${stockVideoLibraryVideoFragment.fragment}

    fragment ${stockVideoLibraryFragmentName} on StockVideoLibraryNode {
      __typename
      id
      guid
      displayName
      stockVideoLibraryVideos {
        __typename
        edges {
          __typename
          node {
            ...${stockVideoLibraryVideoFragment.name}
          }
        }
      }
    }
  `,
};
