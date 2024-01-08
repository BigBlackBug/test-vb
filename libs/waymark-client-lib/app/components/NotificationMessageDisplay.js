// Vendor
import PropTypes from 'prop-types';
import {
    TransitionGroup
} from 'react-transition-group';

// Local
import {
    useActiveNotificationMessages
} from 'app/providers/NotificationMessageProvider.js';
import ToggleSlideFadeTransition from 'shared/components/ToggleSlideFadeTransition';

import * as styles from './NotificationMessageDisplay.css';

/**
 * Displays a notification which slides/fades in and out at the bottom of the screen to display a message
 *
 * @param {bool}    in            Whether the message should be displayed or not - this prop is provided by TransitionGroup
 * @param {string}  messageText   The text of the message to display
 * @param {node}    [icon]        Icon element to display above the message text
 * @param {string}  [theme]       The theme to apply to the notification message - available themes are defined in the
 *                                  messageThemes enum defined in NotificationMessageDisplay.css.ts}
 */
const NotificationMessage = ({ in: isVisible = false,
    messageText,
    icon = null,
    theme = styles.messageThemes.default,
}) => ( <
    ToggleSlideFadeTransition isVisible = {
        isVisible
    }
    direction = "up"
    shouldReverseOnExit { ...styles.dataHasIcon(icon !== null)
    } { ...styles.dataMessageTheme(theme)
    }
    className = {
        styles.NotificationMessage
    }
    duration = {
        250
    } >
    {
        icon
    } {
        messageText
    } <
    /ToggleSlideFadeTransition>
);

NotificationMessage.propTypes = {
    messageText: PropTypes.string.isRequired,
    in: PropTypes.bool,
    theme: PropTypes.oneOf(Object.values(styles.messageThemes)),
    icon: PropTypes.node,
};

/**
 * Displays all currently active messages and manages animating them in/out
 */
const NotificationMessageDisplay = () => {
    const notificationMessages = useActiveNotificationMessages();

    return ( <
        TransitionGroup className = {
            styles.NotificationMessageDisplay
        } > {
            notificationMessages.map((message) => ( <
                NotificationMessage key = {
                    message.id
                }
                messageText = {
                    message.message
                }
                theme = {
                    message.theme
                }
                icon = {
                    message.icon
                }
                />
            ))
        } <
        /TransitionGroup>
    );
};

export default NotificationMessageDisplay;