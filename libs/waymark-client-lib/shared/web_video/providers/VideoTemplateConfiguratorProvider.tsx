// Vendor
import _ from 'lodash';
import { useState, useEffect, useContext, useCallback, useRef, createContext } from 'react';

// Local
import { VideoDescriptor } from '@libs/shared-types';
import {
  VideoTemplateCoordinator,
  GetConfiguratorInterruptedException,
} from 'app/utils/VideoTemplateCoordinator.js';
import { waitFor } from 'shared/utils/async.js';
import useEvent from 'shared/hooks/useEvent';
import WaymarkAuthorConfigurator from '../configurator/WaymarkAuthorConfigurator';

export const VideoTemplateConfiguratorContext = createContext<WaymarkAuthorConfigurator | null>(
  null,
);

interface VideoTemplateConfiguratorProviderProps {
  videoDescriptor: VideoDescriptor | null;
  studioPreviewOverrides?: {
    formDescription: Record<string, unknown>;
    editingActions: Record<string, unknown>;
    projectManifest: Record<string, unknown>;
  } | null;
  videoKey?: string;
  onConfiguratorChangeApplied?: ((configurator: WaymarkAuthorConfigurator) => void) | null;
  children: React.ReactNode;
}

/**
 * Provider gives all wrapped children access to the current video template configurator
 * via VideoTemplateConfiguratorContext
 *
 * @param {object} props  Props to pass through to the provider - mostly just interested in props.children
 */
export const VideoTemplateConfiguratorProvider = ({
  videoDescriptor = null,
  studioPreviewOverrides = null,
  videoKey = '',
  onConfiguratorChangeApplied = null,
  children,
}: VideoTemplateConfiguratorProviderProps) => {
  // We will create a stable VideoTemplateCoordinator instance for each instance of this provider
  const coordinatorRef = useRef<VideoTemplateCoordinator>();
  if (!coordinatorRef.current) {
    // This is where we create our new configurator
    coordinatorRef.current = new VideoTemplateCoordinator();
  }

  // Keeps track of the current configurator from the template coordinator
  const [configurator, setConfigurator] = useState(() => coordinatorRef?.current?.configurator);
  const previousVideoKey = useRef<string>();

  useEffect(() => {
    // Set up the coordinator with the current video spec
    if (!_.isEmpty(videoDescriptor)) {
      const coordinator = coordinatorRef.current;

      if (!coordinator) {
        return;
      }

      // If the videoKey prop changed, we should force a new configurator to be created even if it's
      // the same variant
      const shouldForceCreateNewConfigurator = videoKey !== previousVideoKey.current;
      previousVideoKey.current = videoKey;

      coordinator
        .getConfigurator(videoDescriptor, studioPreviewOverrides, shouldForceCreateNewConfigurator)
        .catch((error) => {
          // It's fine in this context if `getConfigurator` throws the `GetConfiguratorInterruptedException`
          // error, as that will indicate that multiple calls occurred in quick succession and the older
          // calls are being rejected as they progress through the asynchronous portions of the method.
          // Otherwise pass the error up to the caller of `updateConfigurator`.
          if (!(error instanceof GetConfiguratorInterruptedException)) {
            throw error;
          }
        });
    }
  }, [studioPreviewOverrides, videoDescriptor, videoKey]);

  useEffect(() => {
    const coordinator = coordinatorRef.current;

    if (!coordinator) {
      return;
    }

    // On mount, hook up an `onChangedConfigurator` listener to the template coordinator
    // that will keep our configurator value up to date if/when it changes
    const onConfiguratorChange = () => {
      setConfigurator(coordinator.configurator);
    };
    coordinator.addListener('changedConfigurator', onConfiguratorChange);

    // On unmount, perform cleanup by removing the listener we added to the template coordinator
    return () => {
      coordinator.removeListener('changedConfigurator', onConfiguratorChange);
      coordinator.releaseConfigurator();
    };
  }, []);

  const stableOnConfiguratorChangeApplied = useEvent(onConfiguratorChangeApplied);

  useEffect(() => {
    if (!configurator) {
      return;
    }

    const onApplyChange = () => {
      stableOnConfiguratorChangeApplied?.(configurator);
    };

    configurator.renderer.on('applyChange:end', onApplyChange);

    return () => {
      configurator.renderer.off('applyChange:end', onApplyChange);
    };
  }, [stableOnConfiguratorChangeApplied, configurator]);

  return (
    <VideoTemplateConfiguratorContext.Provider value={configurator ?? null}>
      {children}
    </VideoTemplateConfiguratorContext.Provider>
  );
};

/**
 * Hook basically just provides some nice syntactical sugar for accessing the current
 * configurator from the VideoTemplateConfiguratorContext
 */
export const useVideoTemplateConfigurator = () => {
  const configurator = useContext(VideoTemplateConfiguratorContext);

  return configurator;
};

/**
 * Hook returns whether the current configurator is setup or not.
 */
export const useIsConfiguratorSetup = () => {
  const configurator = useVideoTemplateConfigurator();

  const [isSetup, setIsSetup] = useState(() => configurator?.isSetup() ?? false);

  useEffect(() => {
    if (!configurator) {
      return;
    }

    if (configurator.isSetup()) {
      setIsSetup(true);
    } else {
      const onSetup = () => {
        setIsSetup(true);
      };
      configurator.on('setup', onSetup);
      return () => {
        configurator.off('setup', onSetup);
      };
    }
  }, [configurator]);

  return isSetup;
};

/**
 * Hook returns framerate defined by the WaymarkAuthorWebRenderer instance attached to the configurator.
 */
export const useRendererFramerate = () => {
  const configurator = useVideoTemplateConfigurator();

  return _.get(configurator, 'renderer.framerate');
};

/**
 * Hook provides access to a nice convenient function that will safely jump
 * the video to a given time in seconds.
 * This is used heavily throughout the editor for jumping to the display time of an
 * editor field.
 */
export const useJumpVideoToTime = () => {
  const configurator = useVideoTemplateConfigurator();

  const jumpVideoToTime = useCallback(
    async (newTime) => {
      // Using `waitFor` so that we can safely handle attempts to jump to a time
      // in the video while the video is still loading
      await waitFor(() => configurator?.isSafeToDisplay());
      await configurator?.goToTimeInSeconds(newTime);
    },
    [configurator],
  );

  return jumpVideoToTime;
};

/**
 * Hook that provides an interface to pause video playback.
 * @return {func}   Function to pause video playback.
 */
export const usePauseVideoPlayback = () => {
  // Going to use the configurator to pause/resume the video for a better
  // user experience while the new editor options are loading.
  const configurator = useVideoTemplateConfigurator();

  // Memoizing with useCallback to prevent potential undesired re-renders
  // in components that use this
  const pauseVideoPlayback = useCallback(async () => {
    const isPlaying = configurator?.isPlaying();
    if (isPlaying) {
      // Stop the template so we don't have competing audio playing.
      await configurator?.stop();
    }
  }, [configurator]);

  return pauseVideoPlayback;
};
