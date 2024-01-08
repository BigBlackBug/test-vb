// Vendor
import _ from 'lodash';
import classNames from 'classnames';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

// Shared UI
import { mediaQueries, themeVars } from '@libs/shared-ui-styles';
import { VideoConfiguration, VideoFieldConfigurationValue } from '@libs/shared-types';

// WAYMARK APP DEPENDENCIES
import PopupLabelWrapper from 'app/components/PopupLabelWrapper';
import ToggleCollapseTransition from 'app/components/ToggleCollapseTransition';
import { HelpQuestionMarkIcon } from 'app/icons/ContactAndHelpIcons';
import { CloseIcon } from 'app/icons/BasicIcons';

// Shared
import MobileVideoControls from 'shared/web_video/components/MobileVideoControls';
import DesktopVideoControls from 'shared/web_video/components/DesktopVideoControls';
import ConfiguratorCanvas from 'shared/web_video/components/ConfiguratorCanvas';
import { useVideoTemplateConfigurator } from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import { PlaybackState, playbackStates } from 'shared/web_video/constants/videoPlayer';
import { PlayIconRound, PauseIconRound } from 'shared/components/VideoPlayerIcons';
import {
  addFullscreenEventListener,
  exitFullscreen,
  isFullscreenEnabled,
  requestFullscreen,
} from 'shared/utils/dom.js';
import WaymarkAuthorWebRenderer from 'shared/WaymarkAuthorWebRenderer.js';
import { ExternalLink } from 'shared/components/WaymarkLinks';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { formatFrameAsTimeString } from 'shared/utils/text.js';
import useEvent from 'shared/hooks/useEvent';
import { useMediaQuery } from 'shared/hooks/useMediaQuery';

import * as styles from './VideoPlayer.css';

const isAudioContextSupported = window.AudioContext !== undefined;

/**
 *  Shows a warning if audio context is unsupported in this browser and the video's configuration
 *    includes a video clip with playback speed adjustments applied to it. This is necessary because
 *    without AudioContext we are unable to correct the clip's pitch, resulting in it sounding off compared
 *    to how the render will turn out.
 *
 * @param {object}  configuration   The video's current configuration
 * @param {number}  framerate       The video's framerate
 */
const AudioSpeedAdjustmentWarning = ({
  configuration = null,
  framerate = null,
}: {
  configuration?: VideoConfiguration | null;
  framerate?: number | null;
}) => {
  const [isWarningVisible, setIsWarningVisible] = useState(false);

  const [configurationVideoFieldKeys, setConfigurationVideoFieldKeys] = useState<string[] | null>(
    null,
  );

  // Effect gets all keys for video fields in the configuration so we can quickly access those without
  // having to search through the whole configuration on every change
  useEffect(() => {
    // If we already found field keys for this configuration, do nothing
    if (configurationVideoFieldKeys || !configuration) {
      return;
    }

    const configurationKeyValuePairs = Object.entries(configuration);

    const videoFieldEntries = configurationKeyValuePairs.filter(
      (entry) => _.get(entry[1], 'content.type') === 'video',
    );

    const videoFieldKeys = videoFieldEntries.map(([key]) => key);

    setConfigurationVideoFieldKeys(videoFieldKeys);
  }, [configuration, configurationVideoFieldKeys]);

  useEffect(() => {
    if (isAudioContextSupported || !configurationVideoFieldKeys || !framerate || !configuration) {
      setIsWarningVisible(false);
      return;
    }

    // Check if any of the configuration's video fields will have speed adjustments applied to them
    for (
      let i = 0, numVideoFields = configurationVideoFieldKeys.length;
      i < numVideoFields;
      i += 1
    ) {
      const { contentPlaybackDuration, contentTrimDuration, isMuted } = configuration[
        configurationVideoFieldKeys[i]
      ] as VideoFieldConfigurationValue;

      // Only check for speed adjustment issues if the clip isn't muted and has a trim duration set on it
      if (!isMuted && contentPlaybackDuration && contentTrimDuration) {
        // contentTrimDuration is in seconds so convert it to frames for comparison against contentPlaybackDuration
        const contentTrimDurationInFrames = Math.floor(contentTrimDuration / framerate);

        // If contentTrimDuration is greater than contentPlaybackDuration, that means that the renderer will
        // speed up the video clip
        // Leaving 1 frame of wiggle room for imprecision in the conversion process
        if (contentTrimDurationInFrames - contentPlaybackDuration > 1) {
          setIsWarningVisible(true);
          return;
        }
      }
    }

    setIsWarningVisible(false);
  }, [configuration, configurationVideoFieldKeys, framerate]);

  return isWarningVisible ? (
    <ToggleCollapseTransition
      isVisible={isWarningVisible}
      className={styles.AudioSpeedAdjustmentWarningWrapper}
      contentsWrapperClassName={styles.AudioSpeedAdjustmentWarning}
    >
      <p className={styles.WarningMessage}>
        This browser has a speed adjustment issue. Your final file will not be affected.&nbsp;
        <PopupLabelWrapper
          label="A clip in this video is using a speed adjustment. Previews on Safari and on iPhones don't allow you to speed up audio, so some audio may seem out of sync or cut off. That won't be a problem with your final file, but you can open this video in another browser (e.g. Chrome) if you want a more precise preview."
          className={styles.WarningTooltipWrapper}
        >
          <HelpQuestionMarkIcon />
        </PopupLabelWrapper>
      </p>
      <WaymarkButton onClick={() => setIsWarningVisible(false)} className={styles.DismissButton}>
        <CloseIcon />
      </WaymarkButton>
    </ToggleCollapseTransition>
  ) : null;
};

