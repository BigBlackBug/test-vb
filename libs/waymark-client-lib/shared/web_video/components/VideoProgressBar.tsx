import { useEffect, useRef } from 'react';

import {
  useIsConfiguratorSetup,
  useVideoTemplateConfigurator,
} from '../providers/VideoTemplateConfiguratorProvider';

import * as styles from './VideoProgressBar.css';
import useEvent from 'shared/hooks/useEvent';
import classNames from 'classnames';

interface VideoProgressBarProps {
  /**
   * Toggles the video between a playing and paused state.
   */
  onClickTogglePlayPause: () => void;
  /**
   * Jumps the video to a given frame number.
   */
  goToFrame: (frameNumber: number) => void;
  /**
   * Callback called when the user starts dragging the progress bar.
   */
  onScrubStart: () => void;
  /**
   * Callback called when the user stops dragging the progress bar.
   */
  onScrubEnd: () => void;
  /**
   * Custom className to apply to root div element.
   */
  className?: string;
}

/**
 * The progress bar for the video player.
 */
export function VideoProgressBar({
  onClickTogglePlayPause,
  goToFrame,
  onScrubStart,
  onScrubEnd,
  className,
}: VideoProgressBarProps) {
  const configurator = useVideoTemplateConfigurator();
  const isConfiguratorSetup = useIsConfiguratorSetup();

  const isDisabled = !configurator || !isConfiguratorSetup;

  const inputRef = useRef<HTMLInputElement>(null);
  // Because input[type=range] is a complete disaster to apply custom styles to with cross-browser support,
  // we're just going to hide it and use a decorative div on top which we will style instead.
  const progressBarDisplayRef = useRef<HTMLDivElement>(null);

  // Updates the --progress CSS variable to reflect the current progress of the video
  const updateProgressBarDisplayWidth = useEvent((newFrameNumber: number) => {
    const progressBarDisplayElement = progressBarDisplayRef.current;
    if (isDisabled || !progressBarDisplayElement) {
      return;
    }
    progressBarDisplayElement.style.setProperty(
      styles.progressCSSVarName,
      `${(newFrameNumber / configurator.renderer.duration) * 100}%`,
    );
  });

  /**
   * Effect updates the input and progress bar display to reflect the current frame number of the video
   * as the video plays.
   */
  useEffect(() => {
    const inputElement = inputRef.current;

    if (isDisabled || !inputElement) {
      return;
    }

    // Set the max value of the input to the duration of the video in frames
    inputElement.max = String(configurator.renderer.duration);

    const onTick = () => {
      const newFrameNumber = configurator.renderer.currentTime;
      inputElement.valueAsNumber = newFrameNumber;
      updateProgressBarDisplayWidth(newFrameNumber);
    };
    configurator.on('tick', onTick);

    // Run once up front to set initial values
    onTick();

    return () => {
      configurator.off('tick', onTick);
    };
  }, [configurator, isDisabled, updateProgressBarDisplayWidth]);

  /**
   * Seeks the video as the user drags the progress bar.
   */
  const onInput = useEvent(async (event?: React.FormEvent) => {
    if (isDisabled || !inputRef.current) {
      event?.preventDefault();
      return;
    }

    const newFrameNumber = inputRef.current?.valueAsNumber;

    goToFrame(newFrameNumber);
    updateProgressBarDisplayWidth(newFrameNumber);
  });

  /**
   * Tracks when the user starts and stops dragging the progress bar so we can resume playback
   * after a scrub action is done if the video was playing before the scrub.
   */
  const onMouseDown = useEvent(() => {
    if (isDisabled) {
      return;
    }

    onScrubStart();

    window.addEventListener(
      'mouseup',
      () => {
        onScrubEnd();
      },
      { once: true },
    );
  });

  /**
   * Handles keyboard shortcuts to enhance the progress bar's functionality.
   */
  const onKeyDown = useEvent((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        // Jump 1 second back on left arrow
        inputRef.current?.stepDown(configurator.renderer.framerate);
        onInput();
        break;
      case 'ArrowRight':
        // Jump 1 second forward on right arrow
        inputRef.current?.stepUp(configurator.renderer.framerate);
        onInput();
        break;
      case ' ':
        // Toggle playback on spacebar
        onClickTogglePlayPause();
        break;
      default:
    }
  });

  return (
    <div className={classNames(styles.ProgressBarWrapper, className)}>
      <input
        disabled={!configurator || !isConfiguratorSetup}
        ref={inputRef}
        type="range"
        min={0}
        step={1}
        defaultValue={0}
        onInput={onInput}
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
        aria-label="Video Progress Bar"
      />
      <div ref={progressBarDisplayRef} className={styles.ProgressBarDisplay}></div>
    </div>
  );
}
