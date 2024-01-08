/**
 * Types of actions that can be handled by the configuration
 * intepreter. Right now each action type matches its
 * WaymarkAuthorWebRenderer applyChange equivalent, but that
 * is not an architecturally enforced constraint.
 */
export const actionTypes = {
    waymarkAudioAsset: 'WAYMARK_AUDIO_ASSET',
    displayObjectVisibility: 'DISPLAY_OBJECT_VISIBILITY',
    shapeFillColor: 'SHAPE_FILL_COLOR',
    shapeGradientFillColor: 'SHAPE_GRADIENT_FILL_COLOR_STEPS',
    solidFillColor: 'SOLID_FILL_COLOR',
    effectFillColor: 'EFFECT_FILL_COLOR',
    shapeStrokeColor: 'SHAPE_STROKE_COLOR',
    imageAsset: 'IMAGE_ASSET',
    imagePath: 'IMAGE_PATH',
    textContent: 'TEXT_CONTENT',
    textFillColor: 'TEXT_FILL_COLOR',
    textStrokeColor: 'TEXT_STROKE_COLOR',
    textFontProperties: 'FONT_PROPERTY',
    // This is used in footage compositions, i.e. themes
    videoLayerResource: 'WAYMARK_VIDEO_ASSET',
    // This is used in layer videos, i.e. inline-videos
    videoLayerProperties: 'LAYER_VIDEO',
    audioLayerProperties: 'LAYER_AUDIO',
    imageLayerProperties: 'LAYER_IMAGE',
    layerAdd: 'LAYER_ADD',
};

/**
 * Types of action object sets. An action set can be an array
 * or an object, where objects define rules of execution for
 * each member of the set. Currently only a "switch" object
 * type is supported.
 */
export const actionSetTypes = {
    // Match action sets using a case operation.
    switch: 'switch',
};

/**
 * Operations for each case of a switch action set. These
 * operations are used to determine whether the actions of
 * each case will be executed. Currently only an "equals"
 * operation is supported.
 */
export const caseOperations = {
    // Execute case actions if event value equals case value
    equals: 'equals',
};

/**
 * Operations for each action value.
 */
export const valueOperations = {
    // Set the action value to the specified payload. This is
    // used for actions with fixed values, such as font colors
    // controlled by themes.
    setExplicit: 'setExplicit',
    // Pass the event value into the action value. This is used
    // for actions that require a user-defined value, such as a
    // text form field input.
    passthrough: 'passthrough',
};

/**
 * volumeChange types for LAYER_AUDIO and LAYER_VIDEO edit actions.
 */
export const layerVolumeChangeTypes = {
    targetDucking: 'targetDucking',
};

/**
 * Layer types that can be dynamically added via the editor
 */
export const dynamicLayerTypes = {
    auxiliaryAudio: 'auxiliaryAudio',
};

/**
 * Configuration interpreter schema.
 */
