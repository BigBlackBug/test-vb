// Vendor
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { css } from '@emotion/css';

// Styles
import { themeVars, mediaQueries } from '@libs/shared-ui-styles';

// Shared
import { convertRange } from 'shared/utils/math.js';
import useDebounce from 'shared/hooks/useDebounce';

import * as styles from './EditorControlsSlider.css';

interface EditorControlsSliderProps {
  /**
   * Callback for when the slider's value changes.
   */
  onChange: (newValue: number) => void;
  /**
   * The amount of time in ms to debounce the onChange callback by, if desired
   */
  onChangeDebounceTime?: number | null;
  /**
   * The slider's initial progress value.
   *
   * @defaultValue 0
   */
  initialSliderValue?: number;
  /**
   * External controlled value which we will keep the slider's value in sync with when it changes
   */
  controlledValue?: number | null;
  /**
   * Label to display on the slider
   */
  label?: string;
  /**
   * The slider's minimum value. Can be negative, just needs to be less than the max
   *
   * @defaultValue 0
   */
  min?: number;
  /**
   * The slider's maximum value.
   *
   * @defaultValue 100
   */
  max?: number;
  /**
   * The amount that each step on the slider should increment by
   *
   * @defaultValue 1
   */
  step?: number;

  /**
   * Array of value numbers for points on the slider to display markers at
   */
  markers?: number[] | null;
  /**
   * Whether the slider should snap to a marker value if the user gets within 2% of that value
   *
   * @defaultValue false
   */
  shouldSnapToMarkers?: boolean;
  /**
   * Whether the slider should display its current value in its label
   *
   * @defaultValue false
   */
  shouldDisplayValueLabel?: boolean;
  /**
   * Unit string to display after marker values if any are set, or after the slider's value if shouldDisplayValueLabel is true
   *
   * @example "px", "%"
   */
  units?: string;
  /**
   * Whether the slider should be disabled
   *
   * @defaultValue false
   */
  isDisabled?: boolean;
  /**
   * Optional class name to apply custom styling
   */
  className?: string | null;
}

/**
 * A styled range-input component.
 */
