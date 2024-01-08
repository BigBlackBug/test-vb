// Vendor
import _ from 'lodash';
import {
    useState,
    useMemo,
    useRef
} from 'react';
import PropTypes from 'prop-types';
import {
    useDispatch,
    useSelector
} from 'react-redux';

// Local
import {
    WaymarkLogoHomeButton
} from 'shared/components/WaymarkLogo.js';
import MobileNavigationSlideMenu from 'app/components/MobileNavigationSlideMenu.js';
import {
    useIsWindowMobile
} from 'app/hooks/windowBreakpoint.js';
import {
    useElementBoundingClientRect
} from 'app/hooks/element';
import StickyElement from 'shared/components/StickyElement.js';
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import {
    InternalLink,
    ExternalLink
} from 'shared/components/WaymarkLinks';
import {
    appURLs,
    externalURLs
} from 'app/constants/urls.js';
import elementIDs from 'app/constants/elementIDs.js';
import {
    operations as shopOperations
} from 'app/state/ducks/shop/index.js';
import * as selectors from 'app/state/selectors/index.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';

// Styles
import * as styles from './WaymarkHeader.css';

/**
 * The header element to display on mobile/touch devices
 * This wraps the header links in a slide menu UI.
 */
const MobileHeader = ({
    children
}) => {
    const headerRef = useRef();

    // Keep track of the dimensions of the page's header so we can make sure the nav menu is padded so
    // the nav links won't overlap under the header
    const headerClientRect = useElementBoundingClientRect(headerRef);

    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    return ( <
        StickyElement tag = "header"
        className = {
            styles.MobileHeader
        } { ...styles.dataIsMobileNavOpen(isMobileNavOpen)
        }
        id = {
            elementIDs.waymarkHeader
        }
        ref = {
            headerRef
        } >
        { /* Display a logo wrapped in a link to the homepage */ } <
        WaymarkLogoHomeButton className = {
            styles.LogoButton
        }
        /> <
        MobileNavigationSlideMenu headerHeight = {
            headerClientRect ? Math.floor(headerClientRect.height) : 0
        }
        isOpen = {
            isMobileNavOpen
        }
        openMenu = {
            () => setIsMobileNavOpen(true)
        }
        closeMenu = {
            () => setIsMobileNavOpen(false)
        } >
        {
            children
        } <
        /MobileNavigationSlideMenu> <
        /StickyElement>
    );
};
MobileHeader.propTypes = {
    children: sharedPropTypes.children.isRequired,
};

/**
 * The header element to display on desktop; just renders a simple <header> element
 */
const DesktopHeader = ({
    children
}) => ( <
    header className = {
        styles.DesktopHeader
    } > { /* Display a logo wrapped in a link to the homepage */ } <
    WaymarkLogoHomeButton className = {
        styles.LogoButton
    }
    /> <
    nav className = {
        styles.DesktopNav
    } > {
        children
    } < /nav> <
    /header>
);
DesktopHeader.propTypes = {
    children: sharedPropTypes.children.isRequired,
};

/**
 * Renders buttons/links for all of the items in our header link config
 *
 * @param {Object[]} headerLinkConfigs  An array of objects describing how to render each button/link in the header
 */
const HeaderLinks = ({
    headerLinkConfigs
}) => ( <
    > {
        headerLinkConfigs.map((linkConfig) => {
            if (!linkConfig) {
                return null;
            }

            const {
                url,
                text,
                isButton,
                isExternal,
                ...otherProps
            } = linkConfig;

            const sharedProps = {
                key: text,
                analyticsLabel: 'desktop_header',
                colorTheme: 'BlackText',
                // className: headerLinkStyle,
                ...otherProps,
            };

            if (isButton) {
                return ( <
                    WaymarkButton hasFill = {
                        false
                    }
                    isUppercase = {
                        false
                    }
                    typography = "inherit" { ...sharedProps
                    } > {
                        text
                    } <
                    /WaymarkButton>
                );
            }

            if (isExternal) {
                return ( <
                    ExternalLink linkTo = {
                        url
                    } { ...sharedProps
                    } > {
                        text
                    } <
                    /ExternalLink>
                );
            }

            return ( <
                InternalLink linkTo = {
                    url
                } { ...sharedProps
                } > {
                    text
                } <
                /InternalLink>
            );
        })
    } <
    />
);
HeaderLinks.propTypes = {
    headerLinkConfigs: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.bool]))
        .isRequired,
};

