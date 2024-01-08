// Vendor
import {
    forwardRef,
    useEffect,
    useRef
} from 'react';
import PropTypes from 'prop-types';
import {
    css,
    cx as emotionClassNames
} from '@emotion/css';

// Local
import {
    useIsElementInViewport,
    makeIntersectionObserver
} from 'app/hooks/element';
import {
    useWindowScrollPosition
} from 'app/hooks/dom.js';
import {
    dataIsSticky,
    dataIsScrollLocked
} from 'styles/constants/dataset.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';

// Styles
import zIndex from 'styles/constants/zIndex.js';

const STICKY_SENTINEL_HEIGHT = 1;

// Create a custom intersection observer that considers the sticky element sentinel to be visible as long as it's not
// scrolled past the top of the page
const stickyElementSentinelObserver = makeIntersectionObserver(
    undefined,
    (entry) => entry.boundingClientRect.top > -STICKY_SENTINEL_HEIGHT,
);

/**
 * Renders an element with the position: sticky style applied and applies
 * functionality for applying different styles and tracking events for whether the element is currently
 * sticky or not.
 *
 * This implementation is heavily inspired by the article "An event for CSS position:sticky" by Eric Bidelman
 * https://developers.google.com/web/updates/2017/09/sticky-headers
 *
 * @param {string}  [tag='div']         The tag to use for the rendered element. This will be a div by default.
 * @param {number}  [top=0]             The position relative to the top of the page where the element will stick after scrolling
 * @param {func}    [onStickyChange]    Callback receives whether the element is currently sticky or not every time it changes
 * @param {string}  [className]         Class name for additional custom styling on the sticky element
 * @param {bool}    [isStickyDisabled]  Whether the element's sticky behavior should be disabled
 * @param {children}  children          Children to wrap with the sticky element
 * Any additional params will be passed through to the rendered sticky element
 *
 * FOR SETTING CUSTOM STYLING BASED ON WHETHER THE ELEMENT IS STICKY:
 *
 * We set a `data-is-sticky` dataset attribute on the sticky element which indicates whether or not the element
 * is currently stuck or not. This can be referenced in your css like so:
 *
 * import StickyElement from 'shared/components/StickyElement.js';
 * import { dataIsSticky } from 'styles/constants/dataset.js';
 *
 * <StickyElement
 *  className={css`
 *    &[${dataIsSticky}='true'] {
 *      STYLES IN HERE ARE ONLY APPLIED WHEN THE ELEMENT IS STICKY
 *    }
 *
 *    &[${dataIsSticky}='false'] {
 *      STYLES IN HERE ARE ONLY APPLIED WHEN THE ELEMENT IS NOT STICKY
 *    }
 *  `}
 * />
 */
const StickyElement = forwardRef(
    ({
            tag: ElementTag,
            top,
            onStickyChange,
            className,
            children,
            isStickyDisabled,
            ...otherProps
        },
        forwardedRef,
    ) => {
        const stickySentinelRef = useRef();

        const isSentinelInViewport = useIsElementInViewport(
            stickySentinelRef,
            stickyElementSentinelObserver,
        );

        // Keeping track of whether the page is scrolled because if the element's base position is
        // right at the very top of the page (ie, the page header), the sentinel will immediately be off of the page but we don't want to
        // actually consider the element "stuck" until the user has scrolled at least one pixel down the page
        const isPageScrolled = useWindowScrollPosition() > 0;

        // The element is sticky if the sentinel is scrolled out of the viewport and sticky behavior is not disabled
        const isSticky = !isStickyDisabled && !isSentinelInViewport && isPageScrolled;

        useEffect(() => {
            if (isStickyDisabled) return;

            // Call onStickyChange each time the value of isSticky changes
            onStickyChange(isSticky);
        }, [isSticky, onStickyChange, isStickyDisabled]);

        const dataset = {
            [dataIsSticky]: isSticky,
        };

        return ( <
            ElementTag ref = {
                forwardedRef
            }
            className = {
                emotionClassNames(
                    css `
            z-index: ${zIndex.stickyElement};
            /* Use the good-ol' backface-visibility trick to force hardware acceleration in an attempt
              to prevent the sticky element from flickering on some devices */
            backface-visibility: hidden;
          `, !isStickyDisabled ?
                    css `
                position: sticky;

                /* Set the top position from our prop; this determines how far from the top of the viewport
                  the element should stick, so top: 10px would mean that the element will stop when the user has
                  scrolled it to 10px from the top of the viewport and it will then remain fixed there. */
                top: ${top}px;

                /* If the element is sticky and page scrolling is locked,
                    switch to position: fixed to ensure the element will stay stuck where it was
                    before the page was locked */
                [${dataIsScrollLocked}] &[${dataIsSticky}='true'] {
                  position: fixed;
                }
              ` :
                    null,
                    className,
                )
            } { ...dataset
            } { ...otherProps
            } >
            {
                children
            } <
            div className = {
                css `
            position: absolute;
            /* Make the sentinel element one pixel tall */
            height: ${STICKY_SENTINEL_HEIGHT}px;
            /* Shift the sentinel element above the sticky element to the correct position
              so that this element will leave the viewport when the element first sticks.
              We are shifting it up by one pixel more than the parent sticky element's 'top' value, and then shifting
              up an additional 1px to offset the sentinel's height */
            top: ${-(top + 1) - STICKY_SENTINEL_HEIGHT}px;
            left: 0;
            right: 0;
            visibility: hidden;
          `
            }
            ref = {
                stickySentinelRef
            }
            /> <
            /ElementTag>
        );
    },
);
StickyElement.propTypes = {
    tag: PropTypes.string,
    top: PropTypes.number,
    onStickyChange: PropTypes.func,
    className: PropTypes.string,
    isStickyDisabled: PropTypes.bool,
    children: sharedPropTypes.children.isRequired,
};
StickyElement.defaultProps = {
    tag: 'div',
    top: 0,
    onStickyChange: () => {},
    className: null,
    isStickyDisabled: false,
};

export default StickyElement;