// Vendor
import { useEffect, useRef } from 'react';
import { css, cx as emotionClassNames } from '@emotion/css';

// Styles
import { themeVars } from '@libs/shared-ui-styles';

export interface ProgressBarProps {
  /**
   * The progress of the task being waited for, as a percentage from 0-1.
   * If set to null, the bar will automatically animate to the maxAutoProgress percentage over the duration of the autoIncrementProgressDuration.
   *
   * @defaultValue null
   */
  progress?: number | null;
  /**
   * The duration in ms that it should take to automatically increment the progress bar from 0 to the maxAutoProgress percentage.
   *
   * @defaultValue 30000
   */
  autoIncrementProgressDuration?: number;
  /**
   * The maximum progress percentage to automatically increment to when we don't know the actual progress.
   * Defaults to 95% as a relatively arbitrary point that's close to the end but leaves a little room to indicate
   * that the task is still in progress.
   *
   * @defaultValue 0.95
   */
  maxAutoProgress?: number;
  /**
   * An optional class name to apply to the progress bar container div.
   */
  className?: string;
  /**
   * An optional class name to apply to the progress bar div.
   */
  progressBarClassName?: string;
}

/**
 * A progress bar to use for longer loading states.
 *
 * The bar's progress can be directly controlled via the progress prop, or if
 * we don't know the actual progress percentage of the task being waited for, we can just
 * have it automatically animate to a given threshold and then wait there until the
 * progress is actually complete.
 *
 * @example
 * // Example usage for a progress bar where we don't actually know the real progress percentage,
 * // just when the request is in progress vs done
 * <ProgressBar
 *  progress={isRequestDone ? 1 : null}
 *  // We expect this request will usually take 10 seconds or less
 *  autoIncrementProgressDuration={10000}
 * />
 *
 * @example
 * // When we do know the real progress percentage, we can just set it directly
 * <ProgressBar progress={progress} />
 */
export default function ProgressBar({
  progress = null,
  autoIncrementProgressDuration = 30000,
  maxAutoProgress = 0.95,
  className = undefined,
  progressBarClassName = undefined,
}: ProgressBarProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progressBarElement = progressBarRef.current;
    if (!progressBarElement) {
      return;
    }

    if (progress === null) {
      // Access the element's offsetHeight to manually trigger a reflow so that the element's progress
      // will animate correctly when we set that
      // eslint-disable-next-line no-unused-expressions
      progressBarElement.offsetHeight;
      progressBarElement.style.setProperty('--progress', `${maxAutoProgress}`);
    } else {
      progressBarElement.style.setProperty('--progress', `${progress}`);
    }
  }, [maxAutoProgress, progress]);

  const isAutoIncrementing = progress === null;

  return (
    <div
      className={emotionClassNames(
        css`
          position: relative;
          width: 100%;
          height: 8px;
          background-color: ${themeVars.color.shadow._16};
          border-radius: 4px;
          overflow: hidden;
          /* Force the creation of a new stacking context to ensure safari respects cutting off this
              element's rounded border radius corners */
          transform: translate3d(0, 0, 0);
        `,
        className,
      )}
    >
      <div
        ref={progressBarRef}
        style={{
          // If we're auto-incrementing, use the autoIncrementProgressDuration as our transition duration
          // so we can trigger a transition from 0 to the maxAutoProgress percentage over this duration
          transitionDuration: isAutoIncrementing ? `${autoIncrementProgressDuration}ms` : '0.3s',
        }}
        className={emotionClassNames(
          css`
            --progress: 0;
            transform: scaleX(var(--progress));

            transition: transform;
            /* Use a custom bezier timing function so the transition's speed slows down more sharply toward the end */
            transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
            transform-origin: left;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${themeVars.color.brand.default};
            z-index: 1;
          `,
          progressBarClassName,
        )}
      />
    </div>
  );
}
