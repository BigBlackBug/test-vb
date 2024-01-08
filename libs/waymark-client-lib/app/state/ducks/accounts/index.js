import reducer from './reducers.js';

import accountOperations from './operations.js';
import authOperations from './authOperations.js';

export const operations = {
    ...accountOperations,
    ...authOperations,
};

export {
    default as actions
}
from './actions.js';
export {
    default as selectors
}
from './selectors.js';

export default reducer;