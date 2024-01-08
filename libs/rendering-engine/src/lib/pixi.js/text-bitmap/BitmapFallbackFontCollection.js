/* eslint-disable no-param-reassign */
import _ from 'lodash';
import {
    Loader
} from 'pixi.js';
import settings from '../../../settings.js';

/**
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableBitmapFallbackFontCollection(pixiNamespace) {
    /**
     * A simple store of all of the fallback font collections
     * FallbackFontCollections: {
     *  // Weight
     *  "400": {
     *     // Style
     *     "italic": BitmapFallbackFontCollection,
     *     "normal": BitmapFallbackFontCollection
     *   }
     * }
     */
    const FallbackFontCollections = {};

    /**
     * Searches a collection for the closest numeric key to the one requested
     * ex: {'10': 'foo', '20': 'bar', '30': 'baz}
     *
     * @param {object} collection Collection of numeric Key:Value pairs to search
     * @param {number} requestedKey The requested numeric key
     * @returns {*} The found key
     */
    const getClosestValue = (collection, requestedKey) => {
        const availableKeys = Object.keys(collection);
        const closestValue =
            availableKeys.find((key) => Number(key) >= requestedKey) ||
            availableKeys[availableKeys.length - 1];
        return collection[closestValue];
    };

    /**
     * @class BitmapFallbackFontCollection
     *
     * The Fallback Font Collection is a store of all of the fonts that
     * can be used to fallback if a Bitmap font does not contain
     * the necessary characters. It is structured like:
     */
    class BitmapFallbackFontCollection {
        constructor(fallbackFontsData, characterRanges, ligatures) {
            this.fallbackFontsData = fallbackFontsData;
            this.fallbackFonts = [];
            this.fallbackFontLoadingPromises = {};
            this.characterRanges = characterRanges;
            this.characterRanges = characterRanges;
            this.ligatures = ligatures;
            this.sortedLigatures = Object.keys(this.ligatures).sort((a, b) => b.length - a.length);
        }

        /**
         * Remove all fonts
         *
         * @static
         */
        static uninstallAll() {
            Object.keys(FallbackFontCollections).forEach((key) => {
                delete FallbackFontCollections[key];
            });
        }

        /**
         * Final fallback font collection for this font
         *
         * @returns {pixiNamespace.FontCollection} Font collection
         */
        // eslint-disable-next-line class-methods-use-this
        get fallbackFontCollection() {
            return pixiNamespace.getFallbackFontCollection();
        }

        /**
         * Break the text up into sequences based on if the font supports the sequence.
         * Returns array of sequences and if this fallback font that can be used to prepare/load fonts
         *
         * Ex: Input = "Asd æ😃"
         *     Returns [
         *      // Sequence is available at font index 0
         *      ['Asd ', 0],
         *      // Sequence (ligature) is available at font index 10
         *      ['æ', 10],
         *      // Sequence is not available on this fallback font
         *      ['😃', undefined]
         *     ]
         *
         * @param {string} text text to find sequences
         * @returns {Array[]} array of sequence tuples
         */
        getTextSequences(text) {
            let currentText = text;
            const textSequences = [...text];

            // Replace ligatures
            this.sortedLigatures.forEach((ligature) => {
                const ligatureIndex = currentText.indexOf(ligature);
                if (ligatureIndex >= 0) {
                    // Replace the text that represent the ligature
                    textSequences.splice(ligatureIndex, ligature.length, [
                        ligature,
                        this.ligatures[ligature],
                    ]);
                    // Remove the ligature from the sequence so we don't have issues with overlapping ligatures
                    currentText = currentText.replaceAll(ligature, '');
                }
            });

            const sequences = [];
            let currentSequence = '';
            let currentFontIndex;
            textSequences.forEach((sequence) => {
                let fontIndex;
                let character;
                // Handle the cases where we have replaced the ligature already
                if (_.isString(sequence)) {
                    character = sequence;
                    fontIndex = this.getFontIndexForCharacter(character);
                } else {
                    character = sequence[0];
                    fontIndex = sequence[1];
                }
                // Character not found, break it
                if (_.isUndefined(fontIndex) && fontIndex !== currentFontIndex) {
                    if (currentSequence) {
                        sequences.push([currentSequence, currentFontIndex]);
                    }
                    currentFontIndex = fontIndex;
                    // reset the sequence
                    currentSequence = '';
                    // Back to found characters, break it
                } else if (!_.isUndefined(fontIndex) && fontIndex !== currentFontIndex) {
                    if (currentSequence) {
                        sequences.push([currentSequence, currentFontIndex]);
                    }
                    currentFontIndex = fontIndex;
                    // reset the sequence
                    currentSequence = '';
                }
                currentSequence += character;
            });
            sequences.push([currentSequence, currentFontIndex]);

            return sequences;
        }

        /**
         * Prepares a BitmapFont for the string and size.
         * Used inside the "prepare" step of text rendering
         *
         * @public
         * @param {string} text A string to seach the collection for
         * @param {number} size The requested size of character
         * @param {boolean} shouldFallback If we should attempt to fallback again
         * @returns {Promise} promise to resolve on completion of prep for string
         */
        async prepareFontForString(text, size, shouldFallback = true) {
            const sequences = this.getTextSequences(text);

            const fallbackLoader = pixiNamespace.LoaderPool.getLoader();

            const prepareFontPromises = Promise.allSettled(
                sequences.map(async ([sequence, fontIndex]) => {
                    // If we still have missing characters, use the final fallback font collection
                    if (_.isUndefined(fontIndex)) {
                        if (!shouldFallback) {
                            return;
                        }
                        await this.fallbackFontCollection.prepareFontForString(sequence, size, false);
                    } else {
                        const bitmapFont = await this.prepareFallbackFontAtIndex(
                            fontIndex,
                            size,
                            fallbackLoader,
                        );
                        await bitmapFont.prepareFontForString(sequence, false);
                    }
                }),
            );

            // Start loading all of the prepared fallback font resources
            await new Promise((resolve) => {
                fallbackLoader.load(resolve);
            });

            // Wait for the fonts to fully finish loading/setting up
            await prepareFontPromises;
        }

        /**
         * Returns an array of charData to loop through for rendering or measuring
         *
         * Used outside of the prepare step
         *
         * @public
         * @param {string} text text to fetch
         * @param {number} requestedSize the font size to get charData for
         * @returns {object[]} an array of charData
         */
        getGlyphsForString(text, requestedSize) {
            const fallbackFontSizes = _.without(
                [...this.fallbackFonts, ...this.fallbackFontCollection.fallbackFonts],
                undefined,
            );

            // The fallbackFont object is an object consisting of sizes keys pointing towards BitmapFont values
            const orderedFallbackFonts = fallbackFontSizes.map((fontSizes) => {
                const availableSizes = Object.keys(fontSizes);
                const bestSize =
                    availableSizes.find((size) => Number(size) >= requestedSize) ||
                    availableSizes[availableSizes.length - 1];
                // Return the selected font size
                return fontSizes[bestSize];
            });

            if (orderedFallbackFonts.length) {
                return orderedFallbackFonts[0].getGlyphsForString(text, requestedSize, [
                    ..._.tail(orderedFallbackFonts),
                ]);
            }
            return [];
        }

        /**
         * An internal function used to fetch the index/priority of fallback fonts for a character
         *
         * @private
         * @param {string} character a character to search the collection for
         * @returns {number} The index/priority of the fallback font
         */
        getFontIndexForCharacter(character) {
            // TODO: Multipart characters? Not in emojis? Emojis will get included as the last fallback font
            const ids = [];
            for (let index = 0; index < character.length; index += 1) {
                ids.push(character.codePointAt(index));
            }

            let fallbackFontIndex;
            const ranges = Object.keys(this.characterRanges);
            // Loop through our ids and see if any are in range
            for (let idIndex = 0; idIndex < ids.length; idIndex += 1) {
                const id = ids[idIndex];
                for (let index = 0; index < ranges.length; index += 1) {
                    const range = ranges[index].split('-');
                    const [lower] = range;
                    let [, upper] = range;
                    if (_.isUndefined(upper)) {
                        upper = lower;
                    }

                    if (id >= Number(lower) && id <= Number(upper)) {
                        fallbackFontIndex = this.characterRanges[ranges[index]];
                        break;
                    }
                }
                if (_.isNumber(fallbackFontIndex)) {
                    break;
                }
            }

            return fallbackFontIndex;
        }

        /**
         * Returns a Bitmap font for the requested priority and size.
         * Used in the "prepare" stage for text rendering.
         *
         * @private
         * @param {number} index The index/priority of the fallback font
         * @param {number} size The size of font to return
         * @param {Loader} loader The resource loader to use to load the fallback font
         * @returns {Promise} Promise that resolves in a pixiNamespace.BitmapFont
         */
        async prepareFallbackFontAtIndex(index, size, loader) {
            // If we've already loaded and cached the fallback font, return that
            const existingLoadedFallbackFont = _.get(this.fallbackFonts, `[${index}]['${size}']`);

            if (existingLoadedFallbackFont) {
                return existingLoadedFallbackFont;
            }

            const loadingPromiseKey = `${index}_${size}`;

            // If there's already a promise is progress for loading the font for
            // the given index/size, just await that promise and return the resolved
            // font if it succeeds
            const fallbackFontLoadingPromise = this.fallbackFontLoadingPromises[loadingPromiseKey];

            if (fallbackFontLoadingPromise) {
                try {
                    const loadedFallbackFont = await fallbackFontLoadingPromise;
                    if (loadedFallbackFont) return loadedFallbackFont;
                } catch (err) {
                    console.error('Failed to load fallback font', err);
                }
            }

            // Promise adds the fallback font to the loader's resources and resolves when the
            // font resource successfully finishes loading.
            // We'll cache this promise in order to avoid duplicate calls if
            // prepareFallbackFontAtIndex gets called again for this same index and size
            this.fallbackFontLoadingPromises[loadingPromiseKey] = new Promise(async (resolve, reject) => {
                const fontData = this.fallbackFontsData[index];
                const fontLocation = getClosestValue(fontData.sizes, size);

                const url = `${settings.WAYMARK_BFS_S3}/${fontLocation}`;

                loader.add({
                    url,
                    crossOrigin: true,
                    onComplete: (completedResource) => {
                        if (!this.fallbackFonts[index]) {
                            this.fallbackFonts[index] = {};
                        }
                        // Store the loaded font in our fallbackFonts cache
                        this.fallbackFonts[index][`${size}`] = completedResource.font;

                        resolve(completedResource.font);
                    },
                    onError: (error) => {
                        reject(error);
                    },
                });
            });

            const loadedFallbackFont = await this.fallbackFontLoadingPromises[loadingPromiseKey];

            // Clean up the cached promise now that we're done with it
            delete this.fallbackFontLoadingPromises[loadingPromiseKey];

            return loadedFallbackFont;
        }
    }

    /**
     * Returns a FallbackFontCollection based on the requested weight and style
     *
     * @param {number} requestedWeight The requested weight
     * @param {boolean} isItalic The requested Style
     * @returns {BitmapFallbackFontCollection} The matching FallbackFontCollection
     */
    const getFallbackFontCollection = (requestedWeight = 400, isItalic = false) => {
        const availableWeights = Object.keys(FallbackFontCollections || {});
        let weight;
        if (availableWeights.includes(requestedWeight)) {
            weight = FallbackFontCollections[requestedWeight];
        } else {
            // Find the closest weight
            const closestWeight = availableWeights.reduce((curr, value) =>
                Math.abs(requestedWeight - value) < Math.abs(requestedWeight - curr) ? value : curr,
            );

            weight = FallbackFontCollections[closestWeight];
        }

        let fonts;
        if ((isItalic && weight.italic) || (!isItalic && !weight.normal)) {
            fonts = weight.italic;
        } else {
            fonts = weight.normal;
        }
        return fonts;
    };

    pixiNamespace.BitmapFallbackFontCollection = BitmapFallbackFontCollection;
    pixiNamespace.FallbackFontCollections = FallbackFontCollections;
    pixiNamespace.getFallbackFontCollection = getFallbackFontCollection;
}