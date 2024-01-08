import _ from 'lodash';
import {
    TextStyle
} from 'pixi.js';

/**
 * Gets the resizing strategy and the associated options from the layer metadata.
 *
 * The resizing strategy can be in the format of:
 *  null,
 *  string,
 *  tuple/array: [string, object] Where the string is the resizing strategy and the options
 *
 * @param      {object}  metadata  The meta data
 * @returns     {object}  An object containing the straregy and it's associated options
 */
// eslint-disable-next-line import/prefer-default-export
export function getResizingStrategyFromMetadata(metadata = {}) {
    let resizingStrategy;
    let resizingStrategyOptions = {};

    const resizingStrategyData =
        _.get(
            metadata,
            'textOptions.resizingStrategy',
            TextStyle.TEXT_RESIZING_STRATEGIES.default,
            // occasionally we will have a 'null' which won't trigger lodash's default value
        ) || TextStyle.TEXT_RESIZING_STRATEGIES.default;

    // If the strategy is a tuple, extract the strategy type and the options object
    // (Lodash will return false if it is a string)
    if (_.isArray(resizingStrategyData)) {
        [resizingStrategy, resizingStrategyOptions] = resizingStrategyData;
    } else {
        resizingStrategy = resizingStrategyData;
    }

    if (resizingStrategy === TextStyle.TEXT_RESIZING_STRATEGIES.stepAndBreakWords) {
        resizingStrategyOptions = {
            ...TextStyle.DEFAULT_STEP_AND_BREAK_WORDS_OPTIONS,
            ...resizingStrategyOptions,
        };
    }

    return {
        resizingStrategy,
        resizingStrategyOptions,
    };
}