import { gql } from '@apollo/client';

import {
  ColorLibraryColorNode,
  ColorLibraryColorNodeConnection,
  ColorLibraryColorNodeEdge,
  ColorLibraryNode,
} from '@libs/graphql-types';

export const ColorLibraryColorFragment = gql`
  fragment ColorLibraryColorFragment on ColorLibraryColorNode {
    id
    order
    displayName
    hexCode
    updatedAt
  }
`;

export type ColorLibraryColor = Pick<
  ColorLibraryColorNode,
  '__typename' | 'id' | 'order' | 'displayName' | 'hexCode' | 'updatedAt'
>;

export const ColorLibraryFragment = gql`
  ${ColorLibraryColorFragment}

  fragment ColorLibraryFragment on ColorLibraryNode {
    id
    guid
    displayName
    colors {
      edges {
        node {
          ...ColorLibraryColorFragment
        }
      }
    }
  }
`;

export type ColorLibrary = Pick<ColorLibraryNode, '__typename' | 'id' | 'guid' | 'displayName'> & {
  colors: Pick<ColorLibraryColorNodeConnection, '__typename'> & {
    edges: Array<
      Pick<ColorLibraryColorNodeEdge, '__typename'> & {
        node: ColorLibraryColor;
      }
    >;
  };
};
