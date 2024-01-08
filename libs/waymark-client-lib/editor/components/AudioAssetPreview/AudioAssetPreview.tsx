// Vendor
import { useRef, useState, useEffect, useMemo } from 'react';

import { css, cx as emotionClassNames } from '@emotion/css';

// Editor
import SoundBarAnimation from 'editor/components/SoundBarAnimation';
import { TemplateAudioAsset } from 'editor/types/audioAsset';

// Shared
import { usePauseVideoPlayback } from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import { RotatingLoader } from '@libs/shared-ui-components';
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
import { formatSecondsAsTimestamp } from 'shared/utils/text.js';

// Styles
import { darkCoolGrayColor, lightCoolGrayColor, whiteColor } from 'styles/themes/waymark/colors.js';

/* WAYMARK APP DEPENDENCIES */
import { AccountAudioAsset } from 'app/models/accountAudioAssets/types';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import useAddEventListener from 'shared/hooks/useAddEventListener';
import { useTypography } from 'styles/hooks/typography.js';
/* WAYMARK APP DEPENDENCIES */

import TrackDisplayName from './TrackDisplayName';
import { themeVars } from '@libs/shared-ui-styles';

const AUDIO_PREVIEW_STATUSES = {
  loading: 'loading',
  paused: 'paused',
  playing: 'playing',
};

interface AudioAssetPreviewProps {
  /**
   * The audio asset to be previewed
   */
  audioAsset: AccountAudioAsset | TemplateAudioAsset;
  /**
   * The duration of the audio asset in seconds (if provided, we'll display this in a duration badge, otherwise we won't display anything)
   */
  assetDuration?: number | null;
  /**
   * Whether the preview component should be styled as selected
   *
   * @defaultValue false
   */
  isSelected?: boolean;
  /**
   * Handler callback to fire when the audio asset is clicked
   */
  onClickAudioAsset?: () => void;
  /**
   * Component to render as the audio asset's icon
   */
  icon: React.ReactNode;
  /**
   * Optional component to render as the audio asset's attribution icon
   * (e.g. WellSaid Labs, Play.ht, etc.)
   */
  attributionIcon?: React.ReactNode;
  /**
   * Optional className to apply additional custom styles to the root button element
   */
  className?: string;
}

/**
 * Plays audio asset preview on hover and renders an editor panel list item
 */