export const configurationInterpreterSchema = {
    title: 'Configuration Interpreter',
    type: 'object',
    definitions: {
        valueSetExplicitOperation: {
            properties: {
                operation: {
                    const: valueOperations.setExplicit
                },
                payload: {},
            },
            required: ['operation', 'payload'],
        },
        valuePassthroughOperation: {
            properties: {
                operation: {
                    const: valueOperations.passthrough
                },
            },
            required: ['operation'],
        },
        assetLocation: {
            type: 'object',
            properties: {
                plugin: {
                    type: 'string'
                },
                id: {
                    type: 'string'
                },
            },
        },
        assetData: {
            properties: {
                payload: {
                    type: 'object',
                    properties: {
                        // 'u' and 'p' properties will be deprecated eventually,
                        // because file+URL paths can now be handled with plugins.
                        // TODO: Split this into two separate schemas or remove
                        // the u/p properties.
                        type: {
                            type: 'string'
                        },
                        id: {
                            type: 'string'
                        },
                        u: {
                            type: 'string'
                        },
                        p: {
                            type: 'string'
                        },
                        e: {
                            type: 'number'
                        },
                        w: {
                            type: 'number'
                        },
                        h: {
                            type: 'number'
                        },
                        location: {
                            $ref: '#/definitions/assetLocation'
                        },
                        modifications: {
                            type: 'object',
                        },
                    },
                    required: ['id', 'location', 'type'],
                },
            },
        },
        targetDuckingVolumeChange: {
            properties: {
                type: {
                    const: layerVolumeChangeTypes.targetDucking
                },
                duckingTarget: {
                    type: 'string'
                },
                targetVolume: {
                    type: 'string'
                },
            },
            required: ['type', 'duckingTarget', 'targetVolume'],
        },
        layerAudioData: {
            properties: {
                payload: {
                    type: 'object',
                    properties: {
                        layer: {
                            type: 'string'
                        },
                        isMuted: {
                            type: 'boolean'
                        },
                        volume: {
                            type: 'number'
                        },
                        content: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string'
                                },
                                key: {
                                    type: 'string'
                                },
                                location: {
                                    $ref: '#/definitions/assetLocation'
                                },
                            },
                        },
                        volumeChanges: {
                            type: 'array',
                            items: {
                                anyOf: [{
                                    $ref: '#/definitions/targetDuckingVolumeChange'
                                }],
                            },
                        },
                    },
                    required: ['layer'],
                },
            },
        },
        layerVideoData: {
            properties: {
                payload: {
                    type: 'object',
                    properties: {
                        layer: {
                            type: 'string'
                        },
                        isMuted: {
                            type: 'boolean'
                        },
                        volume: {
                            type: 'number'
                        },
                        content: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string'
                                },
                                key: {
                                    type: 'string'
                                },
                                location: {
                                    $ref: '#/definitions/assetLocation'
                                },
                            },
                        },
                        contentTrimStartTime: {
                            type: 'number'
                        },
                        contentTrimDuration: {
                            type: 'number'
                        },
                        contentPlaybackDuration: {
                            type: 'number'
                        },
                        volumeChanges: {
                            type: 'array',
                            items: {
                                anyOf: [{
                                    $ref: '#/definitions/targetDuckingVolumeChange'
                                }],
                            },
                        },
                    },
                    required: ['layer'],
                },
            },
        },
        layerImageData: {
            properties: {
                payload: {
                    type: 'object',
                    properties: {
                        layer: {
                            type: 'string'
                        },
                        content: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string'
                                },
                                key: {
                                    type: 'string'
                                },
                                location: {
                                    $ref: '#/definitions/assetLocation'
                                },
                            },
                        },
                        fitFillAlignment: {
                            type: 'string'
                        },
                    },
                    required: ['layer'],
                },
            },
        },
        value: {
            anyOf: [{
                    $ref: '#/definitions/valueSetExplicitOperation'
                },
                {
                    $ref: '#/definitions/valuePassthroughOperation'
                },
            ],
        },
        waymarkAudioAssetEditAction: {
            properties: {
                type: {
                    const: actionTypes.waymarkAudioAsset
                },
                value: {
                    allOf: [{
                        $ref: '#/definitions/value'
                    }, {
                        $ref: '#/definitions/assetData'
                    }],
                },
            },
            required: ['type', 'value'],
        },
        displayObjectVisibility: {
            properties: {
                type: {
                    const: actionTypes.displayObjectVisibility
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'boolean'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'value'],
        },
        shapeFillColorEditAction: {
            properties: {
                type: {
                    const: actionTypes.shapeFillColor
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        shapeGradientFillColorEditAction: {
            properties: {
                type: {
                    const: actionTypes.shapeGradientFillColor
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'object'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        solidFillColorEditAction: {
            properties: {
                type: {
                    const: actionTypes.solidFillColor
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        effectFillColorEditAction: {
            properties: {
                type: {
                    const: actionTypes.effectFillColor
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        shapeStrokeColorEditAction: {
            properties: {
                type: {
                    const: actionTypes.shapeStrokeColor
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        imageAssetEditAction: {
            properties: {
                type: {
                    const: actionTypes.imageAsset
                },
                value: {
                    allOf: [{
                        $ref: '#/definitions/value'
                    }, {
                        $ref: '#/definitions/assetData'
                    }],
                },
            },
            required: ['type', 'value'],
        },
        imagePathEditAction: {
            properties: {
                type: {
                    const: actionTypes.imagePath
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        textContentEditAction: {
            properties: {
                type: {
                    const: actionTypes.textContent
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        textFillColorEditAction: {
            properties: {
                type: {
                    const: actionTypes.textFillColor
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        textStrokeColorEditAction: {
            properties: {
                type: {
                    const: actionTypes.textStrokeColor
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        videoLayerResourceEditAction: {
            properties: {
                type: {
                    const: actionTypes.videoLayerResource
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'value'],
        },
        textFontPropertiesEditAction: {
            properties: {
                type: {
                    const: actionTypes.textFontProperties
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                            $ref: '#/definitions/value'
                        },
                        {
                            properties: {
                                payload: {
                                    type: 'string'
                                },
                            },
                        },
                    ],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        videoLayerPropertiesEditAction: {
            properties: {
                type: {
                    const: actionTypes.videoLayerProperties
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                        $ref: '#/definitions/value'
                    }, {
                        $ref: '#/definitions/layerVideoData'
                    }],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        audioLayerPropertiesEditAction: {
            properties: {
                type: {
                    const: actionTypes.audioLayerProperties
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                        $ref: '#/definitions/value'
                    }, {
                        $ref: '#/definitions/layerAudioData'
                    }],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        imageLayerPropertiesEditAction: {
            properties: {
                type: {
                    const: actionTypes.imageLayerProperties
                },
                targets: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                },
                value: {
                    allOf: [{
                        $ref: '#/definitions/value'
                    }, {
                        $ref: '#/definitions/layerImageData'
                    }],
                },
            },
            required: ['type', 'targets', 'value'],
        },
        actionSet: {
            type: 'array',
            items: {
                // Setting anyOf with a large number of different objects is dangerous.
                // If one item contains an error, the error will propogate through every
                // every editAction listed in this array, causing a flood of exceptions.
                // This can potentially be avoided using draft-07 if/then chaining.
                // See app/constants/VideoEditingFormDescriptionSchema.js for more info.
                anyOf: [{
                        $ref: '#/definitions/waymarkAudioAssetEditAction'
                    },
                    {
                        $ref: '#/definitions/displayObjectVisibility'
                    },
                    {
                        $ref: '#/definitions/shapeFillColorEditAction'
                    },
                    {
                        $ref: '#/definitions/shapeGradientFillColorEditAction'
                    },
                    {
                        $ref: '#/definitions/solidFillColorEditAction'
                    },
                    {
                        $ref: '#/definitions/effectFillColorEditAction'
                    },
                    {
                        $ref: '#/definitions/shapeStrokeColorEditAction'
                    },
                    {
                        $ref: '#/definitions/imageAssetEditAction'
                    },
                    {
                        $ref: '#/definitions/imagePathEditAction'
                    },
                    {
                        $ref: '#/definitions/textContentEditAction'
                    },
                    {
                        $ref: '#/definitions/textFillColorEditAction'
                    },
                    {
                        $ref: '#/definitions/textStrokeColorEditAction'
                    },
                    {
                        $ref: '#/definitions/videoLayerResourceEditAction'
                    },
                    {
                        $ref: '#/definitions/textFontPropertiesEditAction'
                    },
                    {
                        $ref: '#/definitions/videoLayerPropertiesEditAction'
                    },
                    {
                        $ref: '#/definitions/audioLayerPropertiesEditAction'
                    },
                    {
                        $ref: '#/definitions/imageLayerPropertiesEditAction'
                    },
                ],
            },
        },
        switchActionSet: {
            type: 'object',
            properties: {
                type: {
                    const: actionSetTypes.switch
                },
                switch: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            case: {
                                oneOf: [{
                                    type: 'boolean'
                                }, {
                                    type: 'string'
                                }],
                            },
                            operation: {
                                type: 'string',
                                enum: [caseOperations.equals],
                            },
                            actions: {
                                anyOf: [{
                                        $ref: '#/definitions/actionSet'
                                    },
                                    {
                                        $ref: '#/definitions/switchActionSet'
                                    },
                                ],
                            },
                        },
                        required: ['case', 'operation', 'actions'],
                    },
                },
            },
            required: ['type', 'switch'],
        },
    },
    properties: {
        events: {
            description: 'Form field events',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string'
                    },
                    actions: {
                        anyOf: [{
                            $ref: '#/definitions/actionSet'
                        }, {
                            $ref: '#/definitions/switchActionSet'
                        }],
                    },
                },
                required: ['path', 'actions'],
            },
        },
    },
    required: ['events'],
};