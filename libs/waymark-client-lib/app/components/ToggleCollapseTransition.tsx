// Vendor
import { useEffect, useRef, useState } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import classNames from 'classnames';

import * as styles from './ToggleCollapseTransition.css';

interface ToggleCollapseTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the wrapped children should currently be visible
   */
  isVisible: boolean;
  /**
   * The time in ms that the collapse transition should take
   * @default 200
   */
  duration?: number;
  /**
   * The wrapped children to collapse/reveal
   */
  children: React.ReactNode;
  /**
   * Optional className to apply to the div wrapping the children
   */
  contentsWrapperClassName?: string;
}

const { TRANSITION_STATE } = styles;
type TransitionState = (typeof TRANSITION_STATE)[keyof typeof TRANSITION_STATE];

/**
 * Applies a collapse/expand transition to the wrapped children's height
 * NOTE: Be aware that if you have vertical margins applied to the wrapped elements' styling,
 * this transition can and will get a little janky because of how that interacts with `overflow: hidden`.
 * It is recommended that you either use padding instead or move your margins to the surrounding elements
 * above/below.
 *
 * @param {bool}          isVisible         Whether the wrapped children should currently be visible
 * @param {number}        [duration=200]    The time in ms that the collapse transition should take
 * @param {node|node[]}   children          The wrapped children to collapse/reveal
 */
const ToggleCollapseTransition = ({
  isVisible,
  duration = 200,
  children,
  className,
  contentsWrapperClassName,
  ...props
}: ToggleCollapseTransitionProps) => {
  const [transitionState, setTransitionState] = useState<TransitionState>(() =>
    isVisible ? TRANSITION_STATE.opened : TRANSITION_STATE.closed,
  );

  const previousIsVisible = useRef(isVisible);

  useEffect(() => {
    if (previousIsVisible.current === isVisible) {
      return;
    }

    previousIsVisible.current = isVisible;

    if (isVisible) {
      setTransitionState(TRANSITION_STATE.opening);
      setTimeout(() => {
        setTransitionState(TRANSITION_STATE.opened);
      }, duration);
    } else {
      setTransitionState(TRANSITION_STATE.closing);
      setTimeout(() => {
        setTransitionState(TRANSITION_STATE.closed);
      }, duration);
    }
  }, [duration, isVisible]);

  return (
    <div
      className={classNames(styles.CollapseTransition, className)}
      {...styles.dataTransitionState(transitionState)}
      aria-expanded={isVisible}
      style={assignInlineVars({
        [styles.transitionDuration]: `${duration}ms`,
      })}
      {...props}
    >
      <div
        className={classNames(styles.CollapseTransitionContentsWrapper, contentsWrapperClassName)}
      >
        {/* Don't render children when closed */}
        {transitionState !== TRANSITION_STATE.closed ? children : null}
      </div>
    </div>
  );
};

export default ToggleCollapseTransition;