export default function AudioAssetPreview({
  audioAsset,
  assetDuration = null,
  isSelected = false,
  onClickAudioAsset = undefined,
  icon,
  attributionIcon = null,
  className = undefined,
}: AudioAssetPreviewProps) {
  const pauseVideoPlayback = usePauseVideoPlayback();

  const [audioPreviewStatus, setAudioPreviewStatus] = useState(AUDIO_PREVIEW_STATUSES.paused);

  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const playbackProgressBarRef = useRef<HTMLDivElement>(null);

  const { displayName, previewURL } = audioAsset;

  const [isHovering, setIsHovering] = useState(false);

  const [caption3TextStyles] = useTypography(['caption3']);

  const durationTimestamp = useMemo(
    () => (assetDuration ? formatSecondsAsTimestamp(assetDuration) : null),
    [assetDuration],
  );

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return undefined;
    }

    let startPlaybackTimeout: number;

    const startAudioPlayback = () => {
      // Delay starting audio playback by 150ms so we don't spam a bunch of play attempts as the user moves their mouse
      // over a long list of audio tracks
      startPlaybackTimeout = window.setTimeout(async () => {
        // Start showing a loading state
        setAudioPreviewStatus(AUDIO_PREVIEW_STATUSES.loading);
        // Pause the video if it's playing, then start playing the audio
        await pauseVideoPlayback();
        await audioElement.play();
        setAudioPreviewStatus(AUDIO_PREVIEW_STATUSES.playing);
      }, 150);
    };

    const pauseAudioPlayback = async () => {
      await audioElement.pause();
      setAudioPreviewStatus(AUDIO_PREVIEW_STATUSES.paused);

      // Reset currentTime so the audio always starts at the beginning.
      audioElement.currentTime = 0;
    };

    if (isHovering) {
      startAudioPlayback();
    } else {
      pauseAudioPlayback();
    }

    return () => {
      window.clearTimeout(startPlaybackTimeout);
    };
  }, [isHovering, pauseVideoPlayback]);

  useAddEventListener(
    window,
    'touchstart',
    (event: Event) => {
      const target = event.target as Node;
      const button = buttonRef.current;
      if (!button) {
        return;
      }

      // If the touch was inside of the button, update that the user is hovering, otherwise update that they are not hovering
      setIsHovering(buttonRef.current.contains(target));
    },
    { passive: true },
  );

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return undefined;
    }

    if (!isHovering) {
      playbackProgressBarRef.current?.style.setProperty('--progress-percent', '0');
      return undefined;
    }

    let updateLoopFrameId: number;

    const updatePlaybackProgress = () => {
      const { duration: audioDuration, currentTime } = audioElement;

      playbackProgressBarRef.current?.style.setProperty(
        '--progress-percent',
        `${audioDuration ? currentTime / audioDuration : 0}`,
      );
      updateLoopFrameId = requestAnimationFrame(updatePlaybackProgress);
    };

    updatePlaybackProgress();

    return () => {
      cancelAnimationFrame(updateLoopFrameId);
    };
  }, [isHovering]);

  return (
    <WaymarkButton
      ref={buttonRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClickAudioAsset}
      hasFill={false}
      isUppercase={false}
      colorTheme={isSelected ? 'PrimaryText' : 'GrayText'}
      className={emotionClassNames(
        css`
          width: 100%;
          display: block;
        `,
        className,
      )}
      data-isselected={isSelected || null}
      data-ishovering={isHovering || null}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          padding: 0 4px 0 2px;
        `}
      >
        <TrackDisplayName displayName={displayName} />
        {durationTimestamp ? (
          <div
            className={emotionClassNames(
              caption3TextStyles,
              css`
                background-color: ${darkCoolGrayColor};
                color: ${whiteColor};
                line-height: 1;
                border-radius: 4px;
                padding: 2px 4px;
                flex: 0;
                transition: opacity 0.2s ease-in-out;
              `,
            )}
          >
            {durationTimestamp}
          </div>
        ) : null}
        {attributionIcon && (
          <div
            className={css`
              position: relative;
              /* All icons are positioned within a 24x24 box */
              flex: 0 0 54px;
              height: 18px;
              margin-left: 4px;
              /* Vertically center the icons inside of our 24x24 box */
              display: flex;
              align-items: center;

              svg {
                /* The icon SVG should fill the available width */
                width: 100%;
                height: auto;
              }
            `}
          >
            {attributionIcon}
          </div>
        )}
        <FadeSwitchTransition
          transitionKey={audioPreviewStatus}
          className={css`
            position: relative;
            /* All icons are positioned within a 24x24 box */
            flex: 0 0 24px;
            height: 24px;
            margin-left: 8px;
            /* Vertically center the icons inside of our 24x24 box */
            display: flex;
            align-items: center;

            svg {
              /* The icon SVG should fill the available width */
              width: 100%;
              height: auto;
            }
          `}
        >
          {(() => {
            switch (audioPreviewStatus) {
              case AUDIO_PREVIEW_STATUSES.playing:
                return (
                  <SoundBarAnimation
                    containerClass={css`
                      width: 100%;
                    `}
                  />
                );
              case AUDIO_PREVIEW_STATUSES.loading:
                return (
                  <RotatingLoader
                    className={css`
                      width: 100%;
                      height: auto;
                    `}
                  />
                );
              default:
                // Display the icon SVG by default
                return icon;
            }
          })()}
        </FadeSwitchTransition>
      </div>
      {/* unfortunately eslint does not consider crossOrigin a valid audio element tag even though it is a valid attribute */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
        onEnded={() => {
          // If the track reaches the end, wait 1 seconds before looping
          // back to the start
          setTimeout(() => {
            const buttonElement = buttonRef.current;
            const audioElement = audioRef.current;
            if (audioElement) {
              audioElement.currentTime = 0;
              // Start playing again if the user is still hovering over the button
              if (buttonElement?.dataset.ishovering) {
                audioElement.play();
              }
            }
          }, 1000);
        }}
      >
        <source src={previewURL} />
      </audio>
      <div
        className={css`
          position: relative;
          width: 100%;
          height: 2px;
          border-radius: 8px;

          background-color: ${lightCoolGrayColor};

          [data-isselected] & {
            background-color: currentColor;
            transition-property: background-color, opacity;
            transition-duration: 0.2s;
          }
        `}
      >
        <div
          ref={playbackProgressBarRef}
          className={css`
            width: 100%;
            height: 100%;
            --progress-percent: 0;
            transform: scaleX(var(--progress-percent));
            transform-origin: left;
            background-color: ${themeVars.color.ai.color1.light};
          `}
        />
      </div>
    </WaymarkButton>
  );
}