export default function EditorControlsSlider({
  onChange,
  onChangeDebounceTime = null,
  controlledValue = null,
  initialSliderValue = 0,
  label = '',
  max = 100,
  min = 0,
  step = 1,
  shouldDisplayValueLabel = false,
  units = '',
  markers = null,
  shouldSnapToMarkers = false,
  isDisabled = false,
  className = null,
}: EditorControlsSliderProps) {
  const [sliderValue, setSliderValue] = useState(
    // If we have a controlled value, default to that, otherwise use the initial slider value
    controlledValue || initialSliderValue,
  );
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const progressLabelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Effect keeps the width of the white label text inside of the progress bar's fill fixed to the correct width
    // so that it matches the width of the black label text
    const resizeProgressSlider = () => {
      const mainContainerElement = mainContainerRef.current;
      const progressLabelContainerElement = progressLabelContainerRef.current;

      if (mainContainerElement && progressLabelContainerElement) {
        const parentContainerWidth = mainContainerElement.offsetWidth;
        progressLabelContainerElement.style.width = `${parentContainerWidth}px`;
      }
    };

    // Give the "hidden" slider labels a fixed width based on the main container's
    // to ensure the right label is positioned correctly on first load.
    resizeProgressSlider();

    // Not using useWindowEvent to avoid defining two separate hooks for the
    // same function.
    window.addEventListener('resize', resizeProgressSlider);
    return () => window.removeEventListener('resize', resizeProgressSlider);
  }, []);

  // Wrap the onChange callback in a debounce function; if onChangeDebounceTime is 0 or null,
  // this will just directly call the onChange callback.
  const debouncedOnChange = useDebounce(onChange, onChangeDebounceTime);

  const previousControlledValue = useRef(controlledValue);

  useEffect(
    () => {
      // If our controlled value prop changes and it doesn't match the current slider value,
      // that likely means the value was changed externally and we're now out of sync, so
      // update the slider value to match this new value.
      // This allows us to keep this as a semi-controlled input where the UI can get de-synced from the source value while the
      // onChange event is being debounced but will still be able to stay in sync if the controlled value is changed
      // by something external from this slider
      if (controlledValue !== previousControlledValue.current) {
        previousControlledValue.current = controlledValue;

        if (controlledValue !== null) {
          setSliderValue(controlledValue);

          // If there was a debounced change in progress, cancel it
          (debouncedOnChange as _.DebouncedFunc<typeof onChange>)?.cancel?.();
        }
      }
    },
    // We only want to run this effect when the controlled value changes
    [controlledValue, debouncedOnChange],
  );

  const onSliderValueChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newSliderValue = parseFloat(event.target.value);

    if (shouldSnapToMarkers && markers && markers.length > 0) {
      // Snap to a marker if we're within 2% of the slider's range
      const snapThreshold = (max - min) * 0.02;

      // Determine if we're close enough to a marker to snap to it
      const sliderSnapValue = markers.reduce((currentSnapValue: number | null, markerValue) => {
        const distanceFromMarker = Math.abs(newSliderValue - markerValue);

        if (
          distanceFromMarker < snapThreshold &&
          // If we don't have a currently selected snap value or the current marker value is even closer,
          // return this marker value instead to use it as our new snap value
          (currentSnapValue === null ||
            distanceFromMarker < Math.abs(newSliderValue - currentSnapValue))
        ) {
          return markerValue;
        }

        return currentSnapValue;
      }, null);

      // If we found a marker value to snap to, set that as our new slider value
      if (sliderSnapValue !== null) {
        newSliderValue = sliderSnapValue;
      }
    }

    setSliderValue(newSliderValue);

    // Hoist the current slider value to the consuming component via its callback
    // function.
    debouncedOnChange(newSliderValue);
  };

  const hasNegativeMinimumValue = min < 0;
  const sliderPercentage = (100 * (sliderValue - min)) / (max - min);

  return (
    <div
      className={classNames(styles.EditorControlsSlider, className)}
      {...styles.dataIsSliderDisabled(isDisabled)}
      ref={mainContainerRef}
    >
      {/* If markers were provided render marker lines for them on the slider */}
      {markers?.map((markerValue) => (
        <div
          key={markerValue}
          className={styles.SliderMarker}
          style={{
            // Position the line based on the percentage of where it lies between the slider's min and max values
            left: `${(100 * (markerValue - min)) / (max - min)}%`,
          }}
        >
          {/* Display a label under the marker line with the marker value */}
          <div className={styles.MarkerLabel} {...styles.dataLabelHasUnits(Boolean(units))}>
            {markerValue}
            {units}
          </div>
        </div>
      ))}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={onSliderValueChanged}
        disabled={isDisabled}
        className={styles.SliderInput}
      />
      {/* Hide the range thumb caret indicator if the slider is disabled */}
      {!isDisabled ? (
        <div className={styles.RangeThumbContainer}>
          <div
            style={{
              left: `calc(${sliderPercentage}% - ${sliderPercentage / 10}px)`,
            }}
            className={css`
              position: relative;
              border-radius: 2px;
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-bottom: 5px solid ${themeVars.color.brand.default};
            `}
          />
        </div>
      ) : null}
      <div
        className={classNames(styles.LabelContainer, {
          [styles.ProgressBarDivider]: hasNegativeMinimumValue,
        })}
      >
        <div>{label}</div>{' '}
        {shouldDisplayValueLabel && (
          <span>
            {sliderValue}
            {units}
          </span>
        )}
      </div>
      <div className={styles.ProgressBarContainer}>
        <div
          // Calculate the width as a percentage from 0-100 that we need to fill in order to represent the slider's current value
          style={{ width: `${convertRange(sliderValue, min, max, 0, 100)}%` }}
          className={styles.ProgressBar}
        >
          <div className={styles.ProgressBarFill} />
          <div
            className={classNames(styles.LabelContainer, {
              [styles.ProgressBarDivider]: hasNegativeMinimumValue,
            })}
            ref={progressLabelContainerRef}
          >
            <div className={styles.ProgressLabel}>{label}</div>
            {shouldDisplayValueLabel && (
              <span className={styles.ProgressLabel}>
                {sliderValue}
                {units}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
