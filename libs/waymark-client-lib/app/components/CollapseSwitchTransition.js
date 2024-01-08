// Vendor
import {
    useRef,
    useState,
    useCallback
} from 'react';
import PropTypes from 'prop-types';
import {
    Transition,
    SwitchTransition
} from 'react-transition-group';

// Local
import useWindowEvent from 'app/hooks/windowEvent.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';

const collapseTransitionStyleConfig = {
    entered: {
        overflow: 'visible',
    },
    exiting: {
        // The exiting animation should transition the contents to have 0 height and opacity
        maxHeight: 0,
        opacity: 0,
        // Disable pointer events as the contents are transitioning out
        pointerEvents: 'none',
    },
    exited: {
        // Once the contents are fully animated out, set their visibility to hidden to ensure screen readers know
        // it's not there anymore
        visibility: 'hidden',
        maxHeight: 0,
        opacity: 0,
    },
};

/**
 * Helper component for applying transitions where you want to swap out content
 * by collapsing the previous content and then expanding new content to replace it
 *
 * @param {string}  transitionKey   Key to apply to the transition to indicate that we have new content that we need to switch to
 * @param {number}  [duration=300]  Duration in milliseconds that the transition should take
 * @param {node}    [children]      The children to display for the current transition state
 * @param {string}  [contentsWrapperClassName]    Optional className to apply custom styling to the div wrapping the contents being transitioned in/out
 * @param {object}  [style]         Optional style object applies additional custom inline styles to the transition div
 *                                    NOTE: just be careful to ensure these styles do not interfere/override any styles being used for the transition
 */
export default function CollapseSwitchTransition({
    transitionKey,
    duration,
    children,
    contentsWrapperClassName,
    style,
    ...props
}) {
    const contentsWrapperRef = useRef();

    // Keep track of the client height of the contents we're transitioning in/out
    // so we know what height to transition to when expanding/what height to transition from when collapsing
    const [contentHeight, setContentHeight] = useState(0);

    const updateContentsHeight = useCallback(() => {
        // Make sure we have the most up to date height of the contents so we can animate correctly
        setContentHeight(contentsWrapperRef.current.clientHeight);
    }, []);

    // Ensure that we keep our content height up to date if the window gets resized
    useWindowEvent('resize', updateContentsHeight);

    return ( <
        SwitchTransition >
        <
        Transition key = {
            transitionKey
        }
        // Don't apply a timeout if there aren't any contents for this transition state
        timeout = {
            duration
        }
        // Update our max height to the contents' height when they're about to animate in or out
        onEnter = {
            updateContentsHeight
        }
        onExit = {
            updateContentsHeight
        }
        // Run through the enter transition animation for the initial contents when this component is first mounted
        appear >
        {
            (transitionState) => ( <
                div style = {
                    {
                        maxHeight: contentHeight,
                        overflow: 'hidden',
                        transition: `all ${duration}ms ease-in-out`,
                        ...collapseTransitionStyleConfig[transitionState],
                        ...style,
                    }
                } { ...props
                } >
                {
                    /* Using an extra div to wrap the contents so that we can always get an accurate
                                  height for the contents whether they're collapsed or not */
                } <
                div ref = {
                    contentsWrapperRef
                }
                className = {
                    contentsWrapperClassName
                } > {
                    children
                } <
                /div> <
                /div>
            )
        } <
        /Transition> <
        /SwitchTransition>
    );
}

CollapseSwitchTransition.propTypes = {
    transitionKey: PropTypes.string.isRequired,
    duration: PropTypes.number,
    children: sharedPropTypes.children,
    contentsWrapperClassName: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    style: PropTypes.object,
};

CollapseSwitchTransition.defaultProps = {
    duration: 300,
    children: null,
    contentsWrapperClassName: null,
    style: null,
};