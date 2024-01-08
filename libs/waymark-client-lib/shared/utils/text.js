/**
 * Trim a text string to a specified character limit, and preserve words, if
 * possible.
 * @method  trimTextToMaxCharacterLimit
 * @param   {String}  text               Text to trim
 * @param   {Number}  maxCharacterLimit  Maximum length of the trimmed text
 * @param   {String}  separator=' '      Word separator
 * @return  {String}                     Trimmed text
 */

// Ignoring the next line because it will throw a 'Prefer default export' linting error,
// but we know that more functions will be added to this file.
export function trimTextToMaxCharacterLimit(text, maxCharacterLimit, separator = ' ') {
    if (text.length <= maxCharacterLimit) {
        return text;
    }

    const foundCharacterPosition = text.lastIndexOf(separator, maxCharacterLimit);
    let characterLimit;
    if (foundCharacterPosition > -1) {
        characterLimit = foundCharacterPosition;
    } else {
        characterLimit = maxCharacterLimit;
    }

    return text.substr(0, characterLimit);
}

/**
 * Add up to two trailing zeroes to an amount.
 * Note that this will round and trim decimals if necessary and return null for null.
 *   25       ->  25.00
 *   25.5     ->  25.50
 *   25.05    ->  25.05
 *   25.5678  ->  25.57
 *   null     ->  null
 *
 * @method formatPriceForDisplay
 * @param  {(number|string)} price: An amount which may or may not have a decimal trail
 * @param  {(number)} decimals: Optional: the number of trailing decimals to use in the formatted number.
 * @param  {(any)} defaultValue: Optional: the return value in cases where price is not a valid value.
 * @param  {bool}   shouldAddTrailingDecimalsToWholeNumbers   Optional: whether we should add trailing decimals to numbers even if they're
 *                                                              whole integers
 * @return {String} An amount with a trailing decimal
 */
export function formatPriceForDisplay(
    price,
    decimals = 2,
    defaultValue = null,
    shouldAddTrailingDecimalsToWholeNumbers = false,
) {
    if (typeof price === 'number') {
        // If the number is a whole integer, its remainder from 1 will be 0 -
        // otherwise, it will be a non-zero decimal
        const isWholeNumber = price % 1 === 0;

        // Format number with decimals if it's not a whole number or if we should add trailing decimals no matter what
        if (shouldAddTrailingDecimalsToWholeNumbers || !isWholeNumber) {
            return price.toFixed(decimals);
        }

        return price;
    }
    if (typeof price === 'string') {
        try {
            const parsedNumberPrice = Number(price);
            if (Number.isNaN(parsedNumberPrice)) {
                return defaultValue;
            }
            return shouldAddTrailingDecimalsToWholeNumbers || parsedNumberPrice % 1 ?
                parsedNumberPrice.toFixed(decimals) :
                parsedNumberPrice;
        } catch (error) {
            console.warn(`Unable for format ${price} as a price.`, error);
        }
    }
    return defaultValue;
}

/**
 * Splits a body of text into an array of sentences.
 * From https://stackoverflow.com/questions/11761563/javascript-regexp-for-splitting-text-into-sentences-and-keeping-the-delimiter
 * @param   {string}    text       A body of text
 * @return  {[string]}             An array of sentences
 */
export function splitTextIntoSentences(text) {
    // eslint-disable-next-line no-useless-escape
    return text.match(/[^\.!\?]+[\.!\?]+/g) || [];
}

/**
 * Reduces a phone number string input to decimal characters.
 * @param  {string}  phoneNumber  Phone number string
 * @return {string}               Trimmed phone number string
 */
export function trimPhoneNumber(phoneNumber) {
    return phoneNumber.trim().replace(/\D/g, '');
}

/**
 * Converts a given number of seconds to a timestamp with format m:ss
 * @param {number}  totalSeconds  Number of seconds that we're converting
 * @return {string}               Formatted timestamp for the given number of seconds
 */
export const formatSecondsAsTimestamp = (totalSeconds) => {
    // Get number of minutes in total seconds
    const minutes = Math.floor(totalSeconds / 60);
    // Get the remainder of seconds that don't divide evenly into a minute
    const seconds = Math.round(totalSeconds - minutes * 60);

    // Format minutes and seconds into string with format m:ss (insert a 0 in front of seconds if it's a single digit)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Takes video frame and converts it to a time string based on the video's framerate
export const formatFrameAsTimeString = (frame, frameRate) => {
    // Get total number of seconds for the given frame
    const totalSeconds = frame / frameRate;

    // Format our total seconds as a timestamp string with the format "m:ss"
    return formatSecondsAsTimestamp(totalSeconds);
};

/**
 * Converts array of strings to a comma-separated string representation
 *
 * @param {Array[String]} arr Array of strings
 * @returns {String} String representation of list
 */
export const convertListToString = (arr) => {
    const numStrings = arr.length;

    if (numStrings === 1) {
        return arr[0];
    }

    if (numStrings === 2) {
        return `${arr[0]} and ${arr[1]}`;
    }

    // If the original array contains more than two strings, insert 'and' before the last string
    // 'string 1, string 2, and string 3'
    return `${arr.slice(0, numStrings - 1).join(', ')}, and ${arr[numStrings - 1]}`;
};