import { gql } from '@apollo/client';
import { GraphQLNode } from 'shared/types';

export const colorFields = gql`
  fragment ColorFields on ColorLibraryColorNode {
    id
    order
    displayName
    hexCode
    updatedAt
  }
`;
export interface ColorLibraryColorNode extends GraphQLNode {
  order: number;
  displayName: string;
  hexCode: string;
  updatedAt: string;
}

export const colorLibraryFields = gql`
  ${colorFields}

  fragment ColorLibraryFields on ColorLibraryNode {
    id
    guid
    displayName
    colors {
      edges {
        node {
          ...ColorFields
        }
      }
    }
  }
`;
export interface ColorLibraryNode extends GraphQLNode {
  guid: string;
  displayName: string;
  colors: {
    edges: Array<{
      node: ColorLibraryColorNode;
    }>;
  };
}

export const accountColorLibrariesQuery = gql`
  ${colorLibraryFields}

  query ColorLibrariesForAccount($accountGUID: String) {
    accountByGuid(guid: $accountGUID) {
      id
      guid
      colorLibraries {
        edges {
          node {
            ...ColorLibraryFields
          }
        }
      }
      accountGroups {
        edges {
          node {
            id
            displayName
            colorLibraries {
              edges {
                node {
                  ...ColorLibraryFields
                }
              }
            }
          }
        }
      }
    }
  }
`;
export interface AccountColorLibrariesQueryResult {
  accountByGuid: GraphQLNode & {
    guid: string;
    colorLibraries: {
      edges: Array<{
        node: ColorLibraryNode;
      }>;
    };
    accountGroups: {
      edges: Array<{
        node: GraphQLNode & {
          displayName: string;
          colorLibraries: {
            edges: Array<{
              node: ColorLibraryNode;
            }>;
          };
        };
      }>;
    };
  };
}

export const businessColorLibrariesQuery = gql`
  ${colorLibraryFields}

  query ColorLibrariesForBusiness($businessGUID: String) {
    businessByGuid(guid: $businessGUID) {
      id
      guid
      businessName
      colorLibraries {
        edges {
          node {
            ...ColorLibraryFields
          }
        }
      }
    }
  }
`;
export interface BusinessColorLibrariesQueryResult {
  businessByGuid: GraphQLNode & {
    guid: string;
    businessName: string;
    colorLibraries: {
      edges: Array<{
        node: ColorLibraryNode;
      }>;
    };
  };
}
