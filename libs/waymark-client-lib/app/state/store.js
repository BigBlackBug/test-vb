/**
 * @namespace app.state
 */

import {
    connectRouter,
    routerMiddleware
} from 'connected-react-router';
import {
    applyMiddleware,
    createStore,
    combineReducers
} from 'redux';
import {
    composeWithDevTools
} from 'redux-devtools-extension';
import thunk from 'redux-thunk';

// Local
import * as reducers from './ducks/index.js';
import middleware from './middleware/index.js';
import history from './history.js';

const appRouterMiddleware = routerMiddleware(history);
const DEFAULT_STATE = {};

/**
 * This is our Redux store for the entirety of `app`.
 * @memberOf app.state
 */
const store = createStore(
    combineReducers({
        ...reducers,
        router: connectRouter(history),
    }),
    DEFAULT_STATE,
    composeWithDevTools(applyMiddleware(appRouterMiddleware, thunk, ...middleware)),
);

export default store;