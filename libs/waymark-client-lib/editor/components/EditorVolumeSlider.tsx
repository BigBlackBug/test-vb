// Vendor
import { css, cx as emotionClassNames } from '@emotion/css';
import { useCallback, useRef, useState } from 'react';

// Editor
import EditorControlsSlider from 'editor/components/EditorControlsSlider';

// Shared
import { MuteIcon, UnmuteIcon } from 'shared/components/VideoPlayerIcons';
import { WaymarkButton } from 'shared/components/WaymarkButton';

/* WAYMARK APP DEPENDENCIES */
import ToggleFadeTransition from 'app/components/ToggleFadeTransition';
import { defaultIconColor } from 'app/icons/constants';
/* END WAYMARK APP DEPENDENCIES */

// Styles
import { useTypography } from 'styles/hooks/typography.js';

interface EditorVolumeSliderProps {
  /**
   * The current volume value
   */
  currentVolume: number;
  /**
   * Callback to update the current volume value
   */
  updateVolume: (newVolume: number) => void;
  /**
   * Label to display on the volume slider to indicate what type of volume we're controlling
   */
  sliderLabel?: string;
  /**
   * Tooltip to display on the volume slider while the user is hovering
   */
  tooltip?: string;
  /**
   * Whether to show a mute button which toggles the volume between 0 and the last non-muted volume value
   */
  shouldShowMuteButton?: boolean;
  /**
   * Whether the slider is disabled
   */
  isDisabled?: boolean;
  /**
   * Optional class name to apply custom styles
   */
  className?: string | null;
}

/**
 * Renders a slider component which controls audio volume, along with a mute button
 */
export default function EditorVolumeSlider({
  currentVolume,
  updateVolume,
  sliderLabel = '',
  tooltip = '',
  shouldShowMuteButton = true,
  isDisabled = false,
  className = null,
}: EditorVolumeSliderProps) {
  const [shouldShowTooltip, setShouldShowTooltip] = useState(false);

  // Keep ref to the last non-muted volume value that we should restore to if the user unmutes
  // Using a ref over useState because we don't need or want this to trigger a re-render when it changes
  const lastVolumeBeforeMutingRef = useRef(
    // Use the initial volume value, or if
    // the initial volume is 0 and therefore muted, default to 100
    currentVolume || 100,
  );

  const [caption3TextStyle] = useTypography(['caption3']);

  /**
   * Toggles the volume between muted and unmuted
   */
  const onClickToggleMute = () => {
    if (currentVolume === 0) {
      // If the volume is 0 and therefore muted, restore to the last non-muted volume
      updateVolume(lastVolumeBeforeMutingRef.current);
    } else {
      //  If the volume isn't muted, set it to 0 to mute it
      updateVolume(0);
    }
  };

  // Using a callback to avoid messing up the slider's debounced onChange callback
  const onVolumeSliderChanged = useCallback(
    (newClipVolume) => {
      updateVolume(newClipVolume);

      if (newClipVolume !== 0) {
        // If this change didn't mute the volume, store this new value as the volume we should restore to
        // if the user mutes and then unmutes
        lastVolumeBeforeMutingRef.current = newClipVolume;
      }
    },
    [updateVolume],
  );

  return (
    <div
      className={emotionClassNames(
        css`
          display: flex;
          position: relative;
        `,
        className,
      )}
    >
      {shouldShowMuteButton ? (
        <WaymarkButton
          onClick={onClickToggleMute}
          isDisabled={isDisabled}
          colorTheme="Secondary"
          hasFill={false}
          className={css`
            padding: 6px !important;
            border-radius: 6px !important;
            margin-right: 6px;
            line-height: 0;

            svg {
              width: 20px;
              height: 20px;
            }
          `}
        >
          {currentVolume === 0 ? (
            <MuteIcon color={defaultIconColor} />
          ) : (
            <UnmuteIcon color={defaultIconColor} />
          )}
        </WaymarkButton>
      ) : null}
      <div
        onMouseEnter={() => setShouldShowTooltip(true)}
        onTouchStart={() => setShouldShowTooltip(true)}
        onFocus={() => setShouldShowTooltip(true)}
        onTouchEnd={() => setShouldShowTooltip(false)}
        onMouseLeave={() => setShouldShowTooltip(false)}
        onBlur={() => setShouldShowTooltip(false)}
        className={css`
          width: 100%;
        `}
      >
        <EditorControlsSlider
          label={sliderLabel}
          controlledValue={currentVolume}
          onChange={onVolumeSliderChanged}
          // Debounce the onChange event by 100ms
          onChangeDebounceTime={100}
          min={0}
          max={100}
          units="%"
          className={css`
            flex: 1;
          `}
          isDisabled={isDisabled}
        />
      </div>
      <ToggleFadeTransition
        isVisible={Boolean(tooltip) && shouldShowTooltip}
        className={css`
          ${caption3TextStyle}
          letter-spacing: initial;
          position: absolute;
          top: 40px;
          left: 40px;
        `}
      >
        {tooltip}
      </ToggleFadeTransition>
    </div>
  );
}
