/**
 * Base change operation class
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object}  payload The payload of the change operation
 * @mixin
 */
export default class BaseChangeOperation {
    constructor(renderer, payload) {
        this.renderer = renderer;
        this.payload = payload;

        if (this.isLayerModification && !this.payload.layer) {
            throw new Error(
                'payload.layer attribute required for change operations with isLayerOperation',
            );
        }
    }

    /**
     * Get a unique string type identifier for the change operation.
     *
     * @abstract
     * @returns  {string}  Type identifier
     */
    static get type() {
        throw new Error('BaseChangeOperation type getter override required');
    }

    /**
     * Get if the change operation targets a layer (or layers). Layer operations
     * will be executed in a series for each targeted layer. If this is true,
     * the payload must set payload.layer.
     *
     * @abstract
     * @returns {boolean} If change operation is a layer modification
     */
    static get isLayerModification() {
        throw new Error('BaseChangeOperation isLayerModification getter override required');
    }

    /**
     * Update the template manifest for the change operation payload.
     *
     * @abstract
     */
    /* eslint-disable-next-line class-methods-use-this */
    updateManifest = async () => {
        throw new Error('BaseChangeOperation.updateManifest(...) method override required');
    };

    /**
     * Add assets created or updated in `updateManifest` to the loading queue (if needed)
     * Expects a list of asset objects to be loaded.
     */
    /* eslint-disable-next-line class-methods-use-this */
    getAssetsToLoad = () => [];

    /**
     * Update the Greensock timeline and PixiJS stage for the change operation payload.
     *
     * @abstract
     */
    /* eslint-disable-next-line class-methods-use-this */
    updateStage = async () => {
        throw new Error('BaseChangeOperation.updateStage(...) method override required');
    };
}