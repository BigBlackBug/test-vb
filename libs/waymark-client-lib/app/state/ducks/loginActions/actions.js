import {
    LOGIN_ACTION_ADD,
    LOGIN_ACTION_CLEAR
} from 'app/state/actionTypes.js';

// Action Creations

/**
 * Adds a new login action
 * @param  {ActionConfig} actionConfig
 */
const addLoginAction = (actionConfig) => ({
    type: LOGIN_ACTION_ADD,
    payload: actionConfig,
});

/**
 * Clear the currently store login action.
 */
const clearLoginAction = () => ({
    type: LOGIN_ACTION_CLEAR,
});

export default {
    addLoginAction,
    clearLoginAction,
};