// Vendor
import _ from 'lodash';

// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';

const localSelectors = {};

/**
 * Return the current login action.
 * @param  {Object} state
 * @return {(ActionConfig|null)} Either the ActionConfig for the action to complete or `null`
 */
localSelectors.getLoginAction = (state) => (_.isEmpty(state.action) ? null : state.action);

/**
 * Whether or not we have an action to run
 * @param  {Object} state
 * @return {boolean}
 */
localSelectors.hasLoginAction = (state) => !_.isEmpty(state.action);

export default localSelectors;

// Export global selectors.
const moduleName = 'loginActions';
const localPath = stateKeys[moduleName];

export const getLoginAction = globalizeSelector(localSelectors.getLoginAction, localPath);
export const hasLoginAction = globalizeSelector(localSelectors.hasLoginAction, localPath);