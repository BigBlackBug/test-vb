import {
    gql
} from '@apollo/client';

export const coreVideoLibraryVideoFields = gql `
  fragment CoreVideoLibraryVideoFields on VideoAssetLibraryVideoNode {
    id
    pk
    guid
    uploadKey
    displayName
    width
    height
    length
    order
    updatedAt
    removedAt
  }
`;

export const coreVideoLibraryFields = gql `
  ${coreVideoLibraryVideoFields}

  fragment CoreVideoLibraryFields on VideoAssetLibraryNode {
    id
    pk
    slug
    displayName

    videoAssets {
      edges {
        node {
          ...CoreVideoLibraryVideoFields
        }
      }
    }
  }
`;