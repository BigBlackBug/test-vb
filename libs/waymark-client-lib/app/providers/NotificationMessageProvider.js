// Vendor
import _ from 'lodash';
import {
    createContext,
    useState,
    useContext,
    useCallback
} from 'react';

// Local
import {
    uuid
} from 'shared/utils/uuid.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';

const ActiveNotificationMessagesContext = createContext();
const CreateNotificationMessageContext = createContext();

export const useActiveNotificationMessages = () => useContext(ActiveNotificationMessagesContext);
export const useCreateNotificationMessage = () => useContext(CreateNotificationMessageContext);

/**
 * Provider manages all notification messages which should be displayed to the user
 * It provides access to 2 contexts:
 *  CreateNotificationMessageContext - allows you to call createNotificationMessage which will
 *        create a new notification message to be displayed by the NotificationMessageDisplay component
 *  ActiveNotificationMessagesContext - gives access to the array of all currently active notification
 *        messages
 *
 * A notification message is represented as an object which can be consumed by the NotificationMessage component
 * It has been left pretty flexible if we ever want to do anything fancier with it, but for now
 * you can specify the duration that the message will be visible and the color theme that the
 * notification should have.
 */
const NotificationMessageProvider = ({
    children
}) => {
    const [activeNotificationMessages, setActiveNotificationMessages] = useState([]);

    /**
     * Method creates a new notification message to be displayed and sets a timeout to remove it after a set duration
     *
     * @param {string}  message                   The message text to display in the notification
     * @param {object}  [options={}]              Additional options to customize the appearance/behavior of the notification message
     * @param {number}  [options.duration=2000]   Amount of time in ms that the notification should remain visible for.
     * @param {string}  [options.theme]           Name for the theme class to apply styling to the notification message when displaying it
     *                                              Themes should correspond to the `notificationMessageThemes` enum defined in the
     *                                              NotificationMessageDisplay.js file.
     *                                              If no theme is provided, the NotificationMessage component will use the default theme.
     * @param {node}    [options.icon]            Optional icon element to display in the notification
     */
    const createNotificationMessage = useCallback((message, options = {}) => {
        // Create a unique ID for the notification message so we can find and remove it later
        const id = uuid();

        // Get duration provided from options, or default to 150 times the number of characters in the message - this is a very rough
        // arbitrary number I arrived at with the intent of trying to make notifications remain visible for the appropriate amount
        // of time it will take to read them
        const {
            duration = message.length * 150
        } = options;

        // Set a timeout to remove this notification message after the given duration has elapsed
        setTimeout(() => {
            // Using a callback function in our setter to help avoid unexpected behavior since we're doing a lot of
            // asynchronous modifications to the activeNotificationMessages array which may not always be guaranteed to be
            // reflected in the latest render when this is called
            setActiveNotificationMessages((currentlyActiveNotificationMessages) =>
                _.reject(currentlyActiveNotificationMessages, {
                    id
                }),
            );
        }, duration);

        // Construct our notification message configuration object which will be stored in
        // activeNotificationMessages and consumed by the NotificationMessage component
        const configuredNotificationMessage = {
            id,
            message,
            ...options,
        };

        setActiveNotificationMessages((currentlyActiveNotificationMessages) =>
            currentlyActiveNotificationMessages.concat(configuredNotificationMessage),
        );
    }, []);

    return ( <
        CreateNotificationMessageContext.Provider value = {
            createNotificationMessage
        } >
        <
        ActiveNotificationMessagesContext.Provider value = {
            activeNotificationMessages
        } > {
            children
        } <
        /ActiveNotificationMessagesContext.Provider> <
        /CreateNotificationMessageContext.Provider>
    );
};
NotificationMessageProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};

export default NotificationMessageProvider;