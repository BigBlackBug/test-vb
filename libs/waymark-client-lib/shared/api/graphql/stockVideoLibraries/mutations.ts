import { gql } from '@apollo/client';

import {
  AddStockVideoToLibraryMutationInput,
  RemoveStockVideoFromLibraryMutationInput,
  RestoreRemovedStockVideoToLibraryMutationInput,
} from '@libs/graphql-types';

import { StockVideoLibraryVideoFragment, stockVideoLibraryVideoFragment } from './fragments';
import { apolloClient } from '../index';

const AddStockVideoToLibraryMutation = gql`
  ${stockVideoLibraryVideoFragment.fragment}

  mutation AddStockVideoToLibrary($input: AddStockVideoToLibraryMutationInput!) {
    addStockVideoToLibrary(input: $input) {
      createdStockVideoLibraryVideo {
        ...${stockVideoLibraryVideoFragment.name}
      }
      createdStockVideoLibrary {
        id
        guid
        displayName
      }
    }
  }
`;

export interface AddStockVideoToLibraryMutationVariables {
  input: AddStockVideoToLibraryMutationInput;
}

export interface AddStockVideoToLibraryMutationResult {
  addStockVideoToLibrary: {
    createdStockVideoLibraryVideo: StockVideoLibraryVideoFragment;
    createdStockVideoLibrary: {
      id: string;
      guid: string;
      displayName: string;
    };
  };
}

/**
 * Saves a stock video to a stock video library
 */
export const addStockVideoToLibrary = async (
  input: AddStockVideoToLibraryMutationVariables['input'],
) => {
  const result = await apolloClient.mutate<
    AddStockVideoToLibraryMutationResult,
    AddStockVideoToLibraryMutationVariables
  >({
    mutation: AddStockVideoToLibraryMutation,
    variables: {
      input,
    },
  });

  return result;
};

const RemoveStockVideoMutation = gql`
  ${stockVideoLibraryVideoFragment.fragment}

  mutation RemoveStockVideoFromLibrary(
    $input: RemoveStockVideoFromLibraryMutationInput!
  ) {
    removeStockVideoFromLibrary(input: $input) {
      updatedStockVideoLibraryVideo {
        ...${stockVideoLibraryVideoFragment.name}
      }
    }
  }
`;

interface RemoveStockVideoFromLibraryMutationVariables {
  input: RemoveStockVideoFromLibraryMutationInput;
}

interface RemoveStockVideoFromLibraryMutationResult {
  removeStockVideoFromLibrary: {
    updatedStockVideoLibraryVideo: StockVideoLibraryVideoFragment;
  };
}

/**
 * Removes a stock video from its library
 */
export const removeStockVideo = async (stockVideoGUID: string) => {
  const { data } = await apolloClient.mutate<
    RemoveStockVideoFromLibraryMutationResult,
    RemoveStockVideoFromLibraryMutationVariables
  >({
    mutation: RemoveStockVideoMutation,
    variables: {
      input: {
        stockVideoLibraryVideoGuid: stockVideoGUID,
      },
    },
  });

  return data?.removeStockVideoFromLibrary.updatedStockVideoLibraryVideo;
};

const RestoreRemovedStockVideoMutation = gql`
  ${stockVideoLibraryVideoFragment.fragment}

  mutation RemoveStockVideoFromLibrary(
    $input: RemoveStockVideoFromLibraryMutationInput!
  ) {
    restoreRemovedStockVideoToLibrary(input: $input) {
      updatedStockVideoLibraryVideo {
        ...${stockVideoLibraryVideoFragment.name}
      }
    }
  }
`;

interface RestoreRemovedStockVideoMutationVariables {
  input: RestoreRemovedStockVideoToLibraryMutationInput;
}

interface RestoreRemovedStockVideoMutationResult {
  restoreRemovedStockVideoToLibrary: {
    updatedStockVideoLibraryVideo: StockVideoLibraryVideoFragment;
  };
}

/**
 * Restores a removed stock video to its library
 */
export const restoreRemovedStockVideo = async (stockVideoGUID: string) => {
  const { data } = await apolloClient.mutate<
    RestoreRemovedStockVideoMutationResult,
    RestoreRemovedStockVideoMutationVariables
  >({
    mutation: RestoreRemovedStockVideoMutation,
    variables: {
      input: {
        stockVideoLibraryVideoGuid: stockVideoGUID,
      },
    },
  });

  return data?.restoreRemovedStockVideoToLibrary.updatedStockVideoLibraryVideo;
};
