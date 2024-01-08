// Vendor
import { useRef } from 'react';
import { Transition, TransitionStatus } from 'react-transition-group';

const toggleFadeTransitions: Record<TransitionStatus, React.CSSProperties | null> = {
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exited: null,
  exiting: null,
  unmounted: null,
};

/**
 * Applies a simple fade in/out transition to wrapped children
 *
 * @param {bool}    isVisible       Whether the wrapped children should currently be visible
 * @param {number}  [duration=200]  The time in ms that the fade transition should take
 */
const ToggleFadeTransition = ({
  isVisible,
  duration = 200,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  isVisible: boolean;
  duration?: number;
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    // The Transition component accepts a generic type for the type of element which will
    // be passed to its `nodeRef` prop, if applicable. We're not using that prop, so we
    // need to explicitly set the type as `undefined` in order for typings of the
    // `onEnter` prop to work as we want.
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
          ref={nodeRef}
          style={{
            opacity: 0,
            transition: `all ${duration}ms ease-in-out`,
            ...toggleFadeTransitions[transitionState],
          }}
          {...props}
        />
      )}
    </Transition>
  );
};

export default ToggleFadeTransition;
