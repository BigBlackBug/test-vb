/**
 * Map stripe error codes to our own fields and messages.
 *
 * In the event these don't catch all of these codes we may be getting a return code allow with 'card_decline' error code
 * that might also need to be mapped.
 */
const errorCodes = {
    // CVC/CVV Errors
    incorrect_cvc: {
        fieldName: 'cardCVV',
        message: "Your card's security code (CVV number) is invalid. Please double check and try again.",
    },
    invalid_cvc: {
        fieldName: 'cardCVV',
        message: "Your card's security code (CVV number) is invalid. Please double check and try again.",
    },
    // Expiration Date Errors
    invalid_expiry_month: {
        fieldName: 'cardExpiryMonth',
        message: "Your card's expiration month is incorrect. Please double check and try again.",
    },
    invalid_expiry_year: {
        fieldName: 'cardExpiryYear',
        message: "Your card's expiration year is incorrect. Please double check and try again.",
    },
    // Card Number Errors
    incorrect_number: {
        fieldName: 'cardNumber',
        message: 'Invalid credit card number. Please double check and try again.',
    },
    invalid_number: {
        fieldName: 'cardNumber',
        message: 'Invalid credit card number. Please double check and try again.',
    },
};

export default errorCodes;