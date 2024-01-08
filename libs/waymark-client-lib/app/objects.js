/**
 * @class
 * Class for consolidated handling & logic for the minimum information needed
 * to play a VideoTemplateVariant:
 *  - variantSlug
 *  - configuration
 *
 * @param  { object } options { variantSlug, configuration }
 */
/* eslint-disable-next-line import/prefer-default-export */
// TODO: This can probably go.
export class VideoSpec {
    constructor(options = {}) {
        // Accepts either camelCased or snake_cased slug key to account for
        // data that originates on both the client and the server.
        this.variantSlug = options.variantSlug || options.variant_slug || null;
        this.configuration = options.configuration || null;
        this.videoDescriptorConfiguration = options.videoDescriptorConfiguration || null;
    }

    /**
     * Translate the VideoSpec class into a plain, snake-cased object
     * for easy translation in API interfaces.
     */
    toObject() {
        return {
            variant_slug: this.variantSlug,
            configuration: this.configuration,
        };
    }
}

/**
 * Class for tracking in-progress promises so they can be retreived and returned
 * to any caller requesting a resource that's already being fetched.
 */
export class PromiseCache {
    constructor() {
        this.cache = {};
    }

    set(key, promise) {
        this.cache[key] = promise;
    }

    clear(key) {
        delete this.cache[key];
    }

    get(key) {
        return this.cache[key];
    }
}