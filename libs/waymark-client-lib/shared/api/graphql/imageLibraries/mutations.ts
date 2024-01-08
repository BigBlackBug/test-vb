import { gql } from '@apollo/client';

import {
  AddImageToImageLibraryMutationInput,
  GetOrCreateDefaultAccountImageLibraryMutationInput,
  GetOrCreateDefaultBusinessImageLibraryMutationInput,
  UpdateImageLibraryImageMutationInput,
} from '@libs/graphql-types';

import { apolloClient } from 'shared/api/graphql';
import { createOrUpdateApolloCacheQueryEdges } from 'shared/utils/apollo';
import { imageLibraryFragments, ImageLibrary, ImageLibraryImage } from './fragments';
import {
  accountImageLibraryQuery,
  businessImageLibraryQuery,
} from 'app/models/imageLibraries/queries';

const GetOrCreateDefaultAccountImageLibraryMutation = gql`
  ${imageLibraryFragments.imageLibrary.fragment}

  mutation GetOrCreateDefaultAccountImageLibrary(
    $input: GetOrCreateDefaultAccountImageLibraryMutationInput!
  ) {
    getOrCreateDefaultAccountImageLibrary(input: $input) {
      imageLibrary {
        ...${imageLibraryFragments.imageLibrary.name}
      }
    }
  }
`;

type GetOrCreateDefaultAccountImageLibraryMutationVariables = {
  input: GetOrCreateDefaultAccountImageLibraryMutationInput;
};

type GetOrCreateDefaultAccountImageLibraryMutationResult = {
  getOrCreateDefaultAccountImageLibrary: {
    imageLibrary: ImageLibrary;
  };
};

/**
 * Mutation gets/creates a default AccountImageLibrary + ImageLibrary for the given account
 *
 * @param {string} accountGUID  GUID of the account to get/create a image library for
 */
export async function getOrCreateDefaultAccountImageLibrary(accountGUID: string) {
  const mutationResult = await apolloClient.mutate<
    GetOrCreateDefaultAccountImageLibraryMutationResult,
    GetOrCreateDefaultAccountImageLibraryMutationVariables
  >({
    mutation: GetOrCreateDefaultAccountImageLibraryMutation,
    variables: {
      input: {
        accountGuid: accountGUID,
      },
    },
    update: (cache, { data }) => {
      if (!data) {
        return;
      }

      const { imageLibrary: createdOrUpdatedImageLibrary } =
        data.getOrCreateDefaultAccountImageLibrary;

      // Patch the newly created image library into the apollo cache entry for the account's image libraries
      createOrUpdateApolloCacheQueryEdges(cache, createdOrUpdatedImageLibrary, {
        query: accountImageLibraryQuery,
        variables: {
          accountGUID,
        },
        edgesDotPath: 'accountByGuid.imageLibraries.edges',
        edgeTypeName: 'ImageLibraryNodeEdge',
      });
    },
  });

  return mutationResult.data?.getOrCreateDefaultAccountImageLibrary ?? null;
}

const GET_OR_CREATE_DEFAULT_BUSINESS_IMAGE_LIBRARY_MUTATION = gql`
  ${imageLibraryFragments.imageLibrary.fragment}

  mutation GetOrCreateDefaultBusinessImageLibrary(
    $input: GetOrCreateDefaultBusinessImageLibraryMutationInput!
  ) {
    getOrCreateDefaultBusinessImageLibrary(input: $input) {
      imageLibrary {
        ...${imageLibraryFragments.imageLibrary.name}
      }
    }
  }
`;
type GetOrCreateDefaultBusinessImageLibraryMutationVariables = {
  input: GetOrCreateDefaultBusinessImageLibraryMutationInput;
};

type GetOrCreateDefaultBusinessImageLibraryMutationResult = {
  getOrCreateDefaultBusinessImageLibrary: {
    imageLibrary: ImageLibrary;
  };
};

/**
 * Mutation gets/creates a default BusinessImageLibrary + ImageLibrary for the given business
 *
 * @param {string} businessGUID   GUID of the business to get/create a image library for
 */
export async function getOrCreateDefaultBusinessImageLibrary(businessGUID: string) {
  const mutationResult = await apolloClient.mutate<
    GetOrCreateDefaultBusinessImageLibraryMutationResult,
    GetOrCreateDefaultBusinessImageLibraryMutationVariables
  >({
    mutation: GET_OR_CREATE_DEFAULT_BUSINESS_IMAGE_LIBRARY_MUTATION,
    variables: {
      input: {
        businessGuid: businessGUID,
      },
    },
    update: (cache, { data }) => {
      if (!data) {
        return;
      }

      const { imageLibrary: createdOrUpdatedImageLibrary } =
        data.getOrCreateDefaultBusinessImageLibrary;

      // Patch the newly created image library into the apollo cache entry for the business' image libraries
      createOrUpdateApolloCacheQueryEdges(cache, createdOrUpdatedImageLibrary, {
        query: businessImageLibraryQuery,
        variables: {
          businessGUID,
        },
        edgesDotPath: 'businessByGuid.imageLibraries.edges',
        edgeTypeName: 'ImageLibraryNodeEdge',
      });
    },
  });

  return mutationResult.data?.getOrCreateDefaultBusinessImageLibrary;
}

