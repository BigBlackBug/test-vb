// Vendor
import _ from 'lodash';

/**
 * Deep merges two objects without mutating the source object.
 *
 * @param  {object}  configurations   Two or more configurations to be merged. Values from
 *                                    later configurations will overwrite earlier sources.
 * @return {object}                   Object with merged key values pairs from configurations.
 *
 * Note: this function does not mutate any source configurations.
 */
/* eslint-disable-next-line import/prefer-default-export */
export function mergeConfigurations(...configurations) {
    return _.merge({}, ...configurations);
}

/**
 * Method enumerates configuration path structure rules and how they relate to their
 * corresponding editing action paths
 *
 * Constructs a valid editing action path for a given configuration path, based on its type
 *
 * @param {str} configurationPath Base level path for a configuration item
 */
export const getEditingActionChangePath = (configurationPath) =>
    // We specify what type of change operation we're targeting for text fields in the
    // editing action path, so we need to append `.content` to the path
    configurationPath.split('--')[0] === 'text' ? `${configurationPath}.content` : configurationPath;