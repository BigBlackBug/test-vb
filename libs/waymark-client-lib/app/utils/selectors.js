import _ from 'lodash';

/**
 * Returns a new method that calls the provided selector on the relevant
 * subset of the `state`, based on the dotstring path to the local state.
 * @param  {string} path Dotstring ('account.subscriptions') path to the local slice within
 *        the global state object.
 */
const fromRoot = (path) => (selector) => (state, ...args) => selector(_.get(state, path), ...args);

/**
 * For the provided selector and a dot-string path to the relevant local state
 * slice, raturns a new selector function that operates on the global state.
 * @param  {function} selector Selector function
 * @param  {string} path Dot string path to the relevant local state slice.
 */
/* eslint-disable-next-line import/prefer-default-export */
export const globalizeSelector = (selector, path) => fromRoot(path)(selector);