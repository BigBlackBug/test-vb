// Vendor
import { useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { DERIVATIVES } from 'editor/constants/automatedVoiceOver';
import * as selectors from 'app/state/selectors/index.js';

// Local
import audioProcessingService from 'shared/services/AudioProcessingService';
import { accountAudioAssetQuery, AccountAudioAssetQueryResult } from './queries';
import { AccountAudioAsset } from './types';

/**
 * Attempts to fetch an AccountAudioAsset record for a given APS upload key.
 * This allows us to attempt to get info to display for the audio asset which is currently
 * applied to the video, if it was user-uploaded
 *
 * @param {string|null} uploadKey - The APS upload key for the audio asset, or null if there is no audio asset
 */
// eslint-disable-next-line import/prefer-default-export
export function useAccountAudioAssetForUploadKey(uploadKey: string | null): {
  accountAudioAsset: AccountAudioAsset | null;
  isLoading: boolean;
} {
  const { data, loading: isLoadingAssetData } = useQuery<AccountAudioAssetQueryResult>(
    accountAudioAssetQuery,
    {
      variables: {
        uploadKey,
      },
      skip: !uploadKey,
    },
  );
  const serviceAccessToken = useSelector(selectors.getServiceAccessToken);

  const [isLoadingAssetURL, setIsLoadingAssetURL] = useState(false);
  const [formattedAudioAsset, setFormattedAudioAsset] = useState<AccountAudioAsset | null>(null);
  const unformattedAsset = data?.accountAudioAssetForUploadKey;

  useEffect(() => {
    if (unformattedAsset) {
      (async () => {
        setIsLoadingAssetURL(true);
        try {
          const { uploadKey: assetUploadKey, length, displayName, source } = unformattedAsset;

          const previewURL = await audioProcessingService.getAudioAssetURL(
            DERIVATIVES.webPlayer,
            assetUploadKey,
            serviceAccessToken,
          );

          setFormattedAudioAsset({
            uploadKey: assetUploadKey,
            previewURL,
            length,
            displayName,
            source,
          });
        } catch (err) {
          console.error('Failed to derive audio asset URL:', err);
        } finally {
          setIsLoadingAssetURL(false);
        }
      })();
    } else {
      setFormattedAudioAsset(null);
    }
  }, [unformattedAsset, uploadKey, serviceAccessToken]);

  return {
    accountAudioAsset: formattedAudioAsset,
    isLoading: isLoadingAssetData || isLoadingAssetURL,
  };
}
