// Vendor
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';

// App
import { getBusinessRefetchQuery } from 'shared/api/graphql/businesses/queries';
import {
  useBusinessVideoAssets,
  useCreateBusinessLibraryVideoMutation,
  videoLibraryQueries,
} from 'app/hooks/videoLibraries';
import UploadingAsset from 'app/models/core/UploadingAsset';

// Editor
import { VideoLibrarySection } from 'editor/components/VideoLibrarySection';
import { mediaTypes } from 'editor/constants/mediaLibraries';
import { createUserEditorAssets } from 'editor/utils/mediaLibraries';
import { configureVideoLibrarySections } from 'editor/utils/videoLibraries';

// Local
import { VIDEO_LIBRARY_SECTION_CONFIGS } from './constants';

interface BrandModalVideoLibraryPanelProps {
  // ID of the business to upload video assets to
  businessGUID: string;
  // ID of the dropzone target to upload video assets to
  dropZoneTargetId: string;
  // Array of video assets currently being uploaded
  uploadingVideoAssets?: UploadingAsset[];
  // Function to set the array of video assets currently being uploaded
  setUploadingVideoAssets?: Dispatch<SetStateAction<UploadingAsset[]>>;
}

export default function BrandModalVideoLibraryPanel({
  businessGUID,
  dropZoneTargetId,
  uploadingVideoAssets,
  setUploadingVideoAssets,
}: BrandModalVideoLibraryPanelProps) {
  const businessVideoAssets = useBusinessVideoAssets(businessGUID);

  const videoAssets = useMemo(
    () =>
      createUserEditorAssets(mediaTypes.footage, {
        account: {},
        business: businessVideoAssets,
      }),
    [businessVideoAssets],
  );

  const { activeSections } = useMemo(
    () => ({
      activeSections: configureVideoLibrarySections(videoAssets, VIDEO_LIBRARY_SECTION_CONFIGS),
    }),
    [videoAssets],
  );

  const refreshBusinessVideoCountQuery = useMemo(
    () => getBusinessRefetchQuery(businessGUID, ['totalVideoCount']),
    [businessGUID],
  );

  const [createBusinessLibraryVideo] = useCreateBusinessLibraryVideoMutation();

  const createVideoAsset = useCallback(
    async (videoAssetData) => {
      await createBusinessLibraryVideo({
        variables: {
          input: {
            ...videoAssetData,
            businessGuid: businessGUID,
          },
        },
        refetchQueries: [
          {
            query: videoLibraryQueries.business,
            variables: {
              businessGUID: businessGUID,
            },
          },
          refreshBusinessVideoCountQuery,
        ],
      });
    },
    [businessGUID, createBusinessLibraryVideo, refreshBusinessVideoCountQuery],
  );

  return (
    <VideoLibrarySection
      dropZoneTargetId={dropZoneTargetId}
      library={activeSections[0]}
      createVideoAsset={createVideoAsset}
      refreshBusinessVideoCountQuery={refreshBusinessVideoCountQuery}
      uploadingVideoAssets={uploadingVideoAssets}
      setUploadingVideoAssets={setUploadingVideoAssets}
      businessGUID={businessGUID}
    />
  );
}
