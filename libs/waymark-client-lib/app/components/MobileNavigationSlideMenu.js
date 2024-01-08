// Vendor
import PropTypes from 'prop-types';
import {
    useEffect,
    useRef
} from 'react';
import {
    css
} from '@emotion/css';

// Local
import {
    CloseMenuIcon,
    NavMenuIcon
} from 'shared/components/Icons.js';
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import {
    lockScrollPosition
} from 'shared/utils/dom.js';
import Portal from 'shared/components/Portal.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';

import spacing from 'styles/constants/spacing.js';
import zIndex from 'styles/constants/zIndex.js';
import {
    whiteColor
} from 'styles/themes/waymark/colors.js';

/**
 * Defines the slide menu for the nav bar on mobile devices
 *
 * @param {bool}  isOpen  Whether the nav menu is currently open
 * @param {func}  openMenu    Opens the menu
 * @param {func}  closeMenu   Closes the menu
 * @param {number}  headerHeight  The current height of the header - this allows us to add
 *                                  padding to ensure the menu's contents don't get hidden under the header
 * @param {children}  children  Wrapped contents to display in the slide menu
 */

const MobileNavigationSlideMenu = ({
    isOpen,
    openMenu,
    closeMenu,
    headerHeight,
    children
}) => {
    const slideMenuContentsWrapperRef = useRef();

    // Effect adds event listeners to close the menu when the user clicks one of its links/buttons
    useEffect(() => {
        const slideMenuContentsWrapperElement = slideMenuContentsWrapperRef.current;

        const contentLinksAndButtons = Array.from(
            slideMenuContentsWrapperElement.querySelectorAll('a, button'),
        );

        // Note that selecting an anchor/button via a keyboard interaction will fire the onClick event
        // by default as well, so we don't need to worry about additional handling for key press events
        // in order to keep this accessible
        contentLinksAndButtons.forEach((element) => {
            element.addEventListener('click', closeMenu);
        });

        return () => {
            contentLinksAndButtons.forEach((element) => {
                element.removeEventListener('click', closeMenu);
            });
        };
    }, [closeMenu]);

    // Effect handles locking/unlocking page scrolling as the menu is opened/closed
    useEffect(() => {
        // If the menu is now visible, lock scrolling
        if (isOpen) {
            const unlockScrollPosition = lockScrollPosition();

            return unlockScrollPosition;
        }

        return undefined;
    }, [isOpen]);

    return ( <
        >
        <
        WaymarkButton onClick = {
            isOpen ? closeMenu : openMenu
        }
        analyticsAction = {
            `${isOpen ? 'close' : 'open'}_mobile_nav`
        }
        hasFill = {
            false
        }
        tooltipText = {
            isOpen ? 'Close navigation menu' : 'Open navigation menu'
        }
        className = {
            css `
          /* Override default Button styles */
          padding: 0 ${spacing.header.gutter.mobile}px !important;
        `
        } >
        { /* Switch icons based on whether the button will open or close the modal */ } {
            isOpen ? < CloseMenuIcon / > : < NavMenuIcon / >
        } <
        /WaymarkButton> { /* Render the slide menu modal at the root so we can have better control over z-indices */ } <
        Portal >
        <
        div className = {
            css `
            /* Darkened background behind the menu fades in as it is animated open */
            background-color: rgba(0, 0, 0, 0.7);
            z-index: ${zIndex.slideNavMenuBackground};

            /* Background covers the whole screen */
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;

            overflow: hidden;
            pointer-events: none;
            transition: opacity 200ms ease-in-out;
          `
        }
        style = {
            {
                opacity: isOpen ? 1 : 0,
            }
        }
        /> <
        div className = {
            css `
            background-color: ${whiteColor};
            z-index: ${zIndex.slideNavMenu};
            padding: 18px 24px 64px;

            /* Menu covers the whole screen */
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;

            /* Allow scrolling of any overflow */
            overflow-x: hidden;
            overflow-y: scroll;

            transition: transform 200ms ease-in-out;
          `
        }
        style = {
            {
                // When closed, the menu is translated all the way off the screen,
                // then animated in when it's opened
                transform: `translateY(${isOpen ? 0 : -100}%)`,
            }
        } >
        <
        nav role = "navigation"
        className = {
            css `
              /* Add padding to ensure the contents can't be displayed any higher on the page than
                  12px below the header */
              padding: ${headerHeight + 12}px 0;
              min-height: 100%;

              /* Menu contents are perfectly centered on the screen */
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              gap: 20px;
            `
        }
        ref = {
            slideMenuContentsWrapperRef
        } >
        {
            children
        } <
        /nav> <
        /div> <
        /Portal> <
        />
    );
};

MobileNavigationSlideMenu.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    openMenu: PropTypes.func.isRequired,
    closeMenu: PropTypes.func.isRequired,
    headerHeight: PropTypes.number.isRequired,
    children: sharedPropTypes.children.isRequired,
};

export default MobileNavigationSlideMenu;