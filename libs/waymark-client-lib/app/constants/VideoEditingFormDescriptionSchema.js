import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    GUID_REGEX_PATTERN
} from 'shared/utils/uuid.js';

/**
 * TODO: A formDescription is an object that has one key, editingFormFields,
 * which is an array with any combination of the following schema types:
 * textEditingField
 * textSelectorEditingField
 * imageEditingField
 * audioEditingField
 * colorEditingField
 * layoutSelectorEditingField
 * fontEditingField
 * videoEditingField
 *
 * In order to validate a formDescription with the schema below, every object
 * in the editingFormFields has to be checked against all of the schema types
 * listed above. That results in many duplicated errors, especially for any
 * property that is shared accross multiple object types. In JSON Schema
 * Draft-07 if/then/else statements were introduced and theoretically, we
 * could use if/then/else in conjunction with oneOf, allOf, or anyOf to only
 * validate an object against one object editing field schema (based on this
 * StackOverflow post: https://stackoverflow.com/questions/46122500/
 * how-to-use-switch-in-json-schema-6-with-multiple-ifs). This would
 * reduce the noise when an invalid formDescription is validated and improve
 * our error handling. An example of what that might look like:
 *
 * "type": "object",
  "properties": {
    "editingFormFields": {
      "type": "array",
      "minItems": 1,
      "items": {
        "anyOf": [
          {
            "if": { "properties": { "type": { "const": VideoEditingFieldTypes.text }}},
            "then": { "$ref": "#/definitions/textEditingField" },
          },
          {
            "if": { "properties": { "type": { "const": VideoEditingFieldTypes.image }}},
            "then": { "$ref": "#/definitions/imageEditingField" },
          },
          {
            "if": { "properties": { "type": { "const": VideoEditingFieldTypes.audio }}},
            "then": { "$ref": "#/definitions/audioEditingField" },
          },
          {
            "if": { "properties": { "type": { "const": VideoEditingFieldTypes.color }}},
            "then": { "$ref": "#/definitions/colorEditingField" },
          },
          {
            "if": { "properties": { "type": { "const": VideoEditingFieldTypes.layoutSelector }}},
            "then": { "$ref": "#/definitions/layoutSelectorEditingField" },
          },
          {
            "if": { "properties": { "type": { "const": VideoEditingFieldTypes.font }}},
            "then": { "$ref": "#/definitions/fontEditingField" },
          },
          {
            "if": { "properties": { "type": { "const": VideoEditingFieldTypes.video }}},
            "then": { "$ref": "#/definitions/videoEditingField" },
          },
        ],
      },
    },
  },
 */
