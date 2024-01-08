// Vendor
import { useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import classNames from 'classnames';

import * as styles from './SlideFadeSwitchTransition.css';

const transitionClassNames = {
  enter: styles.Enter,
  enterActive: styles.EnterActive,
  exit: styles.Exit,
  exitActive: styles.ExitActive,
};

interface SlideFadeSwitchTransitionProps extends React.ComponentPropsWithoutRef<'div'> {
  transitionKey: string;
  direction?: keyof typeof styles.slideDirections;
  duration?: number;
  transitionElementClassName?: string;
}

/**
 * Simple helper component for applying transitions where you want to transition between
 * contents by having them fade in/out and slide in a certain direction
 *
 * @param {string}    transitionKey       Key to apply to the transition to indicate that we have new content that we need to switch to
 * @param {string}    [direction='left']  The direction that the contents should slide in when transitioning
 * @param {string}    [className]         Optional class to apply custom styling to the transition wrapper
 * @param {Object}    [style]             Optional style object to apply to the transition wrapper
 * @param {string}    [transitionElementClassName]  Optional class to apply to the transition element
 * @param {node}      children            Wrapped child element to apply transition to
 */
const SlideFadeSwitchTransition = ({
  transitionKey,
  direction = styles.slideDirections.left,
  duration = 150,
  transitionElementClassName = undefined,
  className = undefined,
  children,
  ...props
}: SlideFadeSwitchTransitionProps) => {
  const nodeRef = useRef(null);

  return (
    <div
      className={classNames(styles.TransitionWrapper, className)}
      {...styles.dataSlideDirection(direction)}
      {...props}
    >
      <SwitchTransition>
        <CSSTransition
          key={transitionKey}
          timeout={duration}
          nodeRef={nodeRef}
          classNames={transitionClassNames}
        >
          <div
            ref={nodeRef}
            className={transitionElementClassName}
            style={{
              transitionDuration: `${duration}ms`,
            }}
          >
            {children}
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default SlideFadeSwitchTransition;
