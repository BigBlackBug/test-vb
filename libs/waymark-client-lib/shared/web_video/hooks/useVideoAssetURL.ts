import { useEffect, useState } from 'react';
import { getAssetUrl } from 'shared/WaymarkAuthorWebRenderer';
import { safeSessionStorage } from 'shared/utils/safeStorage';

const getCacheID = (vpsKey: string) => `vpsURLCache:${vpsKey}`;

// Caching URLs in session storage instead of an in-memory object to reduce our memory usage;
// session storage will be a little slower to access, but we won't be hitting it very often.
const getCachedAssetURL = (vpsKey: string) => safeSessionStorage.getItem(getCacheID(vpsKey));
const setCachedAssetURL = (vpsKey: string, url: string) =>
  safeSessionStorage.setItem(getCacheID(vpsKey), url);

/**
 * Give a video asset's VPS key, loads and returns the best URL
 * for that video asset.
 */
export const useVideoAssetURL = (vpsKey: string) => {
  const [assetURL, setAssetURL] = useState<string | null>(() => getCachedAssetURL(vpsKey));

  useEffect(() => {
    if (!vpsKey) {
      return;
    }

    let hasCleanedUp = false;

    const cachedAssetURL = getCachedAssetURL(vpsKey);
    if (cachedAssetURL) {
      setAssetURL(cachedAssetURL);
    } else {
      getAssetUrl({
        type: 'video',
        location: {
          plugin: 'waymark-vps',
          sourceVideo: vpsKey,
        },
      }).then((url) => {
        setCachedAssetURL(vpsKey, url);
        if (!hasCleanedUp) {
          // Avoid updating state after this hook has been cleaned up
          setAssetURL(url);
        }
      });
    }

    return () => {
      hasCleanedUp = true;
    };
  }, [vpsKey]);

  return assetURL;
};
