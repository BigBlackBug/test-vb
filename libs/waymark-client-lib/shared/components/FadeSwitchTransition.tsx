// Vendor
import { useRef } from 'react';

import { Transition, SwitchTransition } from 'react-transition-group';

const transitionStyles: {
  [key: string]: React.CSSProperties;
} = {
  appearing: { opacity: 1 },
  appeared: { opacity: 1 },
  entering: { opacity: 1 },
  entered: { opacity: 1 },
};

interface FadeSwitchTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  transitionKey: string;
  duration?: number;
  shouldFadeInOnMount?: boolean;
  style?: React.CSSProperties;
}

/**
 * Simple helper component for applying transitions where you want to fade contents
 * out and then fade new contents in
 *
 * @param {string}  transitionKey   Key to apply to the transition to indicate that we have new content that we need to switch to
 * @param {number}  [duration=200]  Duration in milliseconds that the transition should take
 * @param {bool}    [shouldFadeInOnMount]   Whether the component should run an initial fade transition when mounting for the first time
 * @param {Object}  [style]   Base style object to apply to the transition element
 */
const FadeSwitchTransition = ({
  transitionKey,
  duration = 200,
  shouldFadeInOnMount = false,
  style: baseTransitionElementStyle = {},
  ...props
}: FadeSwitchTransitionProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <SwitchTransition>
      <Transition
        key={transitionKey}
        timeout={duration}
        // This is a bit of a weird hack but essentially we're accessing the node's offsetHeight to force a browser reflow
        // so that the enter animation will play correctly starting with the default styling rather than immediately jumping to the enter state.
        // This is endorsed by one of the main contributors to this library and is apparently how the CSSTransition component works
        // under the hood so I guess just roll with it?
        // https://github.com/reactjs/react-transition-group/issues/223#issuecomment-334748429
        onEnter={() => nodeRef.current?.offsetHeight}
        appear={shouldFadeInOnMount}
        nodeRef={nodeRef}
      >
        {(transitionState) => (
          <div
            ref={nodeRef}
            style={{
              opacity: 0,
              transition: `all ${duration}ms ease-in-out`,
              ...transitionStyles[transitionState],
              ...baseTransitionElementStyle,
            }}
            {...props}
          />
        )}
      </Transition>
    </SwitchTransition>
  );
};

export default FadeSwitchTransition;
