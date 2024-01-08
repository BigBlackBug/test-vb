// Helper function for constructing errors for prop validation
const makeError = (componentName, errorMessage) =>
    new Error(`Error in ${componentName}: ${errorMessage}`);

// Class to provide a nice structured interface when creating
// custom validation checks for a prop
export class ValidationCheck {
    constructor(evaluateFunction, errorMessage) {
        this.evaluateFunction = evaluateFunction;
        this.errorMessage = errorMessage;
    }
}

/**
 * Utility function for performing custom prop validation for React components
 *
 * @param {string}    type                        The type that we expect will be returned by typeof for the prop
 * @param {bool}      isRequired                  Whether the prop is required
 * @param {ValidationCheck[]}  validationChecks   An array of custom validation checks to run
 *                                                 Each check comes in the format:
 *                                                   {
 *                                                     evaluateFunction: the function to run which will return true if the
 *                                                       check has passed or false if it failed,
 *                                                     errorMessage: the error message to return if the check failed
 *                                                   }
 */
export const getCustomPropValidator = (type, isRequired, validationChecks) => (
    props,
    propName,
    componentName,
) => {
    const propValue = props[propName];

    if (propValue != null) {
        // Make sure the provided prop value is of the correct type
        // eslint-disable-next-line valid-typeof
        if (typeof propValue !== type) {
            return makeError(
                componentName,
                `provided value ${propValue} for prop ${propName} is not of type ${type}`,
            );
        }

        // Using a for loop because we want to be able to return early if we hit an error
        // (doing this inside a foreach loop makes eslint complain)
        // Running through all provided checks and returning with errors for any checks that fail
        for (let i = 0, numChecks = validationChecks.length; i < numChecks; i += 1) {
            const check = validationChecks[i];

            // Return the provided check function - if it returns true, all is well,
            // if it returns false, something went wrong
            if (!check.evaluateFunction(props, propName)) {
                // If the check failed, return an error with the check's provided error message
                return makeError(componentName, check.errorMessage);
            }
        }
    }
    // If the prop is required and doesn't exist, throw an error
    else if (isRequired) {
        return makeError(componentName, `prop ${propName} is required but was not provided`);
    }

    return null;
};