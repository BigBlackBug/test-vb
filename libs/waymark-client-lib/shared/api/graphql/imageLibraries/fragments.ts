import { gql } from '@apollo/client';

import {
  ImageLibraryImageNode,
  ImageLibraryImageNodeConnection,
  ImageLibraryImageNodeEdge,
  ImageLibraryNode,
} from '@libs/graphql-types';

const imageLibraryImageFields = [
  '__typename',
  'id',
  'pk',
  'guid',
  'displayName',
  'order',
  'source',
  'imageType',
  'isFavorite',
  'removedAt',
  'updatedAt',
  'image',
  'baseUrl',
  'imageWidth',
  'imageHeight',
  'upscaledImageUrl',
  'stockAssetId',
  'stockSearchId',
] satisfies Array<keyof Partial<ImageLibraryImageNode>>;

const imageLibraryImageFragmentName = 'ImageLibraryImageFragment' as const;

const imageLibraryImageFragment = gql`
  fragment ${imageLibraryImageFragmentName} on ImageLibraryImageNode {
    ${imageLibraryImageFields.join('\n')}
  }
`;

export type ImageLibraryImage = Pick<
  ImageLibraryImageNode,
  (typeof imageLibraryImageFields)[number]
>;

const imageLibraryFragmentName = 'ImageLibraryFragment' as const;

const ImageLibraryFragment = gql`
  ${imageLibraryImageFragment}

  fragment ${imageLibraryFragmentName} on ImageLibraryNode {
    id
    pk
    slug
    displayName
    images {
      edges {
        node {
          ...${imageLibraryImageFragmentName}
        }
      }
    }
  }
`;

export type ImageLibrary = Pick<
  ImageLibraryNode,
  '__typename' | 'id' | 'pk' | 'slug' | 'displayName'
> & {
  images: {
    __typename: ImageLibraryImageNodeConnection['__typename'];
    edges: Array<{
      __typename: ImageLibraryImageNodeEdge['__typename'];
      node: ImageLibraryImage;
    }>;
  };
};

export const imageLibraryFragments = {
  imageLibraryImage: {
    name: imageLibraryImageFragmentName,
    fragment: imageLibraryImageFragment,
  },
  imageLibrary: {
    name: imageLibraryFragmentName,
    fragment: ImageLibraryFragment,
  },
};
