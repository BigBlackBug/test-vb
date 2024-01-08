/**
 *  These are the names of custom properties that are unified across all objects/layers
 *  we create for our custom PIXI application. These should be assumed to be a standard
 *  contract across our use in the application, so make sure to write a note about what
 *  each property is used for.
 */
const waymarkAuthorCustomProperties = {
    // After the stage is fully setup, we call this method on every object in a stage to
    // update it with information that can only be determined if the entire layer tree
    // has been created.
    postStageCreationSetup: 'postStageCreationSetup',
    // To be called when we resize the renderer with `setScale`
    onRendererSetScale: 'onRendererSetScale',
};

export default waymarkAuthorCustomProperties;