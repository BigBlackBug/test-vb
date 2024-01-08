// eslint-disable jsdoc/*
import _ from 'lodash';
// Importing the browser version explicitly, because the node version has a file import
import unicode from 'unicode-properties/unicode-properties.browser.cjs.js';
import {
    autoDetectFormat
} from './formats/index.js';
import {
    getIndicPositionalCategory,
    IndicPositionalCategories
} from './UnicodeCategories.js';
import settings from '../../../settings.js';
import {
    uuid
} from '../../../utils/index.js';

/**
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableBitmapFont(pixiNamespace) {
    // Internal map of available fonts, by name
    const available = {};

    /**
     * @typedef Glyph
     * @param {number[]} codePoints The unicode codepoints this glyph represents
     * // TODO: string should probably be "strings" so more than one codepoint can be represented as a single glyph
     * @param {string} string The string representation of a glyph
     * @param {number} x The x coordinate on the spritesheet
     * @param {number} y The y coordinate on the spritesheet
     * @param {number} width The width on the spritesheet
     * @param {number} height The height on the spritesheet
     * @param {number} xOffset The horizontal offset the glyph should be rendered at
     * @param {number} yOffset The vertical offset the glyph should be rendered at
     * @param {number} xAdvance How far horizontally the text layout should advance after this character
     * @param {number} padding The padding surrounding the glyph
     * @param {number} page The spritesheet page this appears on
     * @param {pixiNamespace.Texture} texture The texture representation of the glyph
     * @param {boolean} isImageFont If the glyph comes from an image font
     * @param {boolean} isMark If the glyph is a marking character
     * @param {boolean} isBaseForm If the glyph is a base character
     * @param {string|null} indicPositionalCategory What positional category the glyph belongs to
     */

    /**
     * BitmapFont represents a typeface available for use
     * with the BitmapText class. Use the `install` method
     * for adding a font to be used.
     *
     * @class
     * @memberof pixiNamespace
     * @param {pixiNamespace.WMBitmapFontData} data The loaded data about this bitmap font
     * @param {pixiNamespace.Texture[] | object.<string, pixiNamespace.Texture>} textures
     */
    // eslint-disable-next-line import/prefer-default-export
    class BitmapFont {
        constructor(data, textures) {
            this.data = data;
            const {
                info,
                ligatures
            } = data;
            const [page] = data.page;
            const res = pixiNamespace.utils.getResolutionOfUrl(
                page.file,
                pixiNamespace.settings.RESOLUTION,
            );
            this.pagesTextures = {};

            /**
             * The name of the font face.
             *
             * @member {string}
             */
            this.font = info.face;

            /**
             * The size of the font rendered on the spritesheet in pixels.
             *
             * @member {number}
             */
            this.size = info.size;

            /**
             * If the font size is italic or oblique
             *
             * @member {boolean}
             */
            this.isItalic = info.isItalic || false;

            /**
             * The weight or boldness of the font
             *
             * @member {number}
             */
            this.weight = info.weight || 400;

            /**
             * The size of the font from baseline to the tallest ascender
             * Measured against the characters "|ÉqÅ"
             *
             * @member {number}
             */
            this.ascender = info.ascender;

            /**
             * The size of the font from baseline to the lowest descender
             * Recorded as a unitless value and normalized by unitsPerEm
             *
             * @member {number}
             */
            this.descender = info.descender;

            /**
             * The number of units of the ascender/descender per em
             * Typically we will use an "M" as our measurement character to normalize
             * this value for use in font measurement
             *
             * @member {number}
             */
            this.unitsPerEm = info.unitsPerEm;

            /**
             * The padding around each character in the spritesheet.
             *
             * @member {number}
             */
            this.spritesheetPadding = info.spritesheetPadding;

            /**
             * If the font is image-based (ex: emoji)
             *
             * @member {boolean}
             */
            this.isImageFont = info.isImageFont;

            /**
             * An array of all glyphs in the font
             *
             * @member {object[]}
             */
            this.glyphs = [];

            /**
             * Lookup map maps every glyphID to the index of its glyph in the this.glyphs array
             *
             * @member  {object}
             */
            this.glyphIDLookupMap = {};

            /**
             * Lookup map maps every glyph string to the index of its glyph in the this.glyphs array
             *
             * @member  {object}
             */
            this.glyphStringLookupMap = {}

            /**
             * An object of substitutions for normalized unicode sequences
             * The Key is the normalized string, Value is the glyphId of the substitution
             *
             * Ex: un-normalized 'ख़'(length = 1)
             *     normalized    'ख़'(length = 2) -> 'ख' + '़'
             *
             * @member {object}
             */
            this.ligatures = {};
            if (ligatures) {
                Object.keys(ligatures).forEach((ligature) => {
                    // Normalize our ligatures before they're added to the object
                    const normalizedLigature = ligature.normalize();
                    // We only care about ligatures of multiple characters
                    if (normalizedLigature.length <= 1) {
                        return;
                    }
                    this.ligatures[normalizedLigature] = ligatures[ligature];
                });
            }
            this.sortedLigatures = Object.keys(this.ligatures).sort((a, b) => a.length - b.length);

            // Convert the input Texture, Textures or object
            // into a page Texture lookup by "id"
            for (let i = 0; i < data.page.length; i += 1) {
                const {
                    id,
                    file
                } = data.page[i];

                this.pagesTextures[id] = textures instanceof Array ? textures[i] : textures[file];
            }

            // parse letters
            for (let i = 0; i < data.char.length; i += 1) {
                this.prepareGlyphWithGlyphData(data.char[i]);
            }

            // parse kernings
            for (let i = 0; i < data.kerning.length; i += 1) {
                let {
                    first,
                    second,
                    amount
                } = data.kerning[i];

                first /= res;
                second /= res;
                amount /= res;

                const secondGlyph = this.searchGlyphsByGlyphId(second);

                if (secondGlyph) {
                    secondGlyph.kernings[first] = amount;
                }
            }
        }

        /**
         * Fallback font collection for this font
         *
         * @returns {pixiNamespace.FontCollection} Font collection
         */
        get fallbackFontCollection() {
            return pixiNamespace.getFallbackFontCollection(this.weight, this.isItalic);
        }

        /**
         * Remove references to created glyph textures.
         */
        destroy() {
            this.glyphs.forEach((glyph) => {
                if (glyph.texture) {
                    glyph.texture.destroy();
                }
            });
            // Empty out the array of glyphs
            this.glyphs.length = 0;
        }

        /**
         * Fills out our this.glyphs object with information about each glyph in the spritesheet
         *
         * @param {object} glyphData A set of data from the bitmap font manifest for loading the glyph
         */
        prepareGlyphWithGlyphData(glyphData) {
            if (_.isUndefined(glyphData.glyphId)) {
                // A glyph id wasn't added during the spritesheet generation in the BFS, so add an arbitrary one
                // eslint-disable-next-line no-param-reassign
                glyphData.glyphId = uuid();
            }

            // Attempt to get the glyph by ID; if it doesn't exist, we'll create it
            let glyph = this.searchGlyphsByGlyphId(glyphData.glyphId);

            if (!glyph) {
                const {
                    id,
                    glyphId,
                    page,
                    x,
                    y,
                    width = 0,
                    height = 0,
                    xoffset = 0,
                    yoffset = 0,
                    xadvance = 0,
                } = glyphData;

                const resolution = pixiNamespace.utils.getResolutionOfUrl(
                    this.pagesTextures[page],
                    pixiNamespace.settings.RESOLUTION,
                );

                let string;
                let codePoints = [];
                if (id) {
                    string = _.isString(id) ? id : String.fromCharCode(id);
                    codePoints.push(_.isString(id) ? id.codePointAt() : id);
                } else {
                    // look up the glyphId from the text in the ligature table for an idea
                    const ligatureIndex = Object.values(this.ligatures).indexOf(glyphId);
                    if (ligatureIndex >= 0) {
                        string = Object.keys(this.ligatures)[ligatureIndex];
                        codePoints = [...string].map((character) => character.codePointAt());
                    }
                }

                glyph = {
                    glyphId,
                    codePoints,
                    string,
                    x: x / resolution,
                    y: y / resolution,
                    width: width / resolution,
                    height: height / resolution,
                    xOffset: xoffset / resolution,
                    // yOffset: (yoffset / resolution) * (this.isImageFont ? -1 : 1),
                    yOffset: yoffset / resolution,
                    xAdvance: xadvance / resolution,
                    padding: this.spritesheetPadding / resolution,
                    // TODO: Store kerning pairs here too?
                    kerning: {},
                    page,
                    isImageFont: this.isImageFont || false,
                    isMark: codePoints.length ? unicode.isMark(codePoints[0]) : null,
                    isBaseForm: codePoints.length ? unicode.isBaseForm(codePoints[0]) : null,
                    indicPositionalCategory: string ? getIndicPositionalCategory(string) : null,
                    isSpace: string ? unicode.isWhiteSpace(codePoints[0] || string.codePointAt()) : null,
                }
                const newGlyphLength = this.glyphs.push(glyph);

                // Add the glyph to our lookup maps
                const newGlyphIndex = newGlyphLength - 1;
                this.glyphIDLookupMap[glyphId] = newGlyphIndex;
                this.glyphStringLookupMap[string] = newGlyphIndex;
            }

            this.prepareGlyphTexture(glyph);
        }

        /**
         * Normalizes and reorders strings for rendering
         *
         * @private
         * @param {string} string String to process
         * @returns {string[]} reordered and normalized string, chunked into an array.
         */
        // eslint-disable-next-line class-methods-use-this
        getCharacterOrderForString(string) {
            // First, normalize the string
            const normalizedString = string.normalize();
            const characterArray = [...normalizedString];

            const characters = [];
            for (let index = 0; index < characterArray.length; index += 1) {
                const character = characterArray[index];

                // If it is an indic vowel character meant to be positioned before a consonant, flip the order
                // Ideally, we would have access to the Indic_Positional_Category in a regex, but for now reference our store
                // https://util.unicode.org/UnicodeJsps/properties.jsp?a=Indic_Positional_Category#Indic_Positional_Category
                if (IndicPositionalCategories.left.includes(character)) {
                    characters.splice(Math.max(index - 1, 0), 0, character);
                } else {
                    characters.push(character);
                }
            }
            return characters;
        }

        /**
         * Utility function to search for glyphs based on the character itself
         *
         * @param {string} string String to search for
         * @returns {Glyph} The glyph
         */
        searchGlyphsByString(string) {
            const glyphIndex = this.glyphStringLookupMap[string]
            return glyphIndex !== undefined ? this.glyphs[glyphIndex] : null;
        }

        /**
         * Utility function to search for glyphs based on the glyph id
         *
         * @param {number} glyphId Glyph Id to search for
         * @returns {Glyph} The glyph
         */
        searchGlyphsByGlyphId(glyphId) {
            const glyphIndex = this.glyphIDLookupMap[glyphId]
            return glyphIndex !== undefined ? this.glyphs[glyphIndex] : null;
        }

        /**
         * Prepares a texture for a glyph (if not already prepared)
         *
         * @param {Glyph} glyph The glyph to prepare
         */
        prepareGlyphTexture(glyph) {
            // Should this throw some sort of error
            if (!glyph) {
                return;
            }
            const {
                padding,
                x,
                y,
                width,
                height,
                page,
                texture
            } = glyph;

            // Only assign a texture if we have loaded the texture for that page
            // And we don't have one already created
            if (this.pagesTextures[page] && this.pagesTextures[page].frame && !texture) {
                const resolution = pixiNamespace.utils.getResolutionOfUrl(
                    this.pagesTextures[page],
                    pixiNamespace.settings.RESOLUTION,
                );

                let rect;
                if (page !== undefined) {
                    rect = new pixiNamespace.Rectangle(
                        x + this.pagesTextures[page].frame.x / resolution,
                        y + this.pagesTextures[page].frame.y / resolution,
                        width,
                        height,
                    );
                }
                const newTexture = new pixiNamespace.Texture(this.pagesTextures[page].baseTexture, rect);
                // eslint-disable-next-line no-param-reassign
                glyph.texture = newTexture;

                // Update the width/height now that we have the texture loaded
                // eslint-disable-next-line no-param-reassign
                glyph.width = newTexture.frame.width;
                // eslint-disable-next-line no-param-reassign
                glyph.height = newTexture.frame.height;
            }
        }

        /**
         * Returns an array of glyphs to loop through for rendering or measuring
         *
         * Used outside of the prepare step
         *
         * @public
         * @param {string} text text to fetch
         * @param {number} size the font size to get glyphs for
         * @param {pixiNamespace.BitmapFont|pixiNamespace.BitmapFallbackFontCollection[]} fallbackFonts Fonts or collections we should search through for chardata
         * @returns {object[]} an array of glyphs
         */
        getGlyphsForString(text, size, fallbackFonts = [this.fallbackFontCollection]) {
            const sequences = this.getTextSequences(text);

            const glyphs = [];
            let currentSequence;
            sequences.forEach(([sequence, isAvailable]) => {
                const glyphSequences = [...sequence];
                currentSequence = sequence;
                // Get all of the available glyphs off of this font
                if (isAvailable) {
                    // Replace ligatures
                    this.sortedLigatures.forEach((ligature) => {
                        const ligatureIndex = currentSequence.indexOf(ligature);
                        if (ligatureIndex >= 0) {
                            const glyphId = this.ligatures[ligature];

                            // Replace the glyphs that represent the ligature
                            glyphSequences.splice(
                                ligatureIndex,
                                ligature.length,
                                pixiNamespace.BitmapTextMetrics.getGlyphSize(
                                    this.searchGlyphsByGlyphId(glyphId),
                                    this,
                                    size,
                                ),
                            );

                            // Remove the ligature from the sequence so we don't have issues with overlapping ligatures
                            currentSequence = currentSequence.replaceAll(ligature, '');
                        }
                    });

                    // Convert remaining strings into glyphs
                    glyphSequences.forEach((character, index) => {
                        if (_.isString(character)) {
                            glyphSequences.splice(
                                index,
                                1,
                                pixiNamespace.BitmapTextMetrics.getGlyphSize(
                                    this.searchGlyphsByString(character),
                                    this,
                                    size,
                                ),
                            );
                        }
                    });

                    // Cleanup: remove anything not a glyph
                    glyphs.push(...glyphSequences.filter((glyph) => _.isPlainObject(glyph)));
                } else if (fallbackFonts.length) {
                    // Fill in the unavailable sequences from the fallback fonts
                    glyphs.push(
                        ...fallbackFonts[0].getGlyphsForString(currentSequence, size, _.tail(fallbackFonts)),
                    );
                }
            });

            return glyphs;
        }

        /**
         * Break the text up into sequences based on if the font supports the sequence.
         * Returns array of availableSequences and unavailableSequences that can be merged back into a completed string
         *
         * Ex: Input = "This is æ string"
         *     Returns [['This is ', true], ['æ', false], [' string', true]]
         *
         * @param {string} text text to find sequences
         * @returns {Array[]} array of sequence tuples
         */
        getTextSequences(text) {
            const textSplit = this.getCharacterOrderForString(text);

            // Break the text up into sequences based on if the font supports the sequence
            const sequences = [];
            let currentSequence = '';
            let isSequenceAvailable = false;
            textSplit.forEach((character) => {
                const glyph = this.searchGlyphsByString(character);
                // Character not found, break it
                if (!glyph && isSequenceAvailable) {
                    if (currentSequence) {
                        sequences.push([currentSequence, isSequenceAvailable]);
                    }
                    isSequenceAvailable = false;
                    // reset the sequence
                    currentSequence = '';
                    // Back to found characters, break it
                } else if (glyph && !isSequenceAvailable) {
                    if (currentSequence) {
                        sequences.push([currentSequence, isSequenceAvailable]);
                    }
                    isSequenceAvailable = true;
                    // reset the sequence
                    currentSequence = '';
                }
                currentSequence += character;
            });
            sequences.push([currentSequence, isSequenceAvailable]);

            return sequences;
        }

        /**
         * Prepares a font by preloading all of the needed spritesheets and textures.
         * This saves the user having to network request every sheet for a large font.
         *
         * @param {string} text The text that needs to be loaded
         * @param {boolean} shouldFallback If we should attempt to fallback again
         * @returns {Promise} Promise that resolves when all text is loaded
         */
        async prepareFontForString(text, shouldFallback = true) {
            const sequences = this.getTextSequences(text);
            const texturesToLoad = {};
            const ligatureGlyphsToPrepare = [];

            const availableSequences = [];
            const unavailableSequences = [];

            const addPageToQueue = (page) => {
                // Add our texture to the loading queue
                if (!this.pagesTextures[page]) {
                    if (page === undefined) {
                        return;
                    }

                    // Document this as part of the data passed into BitmapFont on creation
                    texturesToLoad[`${settings.WAYMARK_BFS_S3}/${this.data.page[page].file}`] = page;
                }
            };

            sequences.forEach(([sequence, isAvailable]) => {
                if (isAvailable) {
                    availableSequences.push(sequence);

                    // add any ligatures you might find
                    this.sortedLigatures.forEach((ligature) => {
                        if (sequence.includes(ligature)) {
                            const glyphId = this.ligatures[ligature];
                            const glyph = this.searchGlyphsByGlyphId(glyphId);
                            addPageToQueue(glyph.page);
                            ligatureGlyphsToPrepare.push(glyph);
                        }
                    });
                } else {
                    unavailableSequences.push(sequence);
                }
            });

            // TODO: Don't prepare characters that are in a ligature (minor performance boost)
            const availableChars = [...availableSequences.join('')];
            for (let charIndex = 0; charIndex < availableChars.length; charIndex += 1) {
                const character = availableChars[charIndex];
                const glyph = this.searchGlyphsByString(character);
                if (glyph && !glyph.texture) {
                    const {
                        page
                    } = glyph;
                    addPageToQueue(page);
                }
            }

            // Fill in the unavailable sequences from the fallback fonts
            if (shouldFallback) {
                await Promise.all(
                    unavailableSequences.map(async (sequence) =>
                        this.fallbackFontCollection.prepareFontForString(sequence, this.size),
                    ),
                );
            }

            if (Object.keys(texturesToLoad).length) {
                const loader = pixiNamespace.LoaderPool.getLoader();

                Object.keys(texturesToLoad).forEach((url) => {
                    loader.add({
                        url,
                        crossOrigin: true,
                        onComplete: (completedResource) => {
                            const page = texturesToLoad[url];
                            this.pagesTextures[page] = pixiNamespace.Texture.from(completedResource.data);
                        },
                    });
                });

                await new Promise((resolve) => {
                    loader.load(resolve);
                });
            }

            // Prepare the ligatures
            for (let index = 0; index < ligatureGlyphsToPrepare.length; index += 1) {
                this.prepareGlyphTexture(ligatureGlyphsToPrepare[index]);
            }

            for (let charIndex = 0; charIndex < availableChars.length; charIndex += 1) {
                const character = availableChars[charIndex];
                const glyph = this.searchGlyphsByString(character);
                if (!glyph) {
                    // There is no renderable content for this character, so skip it
                    return;
                }
                // Loading the texture should have been handled above already, it just needs to be added to the glyph
                if (!glyph.texture) {
                    this.prepareGlyphTexture(glyph);
                }
            }
        }

        /**
         * Register a new bitmap font.
         *
         * @static
         * @param {XMLDocument|string|pixiNamespace.BitmapFontData} data - The
         *        characters map that could be provided as xml or raw string.
         * @param {object.<string, pixiNamespace.Texture> | pixiNamespace.Texture | pixiNamespace.Texture[]} textures List of textures for each page.
         * @param {string} fontName The name of the font (for retrival and identification purposes)
         * @returns {pixiNamespace.BitmapFont} Result font object with font, size, lineHeight
         *         and char fields.
         */
        static install(data, textures, fontName) {
            let fontData;

            if (data instanceof pixiNamespace.WMBitmapFontData) {
                fontData = data;
            } else {
                const format = autoDetectFormat(data);

                if (!format) {
                    throw new Error('Unrecognized data format for font.');
                }

                fontData = format.parse(data);
            }

            let installedFontName = fontName;
            if (!fontName) {
                // TODO: Make this the actual UUID (and probably get rid of `fontName` as an inpiut input at that point?)
                installedFontName = data.uuid;
            }

            // Don't attempt to reinstall and already installed font
            if (available[installedFontName]) {
                return available[installedFontName];
            }

            // Single texture, convert to list
            if (textures instanceof pixiNamespace.Texture) {
                // eslint-disable-next-line no-param-reassign
                textures = [textures];
            }

            const font = new BitmapFont(fontData, textures);

            available[installedFontName] = font;

            return font;
        }

        /**
         * Remove bitmap font by name.
         *
         * @static
         * @param {string} name Name of the font to remove
         */
        static uninstall(name) {
            const font = available[name];

            if (!font) {
                throw new Error(`No font found named '${name}'`);
            }

            font.destroy();
            delete available[name];
        }

        /**
         * Remove all bitmap fonts
         *
         * @static
         */
        static uninstallAll() {
            Object.keys(available).forEach(BitmapFont.uninstall);
        }

        /**
         * Collection of available fonts.
         *
         * @static
         * @member {object.<string, pixiNamespace.BitmapFont>}
         * @returns {object} Object of available fonts
         */
        static get available() {
            return available;
        }
    }

    // eslint-disable-next-line no-param-reassign
    pixiNamespace.WMBitmapFont = BitmapFont;
}