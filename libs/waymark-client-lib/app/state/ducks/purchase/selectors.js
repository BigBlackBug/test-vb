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

localSelectors.getPurchaseFieldErrors = (state) =>
    _.isEmpty(state.error) ? {} : state.error.fieldErrors;

localSelectors.getPurchaseNonFieldErrors = (state) => {
    if (_.isEmpty(state.error)) {
        return [];
    }

    if (Array.isArray(state.error.errorMessage)) {
        return state.error.errorMessage;
    }

    return [state.error.errorMessage];
};

/**
 * Combines the field- and non-field-errors into a single object.
 * TODO FIXME: It would serve us well to maintain better consistency with error
 * object structure on the front end.
 * E.g., are errors within reducers strings or objects? My vote would be always objects,
 * always the same format.
 */
localSelectors.getPurchaseErrors = (state) => {
    const errors = {};
    const fieldErrors = localSelectors.getPurchaseFieldErrors(state);
    const nonFieldErrors = localSelectors.getPurchaseNonFieldErrors(state);

    if (fieldErrors) {
        errors.fieldErrors = fieldErrors;
    }
    if (nonFieldErrors) {
        errors.errorMessage = nonFieldErrors;
    }
    return errors;
};

localSelectors.isPurchaseInProgress = (state) => state.isPurchaseInProgress;
localSelectors.hasPurchasedPremiereUpsell = (state) => state.hasPurchasedPremiereUpsell;
localSelectors.getPremiereUpsellCouponGUID = (state) => state.premiereUpsellCouponGUID;
localSelectors.getPremiereUpsellErrorMessage = (state) =>
    _.isEmpty(state.premiereUpsellError) ? '' : state.premiereUpsellError.errorMessage;

export default localSelectors;

// Export global selectors.
const moduleName = 'purchase';
const localPath = stateKeys[moduleName];

export const getPremiereUpsellCouponGUID = globalizeSelector(
    localSelectors.getPremiereUpsellCouponGUID,
    localPath,
);
export const getPremiereUpsellErrorMessage = globalizeSelector(
    localSelectors.getPremiereUpsellErrorMessage,
    localPath,
);
export const getPurchaseFieldErrors = globalizeSelector(
    localSelectors.getPurchaseFieldErrors,
    localPath,
);
export const getPurchaseNonFieldErrors = globalizeSelector(
    localSelectors.getPurchaseNonFieldErrors,
    localPath,
);
export const hasPurchasedPremiereUpsell = globalizeSelector(
    localSelectors.hasPurchasedPremiereUpsell,
    localPath,
);
export const isPurchaseInProgress = globalizeSelector(
    localSelectors.isPurchaseInProgress,
    localPath,
);

export const getPurchaseErrors = globalizeSelector(localSelectors.getPurchaseErrors, localPath);