// Vendor
import {
    useState
} from 'react';
import PropTypes from 'prop-types';
import {
    Transition,
    TransitionGroup
} from 'react-transition-group';
import {
    css,
    cx as emotionClassNames
} from '@emotion/css';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';

const visibleStyles = {
    // Visible contents should be faded in
    opacity: 1,
};

const hiddenStyles = {
    // Hidden contents should be faded out
    opacity: 0,
    // Absolutely position hidden contents so their height is ignored and they can be positioned underneath
    // the new contents that are fading in
    position: 'absolute',
    top: 0,
    left: 0,
    // Disable interaction with hidden elements
    pointerEvents: 'none',
};

/**
 * Applies a cross-fade transition to the contents wrapped in this component when they change.
 * This is distinct from the FadeSwitchTransition component because it does not wait for the old
 * contents to transition out before transitioning new contents in; the new contents begin fading in
 * at the same time as the old ones fade out, and the component smoothly transitions from the
 * previous contents' height to the new contents' height.
 *
 * @param {string} transitionKey  Unique key which represents the current contents wrapped in the CrossFadeTransition component.
 *                                  When this key changes, we will run a transition between the previous children and the new children
 *                                  of this component.
 * @param {number} [enterDuration=300]  The duration in ms that it should take to fade new contents in
 * @param {number} [exitDuration=200]   The duration in ms that it should take to fade old contents out
 * @param {string} [className]    Class name to apply custom styles to the outer div wrapping the transition whose height is transitioned
 * @param {string} [transitionElementClassName]   Class name to apply custom styles to the element wrapping the child contents
 *                                                  which manages fading them in/out
 * @param {children}  [children]  The child contents wrapped by this component which we should apply transitions to
 */
export default function CrossFadeTransition({
    transitionKey,
    enterDuration = 300,
    exitDuration = 200,
    className = '',
    transitionElementClassName = '',
    tag: ElementTag = 'div',
    children = null,
}) {
    const [isTransitioningHeight, setIsTransitioningHeight] = useState(false);
    const [currentElementMaxHeight, setCurrentElementMaxHeight] = useState(null);

    // The height transition should take as long as the fastest provided transition duration
    const heightTransitionDuration = Math.min(enterDuration, exitDuration);
    // The overall transition should take as long as the sloest provided transition duration
    const totalTransitionDuration = Math.max(enterDuration, exitDuration);

    return ( <
        ElementTag className = {
            emotionClassNames(
                css `
          /* Set position: relative so contents that are transitioning out can be absolutely positioned within this element */
          position: relative;
        `,
                className,
            )
        }
        style = {
            // If we're transitioning height, apply overflow: hidden and set height styles so we can
            // transition the element's height.
            // Once the transition is done, we'll remove these styles again so we won't run into weird issues
            // if the contents of the wrapped children shift.
            isTransitioningHeight ?
            {
                overflow: 'hidden',
                transition: `height ${heightTransitionDuration}ms ease-in-out, max-height ${heightTransitionDuration}ms ease-in-out`,
                maxHeight: currentElementMaxHeight,
                height: currentElementMaxHeight,
            } :
                null
        } >
        <
        TransitionGroup >
        <
        Transition key = {
            transitionKey
        }
        timeout = {
            totalTransitionDuration
        }
        onExit = {
            (node) => {
                // When a node starts exiting, grab its current height to use as the starting point for our
                // height transition, and mark that we will now be transitioning to height of a new element
                setCurrentElementMaxHeight(node.clientHeight);
                setIsTransitioningHeight(true);
            }
        }
        onEntering = {
            (node) => {
                // When a new node starts entering, grab its initial height as our target height which we will transition to
                setCurrentElementMaxHeight(node.clientHeight);
            }
        }
        // When the new node has finished transitioning in, update that we're done transitioning height
        onEntered = {
            () => setIsTransitioningHeight(false)
        } >
        {
            (transitionState) => {
                const isVisible = transitionState === 'entered' || transitionState === 'entering';

                // Fading in should take as long as enterDuration, fading out should take as long as exitDuration
                const fadeTransitionDuration = isVisible ? enterDuration : exitDuration;

                return ( <
                    div className = {
                        emotionClassNames(
                            css `
                    width: 100%;
                  `,
                            transitionElementClassName,
                        )
                    }
                    style = {
                        {
                            transition: `opacity ${fadeTransitionDuration}ms ease-in-out`,
                            ...(isVisible ? visibleStyles : hiddenStyles),
                        }
                    }
                    data - is - transitioning = {
                        transitionState === 'entering' || transitionState === 'exiting'
                    } >
                    {
                        children
                    } <
                    /div>
                );
            }
        } <
        /Transition> <
        /TransitionGroup> <
        /ElementTag>
    );
}
CrossFadeTransition.propTypes = {
    transitionKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
        .isRequired,
    enterDuration: PropTypes.number,
    exitDuration: PropTypes.number,
    className: PropTypes.string,
    tag: PropTypes.string,
    children: sharedPropTypes.children,
    transitionElementClassName: PropTypes.string,
};