/* eslint-disable-next-line import/prefer-default-export */
export const formDescriptionSchema = {
    definitions: {
        globalProperties: {
            type: 'object',
            properties: {
                editingFieldKey: {
                    oneOf: [{
                            type: 'string',
                            // regex pattern matching in JSON schema needs a string, so get the
                            // source string of the regex pattern (a string without the leading/trailing "/")
                            pattern: GUID_REGEX_PATTERN.source,
                        },
                        {
                            const: 'backgroundAudio'
                        },
                    ],
                },
                displayTime: {
                    oneOf: [{
                            type: 'number',
                            minimum: 0,
                        },
                        {
                            type: 'null'
                        },
                    ],
                },
                // The label isn't currently being displayed to the user in the Editor,
                // but when it is, I can imagine having extra validation on this property
                label: {
                    type: 'string'
                },
            },
            required: ['editingFieldKey', 'displayTime', 'label'],
        },
        paths: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'string'
            },
        },
        characterLimit: {
            oneOf: [{
                    type: 'number',
                    minimum: 1,
                },
                {
                    type: 'null'
                },
            ],
        },
        location: {
            oneOf: [{
                type: 'object',
                properties: {
                    plugin: {
                        type: 'string',
                    }
                },
                required: ['plugin'],
                additionalProperties: true,
            }, ],
        },
        selectOptions: {
            type: 'array',
            // SS TODO: This is temporary! MinItems should be 2, not 1, but we removed some unused
            // audio tracks so a template temporarily has only one audio option, but will have more
            // very soon.
            minItems: 1,
            items: {
                type: 'object',
                properties: {
                    label: {
                        type: 'string'
                    },
                    configurationValue: {
                        oneOf: [{
                                type: 'string'
                            },
                            {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                    },
                                    location: {
                                        $ref: '#/definitions/location'
                                    },
                                },
                                required: ['type', 'location'],
                            },
                        ],
                    },
                },
                required: ['label', 'configurationValue'],
            },
        },
        textEditingField: {
            allOf: [{
                    $ref: '#/definitions/globalProperties'
                },
                {
                    properties: {
                        type: {
                            const: VideoEditingFieldTypes.text
                        },
                        characterLimit: {
                            $ref: '#/definitions/characterLimit'
                        },
                        paths: {
                            $ref: '#/definitions/paths'
                        },
                        splitDirection: {
                            type: 'string',
                            enum: ['left', 'right'],
                        },
                    },
                    required: ['type', 'paths', 'characterLimit'],
                },
            ],
        },
        textSelectorEditingField: {
            allOf: [{
                    $ref: '#/definitions/globalProperties'
                },
                {
                    properties: {
                        type: {
                            const: VideoEditingFieldTypes.textSelector
                        },
                        paths: {
                            $ref: '#/definitions/paths'
                        },
                        selectOptions: {
                            $ref: '#/definitions/selectOptions'
                        },
                        splitDirection: {
                            type: 'string',
                            enum: ['left', 'right'],
                        },
                    },
                    required: ['type', 'paths', 'selectOptions'],
                },
            ],
        },
        imageEditingField: {
            allOf: [{
                    $ref: '#/definitions/globalProperties'
                },
                {
                    properties: {
                        type: {
                            const: VideoEditingFieldTypes.image
                        },
                        paths: {
                            $ref: '#/definitions/paths'
                        },
                        aspectRatio: {
                            oneOf: [{
                                type: 'number'
                            }, {
                                type: 'null'
                            }],
                        },
                        width: {
                            oneOf: [{
                                type: 'number'
                            }, {
                                type: 'null'
                            }],
                        },
                        height: {
                            oneOf: [{
                                type: 'number'
                            }, {
                                type: 'null'
                            }],
                        },
                    },
                    required: ['type', 'paths'],
                },
            ],
        },
        audioEditingField: {
            allOf: [{
                    $ref: '#/definitions/globalProperties'
                },
                {
                    properties: {
                        type: {
                            const: VideoEditingFieldTypes.audio
                        },
                        paths: {
                            $ref: '#/definitions/paths'
                        },
                        selectOptions: {
                            $ref: '#/definitions/selectOptions'
                        },
                    },
                    required: ['type', 'paths', 'selectOptions'],
                },
            ],
        },
        colorEditingField: {
            allOf: [{
                    $ref: '#/definitions/globalProperties'
                },
                {
                    properties: {
                        type: {
                            const: VideoEditingFieldTypes.color
                        },
                        paths: {
                            $ref: '#/definitions/paths'
                        },
                    },
                    required: ['type', 'paths'],
                },
            ],
        },
        fontEditingField: {
            allOf: [{
                    $ref: '#/definitions/globalProperties'
                },
                {
                    properties: {
                        type: {
                            const: VideoEditingFieldTypes.font
                        },
                        fontOverrides: {
                            type: 'object',
                            patternProperties: {
                                '^(fontOverride--)[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}': {
                                    originalTypography: {
                                        type: 'object',
                                        properties: {
                                            fontFamily: {
                                                type: 'string'
                                            },
                                            fontSizeAdjustment: {
                                                type: 'number'
                                            },
                                            fontStyle: {
                                                type: 'string'
                                            },
                                            fontWeight: {
                                                type: 'number'
                                            },
                                        },
                                        required: ['fontFamily', 'fontSizeAdjustment', 'fontStyle', 'fontWeight'],
                                    },
                                    paths: {
                                        $ref: '#/definitions/paths'
                                    },
                                },
                            },
                            additionalProperties: false,
                        },
                        respectedPathMappings: {
                            type: 'object',
                            description: "Respected path mappings defines how many font overrides should be respected for a template, and which additional font overrides should respect their selected value. This field allows us to have as many font overrides as we want defined in a template's configuration while still controlling how many font options are exposed to the user via the editor.",
                            patternProperties: {
                                '^(fontOverride--)[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}': {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    },
                                },
                            },
                            additionalProperties: false,
                        },
                    },
                },
            ],
            required: ['type', 'fontOverrides', 'respectedPathMappings'],
        },
        layoutSelectorEditingField: {
            allOf: [{
                    $ref: '#/definitions/globalProperties'
                },
                {
                    properties: {
                        type: {
                            const: VideoEditingFieldTypes.layoutSelector
                        },
                        paths: {
                            $ref: '#/definitions/paths'
                        },
                        selectOptions: {
                            type: 'array',
                            minItems: 2,
                            items: {
                                type: 'object',
                                properties: {
                                    configurationValue: {
                                        oneOf: [{
                                            type: 'string'
                                        }, {
                                            type: 'boolean'
                                        }]
                                    },
                                    label: {
                                        type: 'string'
                                    },
                                    contentFields: {
                                        type: 'array',
                                        items: {
                                            // This means that the array must contain at least
                                            // one of the following values, but what if it"s
                                            // empty? I.e., one layout option has a combo of
                                            // text/image/logo/etc., but the alternate option
                                            // is nothing?
                                            anyOf: [{
                                                    $ref: '#/definitions/textEditingField'
                                                },
                                                {
                                                    $ref: '#/definitions/textSelectorEditingField'
                                                },
                                                {
                                                    $ref: '#/definitions/imageEditingField'
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    required: ['type', 'paths', 'selectOptions'],
                },
            ],
        },
        videoEditingField: {
            allOf: [{
                    $ref: '#/definitions/globalProperties'
                },
                {
                    properties: {
                        type: {
                            const: VideoEditingFieldTypes.video
                        },
                        paths: {
                            $ref: '#/definitions/paths'
                        },
                        inPoint: {
                            type: 'number'
                        },
                        outPoint: {
                            type: 'number'
                        },
                    },
                    required: ['type', 'paths', 'inPoint', 'outPoint'],
                },
            ],
        },
    },

    type: 'object',
    properties: {
        editingFormFields: {
            type: 'array',
            minItems: 1,
            items: {
                anyOf: [{
                        $ref: '#/definitions/audioEditingField'
                    },
                    {
                        $ref: '#/definitions/colorEditingField'
                    },
                    {
                        $ref: '#/definitions/fontEditingField'
                    },
                    {
                        $ref: '#/definitions/imageEditingField'
                    },
                    {
                        $ref: '#/definitions/layoutSelectorEditingField'
                    },
                    {
                        $ref: '#/definitions/textEditingField'
                    },
                    {
                        $ref: '#/definitions/textSelectorEditingField'
                    },
                    {
                        $ref: '#/definitions/videoEditingField'
                    },
                ],
            },
        },
    },
    required: ['editingFormFields'],
};