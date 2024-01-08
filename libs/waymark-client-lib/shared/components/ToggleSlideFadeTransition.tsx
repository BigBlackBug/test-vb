// Vendor
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Transition, TransitionStatus } from 'react-transition-group';

export enum SlideDirections {
  Left = 'left',
  Right = 'right',
  Up = 'up',
  Down = 'down',
}

const slideDirectionTransformValues: {
  [key in SlideDirections]: (slideAmount: string, shouldInvert?: boolean) => string;
} = {
  [SlideDirections.Left]: (slideAmount, shouldInvert = false) =>
    `translateX(${shouldInvert ? '-' : ''}${slideAmount})`,
  [SlideDirections.Right]: (slideAmount, shouldInvert = false) =>
    `translateX(${shouldInvert ? '' : '-'}${slideAmount})`,
  [SlideDirections.Up]: (slideAmount, shouldInvert = false) =>
    `translateY(${shouldInvert ? '-' : ''}${slideAmount})`,
  [SlideDirections.Down]: (slideAmount, shouldInvert = false) =>
    `translateY(${shouldInvert ? '' : '-'}${slideAmount})`,
};

interface ToggleSlideFadeTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isVisible: boolean;
  duration?: number;
  direction?: `${SlideDirections}`;
  shouldReverseOnExit?: boolean;
  slideAmount?: string;
}

/**
 * Applies a transition where the wrapped children will fade in and slide in/out
 * from a specifid direction
 *
 * @param {bool}    isVisible           Whether the contents should be visible or not
 * @param {number}  [duration=200]      Duration of the transition in ms
 * @param {string}  [direction='left']  The direction that the contents should slide in
 * @param {bool}    [shouldReverseOnExit=false]   Whether the contents should be animated out in the reverse
 *                                                  direction they came in; ie, it slides in from right to left
 *                                                  and then slides out from left to right
 * @param {string}  [slideAmount='10%'] The amount that the contents should slide by - this can be any string that
 *                                        would work as valid CSS, ie "10px", "10%", "1em"
 */
const ToggleSlideFadeTransition = forwardRef<HTMLDivElement, ToggleSlideFadeTransitionProps>(
  (
    {
      isVisible,
      duration = 200,
      direction = SlideDirections.Left,
      shouldReverseOnExit = false,
      slideAmount = '10%',
      children,
      ...props
    },
    ref,
  ) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => nodeRef.current as HTMLDivElement);

    // Use a ref to ensure we hold onto whatever the previous contents
    // wrapped in this transition were, at least until the
    // transition completes. This creates a nicer looking user experience
    // for cases where some state is cleaned up as we transition out which
    // could cause content to shift
    const previousChildrenRef = useRef(children);

    if (isVisible) {
      previousChildrenRef.current = children;
    }

    // Get the initial transform that we should animate in from
    const initialTransform = slideDirectionTransformValues[direction](slideAmount);

    const toggleSlideFadeTransitionConfig = useMemo(
      (): Record<TransitionStatus, React.CSSProperties | null> => ({
        entering: {
          transform: 'none',
          opacity: 1,
        },
        entered: {
          transform: 'none',
          opacity: 1,
        },
        exiting: {
          // Get the transform that we should animate out to on exit
          transform: slideDirectionTransformValues[direction](slideAmount, !shouldReverseOnExit),
        },
        exited: null,
        unmounted: null,
      }),
      [direction, slideAmount, shouldReverseOnExit],
    );

    return (
      <Transition
        in={isVisible}
        timeout={duration}
        mountOnEnter
        unmountOnExit
        // This is a bit of a weird hack but essentially we're accessing the node's offsetHeight to force a browser reflow
        // so that the enter animation will play correctly starting with the default styling rather than immediately jumping to the enter state.
        // This is endorsed by one of the main contributors to this library and is apparently how the CSSTransition component works
        // under the hood so I guess just roll with it?
        // https://github.com/reactjs/react-transition-group/issues/223#issuecomment-334748429
        onEnter={() => nodeRef.current?.offsetHeight}
        nodeRef={nodeRef}
      >
        {(transitionState) => (
          <div
            style={{
              opacity: 0,
              transform: initialTransform,
              transition: `all ${duration}ms ease-in-out`,
              ...toggleSlideFadeTransitionConfig[transitionState],
            }}
            {...props}
            ref={nodeRef}
          >
            {previousChildrenRef.current}
          </div>
        )}
      </Transition>
    );
  },
);
export default ToggleSlideFadeTransition;
