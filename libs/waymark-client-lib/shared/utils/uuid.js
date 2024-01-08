/**
 * Create a unique string for use as an identifier.
 * Taken from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
 */
export const uuid = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        /* eslint-disable-next-line one-var, no-bitwise */
        const r = (Math.random() * 16) | 0,
            /* eslint-disable-next-line no-bitwise */
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });

export const GUID_REGEX_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}/;
export const NESTED_GUID_REGEX_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}/;