/**
 * The header component shown at the top of most pages
 */
const WaymarkHeader = () => {
    const {
        isSSO,
        isSiteWhitelabeled,
        hasConcierge,
        isLoggedIn,
        isAdminPortal
    } = useSelector(
        (state) => ({
            // Get whether the user has SSO and therefore shouldn't be shown login/account buttons
            // since they log in through a different flow
            isSSO: selectors.getBrandingIsSSO(state),
            // Get whether the user's experience is whitelabeled and therefore we should hide links/content
            // that only waymark-branded users should see
            isSiteWhitelabeled: selectors.getBrandingProfileIsSiteWhitelabeled(state),
            hasConcierge: selectors.hasConciergeFeature(state),
            isLoggedIn: selectors.isLoggedIn(state),
            isAdminPortal: selectors.isAdminPortal(state),
        }),
        _.isEqual,
    );

    const dispatch = useDispatch();
    const isMobile = useIsWindowMobile();

    let headerLinkConfigs = useMemo(
        () => [{
                url: appURLs.ai,
                text: 'AI',
                analyticsAction: 'selected_waymark_ai',
            },
            {
                url: appURLs.templateBrowser,
                text: 'Templates',
                analyticsAction: 'selected_templates',
            },
            // Only show a concierge modal button if the user has concierge permissions
            hasConcierge &&
            !isSiteWhitelabeled && {
                url: '#concierge',
                text: 'Concierge',
                isExternal: true,
                analyticsAction: 'selected_concierge',
            },
            // Don't show a support link if the site is whitelabeled
            !isSiteWhitelabeled && {
                url: externalURLs.help,
                text: 'Support',
                isExternal: true,
                shouldOpenInNewTab: true,
                analyticsAction: 'selected_support',
            },
            isLoggedIn ? // If the user is logged in, show a link to their account page
            {
                url: appURLs.accountVideos,
                text: 'Account',
                analyticsAction: 'selected_account_videos',
            } : // Don't show a login button for SSO users
            !isSSO && {
                isButton: true,
                onClick: () => dispatch(shopOperations.goToLoginPage()),
                text: 'Login',
                analyticsAction: 'login',
            },
        ], [hasConcierge, isSiteWhitelabeled, isLoggedIn, isSSO, dispatch],
    );

    if (isAdminPortal) {
        // For the mobile menu, only display the admin portal links
        if (isMobile) {
            headerLinkConfigs = [{
                    url: appURLs.manageUsers,
                    text: 'Manage Users',
                },
                {
                    url: appURLs.billingSummary,
                    text: 'Billing Summary',
                },
                {
                    url: appURLs.accountSettings,
                    text: 'Personal Settings',
                    isExternal: true,
                },
            ];
        } else {
            // There is a left sidebar menu for the main admin portal page so we only
            // want to render the Waymark logo in the header
            headerLinkConfigs = [];
        }
    }

    const shouldUseSlideNavMenu = isMobile;

    const HeaderComponent = shouldUseSlideNavMenu ? MobileHeader : DesktopHeader;

    return ( <
        HeaderComponent >
        <
        HeaderLinks headerLinkConfigs = {
            headerLinkConfigs
        }
        isMobileSlideNavLink = {
            shouldUseSlideNavMenu
        }
        /> <
        /HeaderComponent>
    );
};

export default WaymarkHeader;