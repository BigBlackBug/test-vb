/* eslint-disable import/prefer-default-export */
import {
    useLayoutEffect
} from 'react';

import Intercom from 'shared/utils/intercom.js';

/**
 * Hides intercom chat button on mount and shows it again on unmount
 * @param  {boolean} shouldHide  Option to conditionally hide chat, for example to only
 *                               hide the chat for mobile users on a given page
 */
export const useHideChat = (shouldHide = true) => {
    useLayoutEffect(() => {
        if (shouldHide) {
            // Close the chat panel if it's open
            Intercom('hide');
            // Note that `Intercom('hide')` will only minimize the chat panel so this is what we have
            // to do in order to properly fully hide the widget
            Intercom('update', {
                hide_default_launcher: true,
            });
        }

        return () => {
            // Note that `Intercom('show')` will only open the chat panel so this is what we have
            // to do in order to properly fully un-hide the widget
            Intercom('update', {
                hide_default_launcher: false,
            });
        };
    }, [shouldHide]);
};