const ADD_IMAGE_TO_IMAGE_LIBRARY_MUTATION = gql`
  ${imageLibraryFragments.imageLibraryImage.fragment}

  mutation AddImageToImageLibraryMutation($input: AddImageToImageLibraryMutationInput!) {
    addImageToImageLibrary(input: $input) {
      createdImageLibraryImage {
        ...${imageLibraryFragments.imageLibraryImage.name}
      }
      updatedImageLibrary {
        id
        images {
          edges {
            node {
              ...${imageLibraryFragments.imageLibraryImage.name}
            }
          }
        }
      }
    }
  }
`;
interface AddImageToImageLibraryMutationResult {
  addImageToImageLibrary: {
    createdImageLibraryImage: ImageLibraryImage;
    updatedImageLibrary: Pick<ImageLibrary, '__typename' | 'id' | 'images'>;
  };
}

interface AddImageToImageLibraryMutationVariables {
  input: AddImageToImageLibraryMutationInput;
}

type ImageLibraryImageType = 'library_image' | 'business_image' | 'logo_image' | 'stock_image';

type ImageLibraryImageSource = 'shutterstock' | 'user_upload';

/**
 * Mutation adds an image to an image library
 *
 * @param {string} imageLibrarySlug        Unique slug identifying the ImageLibrary which we want to update
 * @param {Object} imageData
 * @param {string} imageData.imageFileName  Name/s3 url of the image file to add to the library
 * @param {string} imageData.width          The width of the image
 * @param {string} imageData.height         The height of the image
 */
export const addImageToImageLibrary = async (
  imageLibrarySlug: string,
  {
    imageFileName,
    width,
    height,
    imageType,
    imageSource,
    stockAssetID,
    stockSearchID,
  }: {
    imageFileName: string;
    width: number;
    height: number;
    imageType: ImageLibraryImageType;
    imageSource: ImageLibraryImageSource;
    stockAssetID?: string;
    stockSearchID?: string;
  },
) => {
  const mutationResult = await apolloClient.mutate<
    AddImageToImageLibraryMutationResult,
    AddImageToImageLibraryMutationVariables
  >({
    mutation: ADD_IMAGE_TO_IMAGE_LIBRARY_MUTATION,
    variables: {
      input: {
        imageLibrarySlug,
        imageFileName,
        imageWidth: width,
        imageHeight: height,
        imageType,
        source: imageSource,
        stockAssetId: stockAssetID,
        stockSearchId: stockSearchID,
      },
    },
  });

  return mutationResult.data?.addImageToImageLibrary ?? null;
};

const UPDATE_IMAGE_LIBRARY_IMAGE_MUTATION = gql`
  ${imageLibraryFragments.imageLibraryImage.fragment}

  mutation UpdateImageLibraryImage($input: UpdateImageLibraryImageMutationInput!) {
    updateImageLibraryImage(input: $input) {
      updatedImage {
        ...${imageLibraryFragments.imageLibraryImage.name}
      }
    }
  }
`;
interface UpdateImageLibraryImageMutationResult {
  updateImageLibraryImage: {
    updatedImage: ImageLibraryImage;
  };
}

interface UpdateImageLibraryImageMutationVariables {
  input: UpdateImageLibraryImageMutationInput;
}

/**
 * Mutation updates an ImageLibraryImage record
 *
 * @param {string} imageLibraryImageGUID
 * @param {Object} updateVariables
 * @param {boolean} [updateVariables.shouldRemove] - Set to true to update the image to be removed from its library
 * @param {boolean} [updateVariables.shouldRestore] - Set to true to update the image to be restored to its library, if it was removed
 * @param {string} [updateVariables.displayName] - Set a new display name on the image
 */
const updateImageLibraryImage = async (
  imageLibraryImageGUID: string,
  updateVariables: {
    shouldRemove?: boolean;
    shouldRestore?: boolean;
    displayName?: string;
  },
) => {
  const mutationResult = await apolloClient.mutate<
    UpdateImageLibraryImageMutationResult,
    UpdateImageLibraryImageMutationVariables
  >({
    mutation: UPDATE_IMAGE_LIBRARY_IMAGE_MUTATION,
    variables: {
      input: {
        guid: imageLibraryImageGUID,
        ...updateVariables,
      },
    },
  });

  return mutationResult.data?.updateImageLibraryImage ?? null;
};

/**
 * Updates an image library image to be removed from the image library
 * (it can still be found in the image restoration panel)
 *
 * @param {string} imageLibraryImageGUID
 */
export const removeImageLibraryImage = async (imageLibraryImageGUID: string) =>
  updateImageLibraryImage(imageLibraryImageGUID, {
    shouldRemove: true,
  });

/**
 * Updates a removed image library image to be restored to the image library
 *
 * @param {string} imageLibraryImageGUID
 */
export const restoreRemovedImageLibraryImage = async (imageLibraryImageGUID: string) =>
  updateImageLibraryImage(imageLibraryImageGUID, {
    shouldRestore: true,
  });
