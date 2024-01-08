// Vendor
import { gql } from '@apollo/client';
import { GraphQLNode } from 'shared/types';

import { imageLibraryFragments, ImageLibrary } from 'shared/api/graphql/imageLibraries/fragments';

// Queries for an account's image libraries as well as their account group image libraries if applicable
export const accountImageLibraryQuery = gql`
  ${imageLibraryFragments.imageLibrary.fragment}

  query AccountImageLibraries($accountGUID: String) {
    accountByGuid(guid: $accountGUID) {
      id
      guid
      displayName

      imageLibraries {
        edges {
          node {
            ...${imageLibraryFragments.imageLibrary.name}
          }
        }
      }

      accountGroups {
        edges {
          node {
            id
            displayName
            imageLibraries {
              edges {
                node {
                  ...${imageLibraryFragments.imageLibrary.name}
                }
              }
            }
          }
        }
      }
    }
  }
`;
export interface AccountImageLibraryQueryResult {
  accountByGuid: GraphQLNode & {
    guid: string;
    displayName: string;
    imageLibraries: {
      edges: Array<{
        node: ImageLibrary;
      }>;
    };
    accountGroups: {
      edges: Array<{
        node: GraphQLNode & {
          displayName: string;
          imageLibraries: {
            edges: Array<{
              node: ImageLibrary;
            }>;
          };
        };
      }>;
    };
  };
}

// Queries for a business' image libraries
export const businessImageLibraryQuery = gql`
  ${imageLibraryFragments.imageLibrary.fragment}

  query BusinessImageLibraries($businessGUID: String!) {
    businessByGuid(guid: $businessGUID) {
      id
      guid
      totalImageCount
      logoImage {
        id
        guid
        baseUrl
        updatedAt
      }
      businessName

      imageLibraries {
        edges {
          node {
            ...${imageLibraryFragments.imageLibrary.name}
          }
        }
      }
    }
  }
`;
export interface BusinessImageLibraryQueryResult {
  businessByGuid: GraphQLNode & {
    totalImageCount: number;
    logoImage: GraphQLNode & {
      guid: string;
      baseUrl: string;
      updatedAt: string;
    };
    businessName: string;
    imageLibraries: {
      edges: Array<{
        node: ImageLibrary;
      }>;
    };
  };
}