// Special fancy loading spinner for the video player
const VideoPlayerRotatingLoader = (props: React.ComponentPropsWithoutRef<'svg'>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" {...props}>
    <title>Loading</title>
    <g stroke="none" fill="none">
      <rect fill={themeVars.color.surface._56} x="0" y="0" width="80" height="80" rx="50%" />
      <path
        d="M76,40 C76,59.882251 59.882251,76 40,76 C20.117749,76 4,59.882251 4,40 C4,20.117749 20.117749,4 40,4"
        stroke={themeVars.color.white}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

interface VideoPlayerProps {
  /**
   * Whether we should make sure to hide any potentially Waymark-branded UI elements
   * @default false
   */
  isWhiteLabeled?: boolean;
  /**
   * Class name to apply custom styles to the component's outer div
   * @default null
   */
  className?: string | null;
}

export default function VideoPlayer({
  isWhiteLabeled = false,
  className = null,
}: VideoPlayerProps) {
  const [isFullScreen, setIsFullScreen] = useState(() => isFullscreenEnabled());

  const isTouchScreen = useMediaQuery(mediaQueries.pointer.touchscreen);
  const isMobileScreenSize = useMediaQuery(mediaQueries.breakpoints.mobile);

  // Use the mobile player controls if the device is touchscreen or just within our mobile breakpoint
  // because it looks and works better on smaller screens
  const shouldUseMobileControls = isTouchScreen || isMobileScreenSize;

  const configurator = useVideoTemplateConfigurator();

  // Figure out what the current playback state is
  const deriveCurrentPlaybackState = useEvent((): PlaybackState => {
    if (!configurator?.renderer?.isSetup) {
      return playbackStates.loading;
    }

    if (configurator.renderer.isLoading) {
      return playbackStates.loadingChanges;
    }

    if (configurator.isCompleted()) {
      return playbackStates.ended;
    }

    if (configurator.isPlaying()) {
      return playbackStates.playing;
    }

    if (configurator.hasVideoBeenStarted()) {
      return playbackStates.paused;
    }

    return playbackStates.waitingToPlay;
  });
  // Tracks the current playback state
  const [videoPlaybackState, setVideoPlaybackState] = useState<PlaybackState>(
    deriveCurrentPlaybackState,
  );

  const [currentFrame, setCurrentFrame] = useState(() =>
    configurator ? configurator.getCurrentFrame() : 0,
  );

  const framerate = configurator ? configurator.getFramerate() : null;
  const totalFrames = configurator ? configurator.getTotalFrames() : null;

  // Format our frame numbers as timestamp strings based on the framerate, ie frame 30 -> "0:01"
  const currentTimeString = framerate ? formatFrameAsTimeString(currentFrame, 1 / framerate) : '';
  const totalTimeString =
    framerate && totalFrames ? formatFrameAsTimeString(totalFrames, 1 / framerate) : '';

  const videoPlayerElementRef = useRef<HTMLDivElement>(null);

  const goToFramePromiseRef = useRef<Promise<void> | undefined | null>(null);

  const [shouldShowPlayPauseOverlayIcon, setShouldShowPlayPauseOverlayIcon] = useState(false);
  const hidePlayPauseIconTimeoutRef = useRef<number>();

  const [shouldShowControls, setShouldShowControls] = useState(false);
  const hideControlsTimeoutRef = useRef<number>();

  useEffect(() => {
    if (!configurator) {
      return;
    }

    // Set up event listener to pause the video when the user switches to a different tab
    // This is necessary because most browsers will suspend requestAnimationFrame update loops until the user returns,
    // causing the renderer to stop while the audio continues playing out of sync
    const onDocumentVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        configurator.stop();
      }
    };

    document.addEventListener('visibilitychange', onDocumentVisibilityChange);

    return () => {
      // Ensure we stop playback if the configurator changes or the player is unmounting
      configurator.stop();

      // Clean up our event listener
      document.removeEventListener('visibilitychange', onDocumentVisibilityChange);
    };
  }, [configurator]);

  /**
   * Hides the video player controls immediately
   *
   * Using useCallback because we have an effect which uses this function as a dependency
   */
  const hideControls = useCallback(() => {
    clearTimeout(hideControlsTimeoutRef.current);

    setShouldShowControls(false);
  }, []);

  /**
   * Shows the video player controls and optionally hides them again after a delay
   *
   * @param {number}  [hideTimeoutDuration]   Time in milliseconds to wait before hiding the controls again after showing them.
   *                                            If this is not provided, the controls will remain open until something else manually triggers a
   *                                            call to hideControls()
   *
   * Using useCallback because we have an effect which uses this function as a dependency
   */
  const showControls = useCallback((hideTimeoutDuration = null) => {
    clearTimeout(hideControlsTimeoutRef.current);

    setShouldShowControls(true);

    if (hideTimeoutDuration) {
      // Set a timeout to hide the controls again after the desired duration
      hideControlsTimeoutRef.current = window.setTimeout(
        () => setShouldShowControls(false),
        hideTimeoutDuration,
      );
    }
  }, []);

  useEffect(() => {
    // Listen for any configurator/renderer events which could be indicators that the video's playback state has changed,
    // and update our state to reflect that
    if (!configurator) {
      return undefined;
    }

    setVideoPlaybackState(deriveCurrentPlaybackState());

    // When setup starts, that means we're loading the video for the first time
    const onSetupStart = () => {
      setVideoPlaybackState(playbackStates.loading);
    };
    configurator.renderer.on('setup:start', onSetupStart);

    // When setup ends, that means the video is now ready and waiting to play
    const onSetupEnd = () => {
      setVideoPlaybackState(playbackStates.waitingToPlay);
    };
    configurator.renderer.on('setup:end', onSetupEnd);

    // When playback starts, that means the video is now playing
    const onPlay = () => {
      setVideoPlaybackState(playbackStates.playing);
    };
    configurator.renderer.on('playback:play', onPlay);

    // When playback stops, that means the video is now paused or ended
    const onStop = () => {
      setVideoPlaybackState(
        configurator.isCompleted() ? playbackStates.ended : playbackStates.paused,
      );
    };
    configurator.renderer.on('playback:stop', onStop);

    // When changes start to be applied, we should show that changes are being loaded
    const onApplyChangeStart = () => {
      if (!configurator.renderer.isSetup) {
        // If the renderer isn't finished setting up yet, ignore this event
        return;
      }

      setVideoPlaybackState(playbackStates.loadingChanges);
    };
    configurator.renderer.on('applyChange:start', onApplyChangeStart);
    configurator.renderer.on('applyChangeList:start', onApplyChangeStart);

    // When changes finish being applied, the video is probably paused but we can't
    // say that with 100% certainty, so we'll just re-calculate the playback state from scratch
    const onApplyChangeEnd = () => {
      setVideoPlaybackState(deriveCurrentPlaybackState());
    };
    configurator.renderer.on('applyChange:end', onApplyChangeEnd);
    configurator.renderer.on('applyChangeList:end', onApplyChangeEnd);

    return () => {
      configurator.renderer.off('setup:start', onSetupStart);
      configurator.renderer.off('setup:end', onSetupEnd);
      configurator.renderer.off('playback:play', onPlay);
      configurator.renderer.off('playback:stop', onStop);
      configurator.renderer.off('applyChange:start', onApplyChangeStart);
      configurator.renderer.off('applyChangeList:start', onApplyChangeStart);
      configurator.renderer.off('applyChange:end', onApplyChangeEnd);
      configurator.renderer.off('applyChangeList:end', onApplyChangeEnd);
    };
  }, [configurator, deriveCurrentPlaybackState]);

  useEffect(() => {
    switch (videoPlaybackState) {
      case playbackStates.playing:
        hideControls();
        break;
      case playbackStates.paused:
        showControls(1000);
        break;
      default:
    }
  }, [hideControls, showControls, videoPlaybackState]);

  useEffect(() => {
    // Set up an event listener to keep our `isFullscreen` state updated as the user
    // toggles the player in and out of fullscreen mode
    // This is mostly necessary because browsers can close fullscreen mode on their own
    // when the user hits the escape key
    const removeEventListener = addFullscreenEventListener(() =>
      setIsFullScreen(isFullscreenEnabled()),
    );

    return () => removeEventListener();
  }, []);

  useEffect(
    () => () => {
      // Ensure we clean up any potentially outstanding timeouts when the component is unmounted
      clearTimeout(hideControlsTimeoutRef.current);
      clearTimeout(hidePlayPauseIconTimeoutRef.current);
    },
    [],
  );

  // Toggles the player between inline and fullscreen mode depending on
  // whichever fullscreen state it's currently in
  const onClickToggleFullScreen = useEvent(() => {
    const isVideoFullscreen = isFullscreenEnabled();

    if (isVideoFullscreen) {
      exitFullscreen();
    } else {
      requestFullscreen(videoPlayerElementRef.current);
    }
  });

  /**
   * Seek to a new frame in the video
   *
   * @param {number}  frameNumber   The frame number to seek the video player to
   */
  const goToFrame = useEvent((frameNumber: number) => {
    // Keep a ref to our pending goToFrame promise so we can safely await it
    // to ensure we don't try to resume playback while the video is still seeking
    goToFramePromiseRef.current = configurator?.goToFrame(frameNumber);

    // Flash the controls for 3 seconds when the user jumps to a new frame
    showControls(3000);
  });

  /**
   * Start playing the video
   */
  const playVideo = useEvent(async () => {
    // Ensure we wait for the latest call to goToFrame to resolve before attempting to play
    const goToFramePromise = goToFramePromiseRef.current;
    if (goToFramePromise) {
      await goToFramePromise;
    }

    configurator?.play();

    // Hide the controls
    hideControls();
  });

  /**
   * Toggle the video between playing and paused states
   */
  const onClickTogglePlayPause = useEvent(async () => {
    if (!configurator) {
      return;
    }
    const hasVideoBeenStarted = configurator.hasVideoBeenStarted();

    if (configurator.isPlaying()) {
      // If the video is playing, stop it
      configurator.stop();
    } else {
      // If the video was paused, play it
      playVideo();
    }

    if (hasVideoBeenStarted) {
      // If we didn't just start playing the video for the very first time, flash an icon
      // indicating how the playback state was just changed
      setShouldShowPlayPauseOverlayIcon(true);

      // Hide the icon again after 400ms so we only quickly flash it
      hidePlayPauseIconTimeoutRef.current = window.setTimeout(
        () => setShouldShowPlayPauseOverlayIcon(false),
        400,
      );
    }
  });

  const [isScrubbing, setIsScrubbing] = useState(false);
  const wasPlayingBeforeScrubbingRef = useRef(false);

  const onScrubStart = useEvent(() => {
    wasPlayingBeforeScrubbingRef.current = configurator?.isPlaying() ?? false;
    setIsScrubbing(true);
  });
  const onScrubEnd = useEvent(() => {
    setIsScrubbing(false);

    // If the video was playing before the scrub action started, resume playback
    if (wasPlayingBeforeScrubbingRef.current) {
      playVideo();
      wasPlayingBeforeScrubbingRef.current = false;
    }
  });

  /**
   * Jumps the video back to the first frame and starts playing
   */
  const onClickRestart = useEvent(async () => {
    // Jump back to the first frame
    goToFrame(0);
    // Start playing the video from the first frame as soon as it finishes seeking
    playVideo();
  });

  // When the user interacts with the player by mousing over it, focusing on it, tapping it, etc, briefly flash the controls
  // for 3 seconds
  const onUserInteractedWithPlayer = useEvent(() => {
    showControls(3000);
  });

  // The controls should be visible if the user has interacted with the video plaer
  // by moving their mouse over it or touching it, or no matter what if the player is in certain other states
  const areControlsVisible =
    shouldShowControls ||
    // Controls should stay visible no matter what while the video is loading or has reached the end
    videoPlaybackState === playbackStates.loadingChanges ||
    videoPlaybackState === playbackStates.ended ||
    // Controls should stay visible no matter what while the video is being scrubbed
    isScrubbing;

  useEffect(() => {
    // If the controls aren't currently visible, just cancel the frame update loop and don't worry about it.
    // We can do this because the `currentFrame` state value is only used for visual stuff in the controls'
    // UI, so if the controls are hidden there's no point in keeping it up to date
    if (!configurator || !areControlsVisible) {
      return undefined;
    }

    // Every time the video's time updates, it emits a `tick` event, so watch that for any changes to the current frame
    const onConfiguratorTick = () => setCurrentFrame(configurator.getCurrentFrame());
    configurator.on('tick', onConfiguratorTick);

    // Run one update once immediately to make sure our state is in sync
    onConfiguratorTick();

    return () => configurator.off('tick', onConfiguratorTick);
  }, [areControlsVisible, configurator]);

  const shouldShowDeviceUnsupportedError = useMemo(() => {
    const rendererSupportLevel = WaymarkAuthorWebRenderer.analyzeSupport();

    // Check if this device does not support the Waymark Author Renderer at all
    const isDeviceUnsupported =
      rendererSupportLevel === WaymarkAuthorWebRenderer.SUPPORT.UNSUPPORTED;

    // Check if this device technically supports the Waymark Author Renderer, but only so much so that it would still have to run
    // with greatly degraded performance -- for now at least, even though a browser with this support level could technically work,
    // we are still going to fully disable playback because the degraded experience isn't up to our standards
    const doesDeviceHaveReducedPerformance =
      rendererSupportLevel === WaymarkAuthorWebRenderer.SUPPORT.REDUCED_PERFORMANCE;

    return isDeviceUnsupported || doesDeviceHaveReducedPerformance;
  }, []);

  if (shouldShowDeviceUnsupportedError) {
    return (
      <div className={styles.VideoPlayerUnsupportedError}>
        {isWhiteLabeled ? (
          <p>
            Sorry, the system you’re using doesn’t support the latest performance features required
            for this video player. Please try another browser (e.g. Chrome, Safari, or Firefox) and
            make sure you’re running the latest operating system (Mac) or graphics driver (Windows).
            If you’re still having trouble, contact your representative.
          </p>
        ) : (
          <p>
            Sorry, the system you’re using doesn’t support the latest performance features required
            for this video player. Please try another browser (e.g. Chrome, Safari, or Firefox) or{' '}
            <ExternalLink
              linkTo="https://help.waymark.com/en/articles/4534111-the-waymark-video-player-won-t-load"
              shouldOpenInNewTab
              colorTheme="PrimaryText"
              underlineMode="hover"
            >
              take a look at our help docs for more info.
            </ExternalLink>
          </p>
        )}
      </div>
    );
  }

  return configurator ? (
    <>
      {!isAudioContextSupported && (
        <AudioSpeedAdjustmentWarning
          configuration={configurator.configuration}
          framerate={framerate}
        />
      )}
      <div
        className={classNames(styles.VideoPlayer, className)}
        {...styles.dataPlaybackState(videoPlaybackState)}
        {...styles.dataIsFullscreen(isFullScreen)}
        ref={videoPlayerElementRef}
      >
        <div
          className={styles.VideoPlayerOverlay}
          onClick={() => {
            // If the video hasn't been started, play the video when the user clicks on the poster overlay
            if (videoPlaybackState === playbackStates.waitingToPlay) {
              playVideo();
            }
          }}
          onKeyDown={() => {
            if (videoPlaybackState === playbackStates.waitingToPlay) {
              playVideo();
            }
          }}
          role="button"
          // Disable tabbing this overlay once the video has started
          tabIndex={videoPlaybackState === playbackStates.waitingToPlay ? -1 : 0}
        >
          {/* Loading icon displays whenever video is loading and isn't at the end */}
          <VideoPlayerRotatingLoader
            className={styles.LoadingOverlayIcon}
            {...styles.dataIsIconVisible(
              videoPlaybackState === playbackStates.loading ||
                videoPlaybackState === playbackStates.loadingChanges,
            )}
          />
          <PlayIconRound
            className={styles.OverlayIcon}
            {...styles.dataIsIconVisible(
              videoPlaybackState === playbackStates.waitingToPlay ||
                // On desktop, we also want to flash the play icon to reflect
                // playback state changes when the user plays the video
                (!shouldUseMobileControls &&
                  shouldShowPlayPauseOverlayIcon &&
                  videoPlaybackState === playbackStates.playing),
            )}
          />
          {!shouldUseMobileControls && (
            // On desktop, flash pause icon to reflect playback state changes when the user pauses the video
            <PauseIconRound
              className={styles.OverlayIcon}
              {...styles.dataIsIconVisible(
                shouldShowPlayPauseOverlayIcon && videoPlaybackState === playbackStates.paused,
              )}
            />
          )}
        </div>
        <ConfiguratorCanvas configurator={configurator} id="video-player" />
        {/* Display appropriate controls depending on if on mobile or desktop view */}
        <div
          className={styles.VideoPlayerControls}
          {...styles.dataAreControlsVisible(areControlsVisible)}
          {...styles.dataIsUsingMobileControls(shouldUseMobileControls)}
          id="video-player-controls"
          aria-controls="video-player"
          onMouseMove={onUserInteractedWithPlayer}
          onFocus={onUserInteractedWithPlayer}
          onTouchEnd={(event) => {
            // Fun fact! Browsers will fire a cocktail of mouse events along with touch interactions like so:
            // `onTouchEnd` -> `onMouseMove` -> `onMouseDown` -> `onMouseUp` -> `onClick`
            // As a result, our mouse events defined above will interfere with our desired behavior for this `onTouchEnd` event.
            // To prevent this from happening, we simply need to call `event.preventDefault()`.
            // However, it should be noted that doing this will also disable `onClick` events from firing on children
            // of this element. To get around this, we simply need to add an `onTouchEnd` listener to any clickable element
            // which calls `event.stopPropagation()` so that the touch and subsequent click event handling will stay contained to the
            // target element. This is obviously all a bit of a hassle, but it is still way cleaner than most other options
            // for ensuring we maintain proper support for both mouse and touch interactions.
            event.preventDefault();

            // Toggle whether the controls are visible or not
            if (shouldShowControls) {
              hideControls();
            } else {
              onUserInteractedWithPlayer();
            }
          }}
          onMouseOut={(event) => {
            // Ensure that the new element that the mouse moved over is not a child of this element
            if (
              !event.relatedTarget ||
              !(event.relatedTarget as HTMLElement).closest('#video-player-controls')
            ) {
              hideControls();
            }
          }}
          onBlur={hideControls}
        >
          {/* Only render controls if the configurator is setup  */}
          {configurator.isSetup() &&
            (shouldUseMobileControls ? (
              <MobileVideoControls
                videoPlaybackState={videoPlaybackState}
                onClickTogglePlayPause={onClickTogglePlayPause}
                onClickRestart={onClickRestart}
                currentTimeString={currentTimeString}
                totalTimeString={totalTimeString}
                goToFrame={goToFrame}
                onScrubStart={onScrubStart}
                onScrubEnd={onScrubEnd}
              />
            ) : (
              <DesktopVideoControls
                configurator={configurator}
                videoPlaybackState={videoPlaybackState}
                onClickTogglePlayPause={onClickTogglePlayPause}
                onClickRestart={onClickRestart}
                currentTimeString={currentTimeString}
                totalTimeString={totalTimeString}
                goToFrame={goToFrame}
                onScrubStart={onScrubStart}
                onScrubEnd={onScrubEnd}
                showControls={showControls}
                isFullScreen={isFullScreen}
                onClickToggleFullScreen={onClickToggleFullScreen}
              />
            ))}
        </div>
      </div>
    </>
  ) : null;
}
