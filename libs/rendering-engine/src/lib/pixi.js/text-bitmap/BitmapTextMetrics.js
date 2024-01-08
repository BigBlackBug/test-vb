/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

/**
 * @param {object} pixiNamespace The namespace we will be editing here
 */
export default function enableBitmapTextMetrics(pixiNamespace) {
    class BitmapTextMetrics extends pixiNamespace.TextMetrics {
        /**
         * Gets & sets the widths of calculated characters in a cache object
         *
         * NOTE: This method normally uses the context for use in measurement of the font, but
         * we need to use it to un-stringify the font so we get get the text size.
         * This strange workaround is required if we want to use the same wordWrap functionality from
         * TextMetrics.
         *
         * @private
         * @param  {string}                    key            The key
         * @param  {number}                    fontSize       The font size
         * @param  {number}                    letterSpacing  The letter spacing
         * @param  {object}                    cache          The cache
         * @param  {pixiNamespace.BitmapFont}           bitmapFont     The used Bitmap Font
         * @returns {number}                    The from cache.
         */
        static getFromCache(key, fontSize, letterSpacing, cache, bitmapFont) {
            if (cache[key] === undefined) {
                const keySize = pixiNamespace.BitmapTextMetrics.getTextSize(
                    key,
                    bitmapFont,
                    fontSize,
                    letterSpacing,
                );
                // eslint-disable-next-line no-param-reassign
                cache[key] = keySize.width;
            }
            return cache[key];
        }

        /**
         * Gets a scaled version of the glyph based on a passed font size
         *
         * @param {object}  glyph  The glyph to size
         * @param {pixiNamespace.BitmapFont} bitmapFont The bitmap font
         * @param {number}  fontSize   The font size
         * @returns {object}  Scaled version of the glyph object
         */
        static getGlyphSize(glyph, bitmapFont, fontSize) {
            // We don't ever want to modify the orginal glyph
            const scaledGlyph = _.clone(glyph);

            // The scale up/down for the size we are measuring at
            const scale = fontSize / bitmapFont.size;

            // Multiplying the values by this scale will return the size they are rendered on the stage,
            // instead of the rendered size on the spritesheet
            scaledGlyph.width *= scale;
            scaledGlyph.height *= scale;
            scaledGlyph.yOffset *= scale;
            scaledGlyph.xOffset *= scale;
            scaledGlyph.xAdvance *= scale;
            // NOTE: Padding doesn't appear to be used anywhere and can probably be removed
            scaledGlyph.padding *= scale;

            // Update the kerning for the scale
            scaledGlyph.kerning = _.mapValues(glyph.kerning, (kerning) => kerning * scale);

            return scaledGlyph;
        }

        /**
         * Gets the size of a single-lined text string
         *
         * @param      {string}     text           The text
         * @param      {pixiNamespace.BitmapFont} font  The BitmapFont to be measured
         * @param      {number}     fontSize       The font size
         * @param      {number}     letterSpacing  The letter spacing
         * @returns    {pixiNamespace.Rectangle}  The text size.
         */
        static getTextSize(text, font, fontSize, letterSpacing) {
            const textSize = new pixiNamespace.Rectangle();
            let currentX = 0;
            const glyphs = font.getGlyphsForString(text, fontSize);
            let prevGlyph = null;
            for (let index = 0; index < glyphs.length; index += 1) {
                const {
                    height,
                    kerning,
                    width,
                    xAdvance,
                    xOffset,
                    yOffset,
                    isMark,
                    isBaseForm,
                    indicPositionalCategory,
                } = glyphs[index];

                // If there's a kerning pair
                if (prevGlyph && kerning[prevGlyph.codePoints[prevGlyph.codePoints.length - 1]]) {
                    currentX += kerning[prevGlyph.codePoints[prevGlyph.codePoints.length - 1]];
                }

                // Non-baseform marks come after the character they are modifying, so remove the previous letterspacing
                let positionX = currentX + xOffset - (isMark && !isBaseForm ? letterSpacing : 0);

                if (indicPositionalCategory === 'bottom' && prevGlyph) {
                    positionX -= width - xOffset;
                } else if (indicPositionalCategory === 'right' && prevGlyph) {
                    positionX -= width - xOffset;
                }

                const charRect = new pixiNamespace.Rectangle(positionX, -yOffset, width, height);

                // The first letter makes up our first rectangle
                if (!prevGlyph) {
                    textSize.copyFrom(charRect);
                } else {
                    textSize.enlarge(charRect);
                }

                // Advance the character spacing for the next character
                currentX += xAdvance;
                // Marking Baseforms should not add letterspacing, as they are modifying the character after them
                if (!isMark && isBaseForm) {
                    currentX += letterSpacing;
                }
                prevGlyph = glyphs[index];
            }

            return textSize;
        }

        /**
         * Calculates the ascent, descent and fontSize of a given font-style
         *
         * Additional properties not in PIXI originally:
         *  - capHeight
         *  - ascenderHeight
         *  - overshootHeight
         *
         * @static
         * @param {pixiNamespace.BitmapFont} font - The BitmapFont object to measure
         * @param {string} size - The fontsize to return values in
         * @returns {pixiNamespace.IFontMetrics} Font properties object
         */
        static measureFont(font, size) {
            const {
                ascender,
                descender,
                unitsPerEm,
                size: stylesheetFontsize
            } = font;
            const fontSize = size || stylesheetFontsize;

            const scale = fontSize / unitsPerEm;
            const ascent = ascender * scale;
            const descent = Math.abs(descender * scale);

            // The Cap Height is the height of a Capital Letter without ascenders or desenders.
            // We make the assumption that the baseline charater, M, is a good example of this.
            const mGlyph = font.searchGlyphsByString(pixiNamespace.TextMetrics.BASELINE_SYMBOL);
            const {
                height: capHeight
            } = BitmapTextMetrics.getGlyphSize(mGlyph, font, fontSize);

            // The Ascender Height is the height of font from the Cap Height to the tallest ascender
            const ascenderHeight = ascent - capHeight;

            // The overshoot height is the distance a rounded or pointed character (like O, A, l) extends higher (or lower) than a comparably sized "flat" letter (X, H, M).
            const alphaNumericHeight = _.reduce(
                pixiNamespace.TextMetrics.ALPHANUMERIC_STRING,
                (accumulator, currentValue) => {
                    const currentGlyph = font.searchGlyphsByString(currentValue);
                    const charData = BitmapTextMetrics.getGlyphSize(currentGlyph, font, fontSize);
                    if (!charData) {
                        return accumulator;
                    }
                    const {
                        height: characterHeight
                    } = charData;

                    return Math.max(characterHeight, currentValue);
                },
                0,
            );

            const overshootHeight = alphaNumericHeight - capHeight;

            return {
                ascent,
                descent,
                fontSize: ascent + descent,
                capHeight,
                ascenderHeight,
                overshootHeight,
            };
        }

        /**
         * Measures a passed text string and returns a BitmapTextMetrics object with information
         * about the font and the size of the text object.
         *
         * @param      {string}  text    The text
         * @param      {pixiNamespace.BitmapFont}  bitmapFont   The BitmapFont in use
         * @param      {pixiNamespace.TextStyle}  style   The style
         * @param      {boolean}  wordWrap
         * If the text should wrap, defaults to the style's wordWrap property if not available
         * @param {Node} canvas A browser Canvas element (not required)
         * @returns     {pixiNamespace.BitmapTextMetrics} A metrics objec
         */
        // eslint-disable-next-line no-underscore-dangle
        static measureText(
            text,
            bitmapFont,
            style,
            wordWrap,
            canvas = pixiNamespace.BitmapTextMetrics._canvas,
        ) {
            const {
                fontSize
            } = style;

            const fontProperties = BitmapTextMetrics.measureFont(bitmapFont, fontSize);

            // This rectangle is what we will use to track our measurement, by enlarging it with each
            // new line of text
            const textBounds = new pixiNamespace.Rectangle();

            // This is pulled from TextMetics' measureText method
            // eslint-disable-next-line no-param-reassign
            wordWrap = wordWrap === undefined || wordWrap === null ? style.wordWrap : wordWrap;
            const outputText = wordWrap ?
                pixiNamespace.BitmapTextMetrics.wordWrap(text, bitmapFont, style, canvas) :
                text;

            const {
                lineHeight
            } = style;
            let lines = outputText.split(/(?:\r\n|\r|\n)/);
            let lineBounds = [];
            let maxLineHeight = 0;
            lines.forEach((line, index) => {
                const bounds = pixiNamespace.BitmapTextMetrics.getTextSize(
                    line,
                    bitmapFont,
                    fontSize,
                    style.letterSpacing,
                );
                bounds.y += lineHeight * index;

                // The first line makes up our first rectangle
                if (index) {
                    textBounds.enlarge(bounds);
                } else {
                    textBounds.copyFrom(bounds);
                }
                maxLineHeight = Math.max(maxLineHeight, bounds.height);
                lineBounds.push(bounds);
            });

            let boxHeight = null;
            let hasTextOverflowed = false;

            let {
                width,
                height
            } = textBounds;

            if (style.isTextBox) {
                // Remove lines that are outside of the text's word wrap height
                let maxLines = Math.floor(style.wordWrapHeight / lineHeight);
                // The descent of the font isn't counted towards the total height of the text box in
                // After Effects, so if there's additional space left over, add the last line.
                if (lineHeight * maxLines + fontProperties.capHeight <= style.wordWrapHeight) {
                    maxLines += 1;
                }

                // A boolean check if we have lines that are present on the text object that don't get rendered because they
                // will stretch outside the bounds of the text box
                hasTextOverflowed = maxLines < lines.length;
                lines = lines.slice(0, maxLines);
                lineBounds = lineBounds.slice(0, maxLines);

                // Recalculate the bounds
                textBounds.x = 0;
                textBounds.y = 0;
                textBounds.width = 0;
                textBounds.height = 0;
                lineBounds.forEach((bounds, index) => {
                    // The first line makes up our first rectangle
                    if (index) {
                        textBounds.enlarge(bounds);
                    } else {
                        textBounds.copyFrom(bounds);
                    }
                });

                // The height of the text that we care about in the block (We don't care about the accents on the first line, or the descenders on the last line)
                // (In After Effects, the accents and whatnot extend beyond/above the text box. So, we don't use those in positioning calculations.)
                boxHeight =
                    fontProperties.capHeight +
                    fontProperties.overshootHeight +
                    lineHeight * (lines.length - 1);

                width = textBounds.width;
                height = textBounds.height;
            }

            if (style.dropShadow) {
                width += style.dropShadowDistance;
                height += style.dropShadowDistance;
            }

            if (style.strokeThickness) {
                width += style.strokeThickness;
                height += style.strokeThickness;
            }

            const textMetrics = new pixiNamespace.BitmapTextMetrics(
                text,
                style,
                width,
                height,
                lines,
                _.map(lineBounds, 'width'),
                lineHeight + style.leading,
                textBounds.width,
                fontProperties,
                lineBounds,
            );

            // Custom values added to our textMetrics, we should turn these into real class properties
            textMetrics.boxHeight = boxHeight;
            textMetrics.hasTextOverflowed = hasTextOverflowed;
            textMetrics.textBounds = textBounds;
            textMetrics.maxLineHeight = maxLineHeight;

            return textMetrics;
        }

        /**
         * Applies newlines to a string to have it optimally fit into the horizontal
         * bounds set by the Text object's wordWrapWidth property.
         *
         * @private
         * @param {string} text - String to apply word wrapping to
         * @param {pixiNamespace.BitmapFont} bitmapFont - the associated bitmap font
         * @param {pixiNamespace.TextStyle} style - the style to use when wrapping
         * @returns {string} New string with new lines applied where required
         */
        static wordWrap(text, bitmapFont, style) {
            let width = 0;
            let line = '';
            let lines = '';
            const cache = {};

            const {
                letterSpacing,
                whiteSpace,
                fontSize
            } = style;
            // How to handle whitespaces
            const collapseSpaces = pixiNamespace.BitmapTextMetrics.collapseSpaces(whiteSpace);
            const collapseNewlines = pixiNamespace.BitmapTextMetrics.collapseNewlines(whiteSpace);
            // whether or not spaces may be added to the beginning of lines
            let canPrependSpaces = !collapseSpaces;
            // There is letterSpacing after every char except the last one
            // t_h_i_s_' '_i_s_' '_a_n_' '_e_x_a_m_p_l_e_' '_!
            // so for convenience the above needs to be compared to width + 1 extra letterSpace
            // t_h_i_s_' '_i_s_' '_a_n_' '_e_x_a_m_p_l_e_' '_!_
            // ________________________________________________
            // And then the final space is simply no appended to each line
            const wordWrapWidth = style.wordWrapWidth + letterSpacing;
            // break text into words, spaces and newline chars
            const tokens = pixiNamespace.BitmapTextMetrics.tokenize(text);
            for (let i = 0; i < tokens.length; i++) {
                // get the word, space or newlineChar
                let token = tokens[i];
                // if word is a new line
                if (pixiNamespace.BitmapTextMetrics.isNewline(token)) {
                    // keep the new line
                    if (!collapseNewlines) {
                        lines += pixiNamespace.BitmapTextMetrics.addLine(line);
                        canPrependSpaces = !collapseSpaces;
                        line = '';
                        width = 0;
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    // if we should collapse new lines
                    // we simply convert it into a space
                    token = ' ';
                }
                // if we should collapse repeated whitespaces
                if (collapseSpaces) {
                    // check both this and the last tokens for spaces
                    const currIsBreakingSpace = pixiNamespace.BitmapTextMetrics.isBreakingSpace(token);
                    const lastIsBreakingSpace = pixiNamespace.BitmapTextMetrics.isBreakingSpace(
                        line[line.length - 1],
                    );
                    if (currIsBreakingSpace && lastIsBreakingSpace) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                }

                let tokenWidth;
                if (token.length > 1) {
                    // get word width from cache if possible
                    tokenWidth = pixiNamespace.BitmapTextMetrics.getFromCache(
                        token,
                        style.fontSize,
                        letterSpacing,
                        cache,
                        bitmapFont,
                    );
                    // Single Tokens are spaces or single characters, where the width can potentially be misleading, because it doesn't include
                    // the distance we need to advance the cursor before the next character
                } else {
                    const glyph = bitmapFont.searchGlyphsByString(token);
                    if (glyph) {
                        ({
                            xAdvance: tokenWidth
                        } = pixiNamespace.BitmapTextMetrics.getGlyphSize(
                            glyph,
                            bitmapFont,
                            fontSize,
                        ));
                    } else {
                        tokenWidth = 0;
                    }
                }

                // word is longer than desired bounds
                if (tokenWidth > wordWrapWidth) {
                    // if we are not already at the beginning of a line
                    if (line !== '') {
                        // start newlines for overflow words
                        lines += pixiNamespace.BitmapTextMetrics.addLine(line);
                        line = '';
                        width = 0;
                    }
                    // break large word over multiple lines
                    if (pixiNamespace.BitmapTextMetrics.canBreakWords(token, style.breakWords)) {
                        // break word into characters
                        const characters = pixiNamespace.BitmapTextMetrics.wordWrapSplit(token);
                        // loop the characters
                        for (let j = 0; j < characters.length; j++) {
                            let char = characters[j];
                            let k = 1;
                            // we are not at the end of the token
                            while (characters[j + k]) {
                                const nextChar = characters[j + k];
                                const lastChar = char[char.length - 1];
                                // should not split chars
                                if (!pixiNamespace.BitmapTextMetrics.canBreakChars(
                                        lastChar,
                                        nextChar,
                                        token,
                                        j,
                                        style.breakWords,
                                    )) {
                                    // combine chars & move forward one
                                    char += nextChar;
                                } else {
                                    break;
                                }
                                k++;
                            }
                            j += char.length - 1;

                            // TODO: This whole xAdvance vs width song and dance needs to be tightened up/consolidated
                            const characterGlyph = pixiNamespace.BitmapTextMetrics.getGlyphSize(
                                bitmapFont.searchGlyphsByString(char),
                                bitmapFont,
                                style.fontSize,
                            );
                            // If it's a single character, we'll use width, otherwise xAdvance
                            // TODO: In fact, should we also be doing this for the last character?
                            const characterWidth =
                                characters.length > 1 ? characterGlyph.xAdvance : characterGlyph.width;

                            if (characterWidth + width > wordWrapWidth) {
                                lines += pixiNamespace.BitmapTextMetrics.addLine(line);
                                canPrependSpaces = false;
                                line = '';
                                width = 0;
                            }
                            line += char;
                            width += characterWidth;
                        }
                    }
                    // run word out of the bounds
                    else {
                        // if there are words in this line already
                        // finish that line and start a new one
                        if (line.length > 0) {
                            lines += pixiNamespace.BitmapTextMetrics.addLine(line);
                            line = '';
                            width = 0;
                        }
                        const isLastToken = i === tokens.length - 1;
                        // give it its own line if it's not the end
                        lines += pixiNamespace.BitmapTextMetrics.addLine(token, !isLastToken);
                        canPrependSpaces = false;
                        line = '';
                        width = 0;
                    }
                }
                // word could fit
                else {
                    // word won't fit because of existing words
                    // start a new line
                    if (tokenWidth + width > wordWrapWidth) {
                        // if its a space we don't want it
                        canPrependSpaces = false;
                        // add a new line
                        lines += pixiNamespace.BitmapTextMetrics.addLine(line);
                        // start a new line
                        line = '';
                        width = 0;
                    }
                    // don't add spaces to the beginning of lines
                    if (
                        line.length > 0 ||
                        !pixiNamespace.BitmapTextMetrics.isBreakingSpace(token) ||
                        canPrependSpaces
                    ) {
                        // add the word to the current line
                        line += token;
                        // update width counter
                        width += tokenWidth;
                    }
                }
            }
            lines += pixiNamespace.BitmapTextMetrics.addLine(line, false);
            return lines;
        }

        constructor(...args) {
            super(...args);

            /**
             * An array of each of the line's bounds
             *
             * @member {pixiNamespace.Bounds[]}
             */
            // eslint-disable-next-line prefer-destructuring
            this.lineBounds = args[9];
        }
    }

    // eslint-disable-next-line no-param-reassign
    pixiNamespace.BitmapTextMetrics = BitmapTextMetrics;
}