/* eslint-disable jsdoc/require-returns */
/* eslint-disable no-bitwise */
/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle, no-plusplus, no-continue */
import {
    textMixins,
    modifyUpdateText
} from '../textMixins.js';
import _ from 'lodash';

/**
 * @param {object} pixiNamespace The namespace we will be editing here
 */
export default function enableBitmapText(pixiNamespace) {
    /**
     * A BitmapText object will create a line or multiple lines of text using bitmap font.
     *
     *
     * The primary advantage of this class over Text is that all of your textures are pre-generated and loading,
     * meaning that rendering is fast, and changing text has no performance implications.
     *
     * The primary disadvantage is that you need to preload the bitmap font assets, and thus the styling is set in stone.
     * Supporting character sets other than latin, such as CJK languages, may be impractical due to the number of characters.
     *
     * To split a line you can use '\n', '\r' or '\r\n' in your string.
     *
     * You can generate the fnt files using
     * http://www.angelcode.com/products/bmfont/ for Windows or
     * http://www.bmglyph.com/ for Mac.
     *
     * A BitmapText can only be created when the font is loaded.
     *
     * ```js
     * // in this case the font is in a file called 'desyrel.fnt'
     * let bitmapText = new PIXI.BitmapText("text using a fancy font!", {font: "35px Desyrel", align: "right"});
     * ```
     *
     *
     * NOTE: The Waymark version of BitmapText has one major change: the use of the TextStyle object
     *       The PIXI implementation doesn't use a dedicated style object, and instead hangs off of the _font and _style
     *       properties for information about the font that is being rendered. A lot of our current logic revolves around
     *       TextStyle, so we definitely have to make a decision about what areas we want to keep and what we want to create ourselves.
     *
     * @class
     * @augments PIXI.Container
     * @memberof PIXI
     */
    // eslint-disable-next-line import/prefer-default-export
    class WMBitmapText extends pixiNamespace.Container {
        /**
         * @param {pixiNamespace.BitmapFont} font The bitmap font for the text
         * @param {string} text - A string that you would like the text to display.
         * @param {pixiNamespace.TextStyle} style - A PIXI TextStyle object.
         */
        constructor(font, text, style) {
            super();

            this._latestScale = null;
            this._latestLinkedParentScale = null;

            this._latestLineHeight = null;

            /**
             * Private tracker for the width of the overall text
             *
             * @member {number}
             * @private
             */
            this._textWidth = 0;

            /**
             * Private tracker for the height of the overall text
             *
             * @member {number}
             * @private
             */
            this._textHeight = 0;

            /**
             * Private tracker for the letter sprite pool.
             *
             * @member {pixiNamespace.Sprite[]}
             * @private
             */
            this._characterSprites = [];

            /**
             * Private tracker for the current font.
             *
             * @member {object}
             * @private
             */
            this._font = font;
            if (!this._font) {
                throw Error('You must specify a font');
            }

            /**
             * Private tracker for the current style.
             *
             * @member {pixiNamespace.TextStyle}
             * @private
             */
            this._style = style || new pixiNamespace.TextStyle();

            /**
             * Private tracker for the current text.
             *
             * @member {string}
             * @private
             */
            this._text = text;

            /**
             * The max width of this bitmap text in pixels. If the text provided is longer than the
             * value provided, line breaks will be automatically inserted in the last whitespace.
             * Disable by setting value to 0
             *
             * NOTE: This is a BitmapText property that could be in TextStyle
             *
             * @member {number}
             * @private
             */
            this._maxWidth = 0;

            /**
             * The max line height. This is useful when trying to use the total height of the Text,
             * ie: when trying to vertically align.
             *
             * NOTE: This is a BitmapText property that could be in TextStyle
             *
             * @member {number}
             * @private
             */
            this._maxLineHeight = 0;

            /**
             * Letter spacing. This is useful for setting the space between characters.
             *
             * @member {number}
             *
             * NOTE: This is a BitmapText property that could be in TextStyle
             */
            this._letterSpacing = 0;

            /**
             * Text anchor. read-only
             *
             * @member {pixiNamespace.PIXI.ObservablePoint}
             * @private
             */
            this._anchor = new pixiNamespace.ObservablePoint(
                () => {
                    this.dirty = true;
                },
                this,
                0,
                0,
            );

            /**
             * Anchor Point Grouping
             */

            this._anchorPointGrouping = WMBitmapText.AnchorPointGrouping.character;

            /**
             * Text Grouping Alignment.
             *
             * @member {pixiNamespace.PIXI.ObservablePoint}
             * @private
             */
            this._anchorPointGroupingAlignment = new pixiNamespace.ObservablePoint(
                () => {
                    this.dirty = true;
                },
                this,
                0,
                0,
            );

            /**
             * The dirty state of this object.
             *
             * @member {boolean}
             */
            this.dirty = false;

            /**
             * If true PixiJS will Math.floor() x/y values when rendering, stopping pixel interpolation.
             * Advantages can include sharper image quality (like text) and faster rendering on canvas.
             * The main disadvantage is movement of objects may appear less smooth.
             * To set the global default, change {@link PIXI.settings.ROUND_PIXELS}
             *
             * @member {boolean}
             * @default false
             */
            this.roundPixels = pixiNamespace.settings.ROUND_PIXELS;
        }

        updateGlyphAnchors() {
            // apply anchor
            for (let i = 0; i < this._characterSprites.length; i++) {
                this._characterSprites[i].x -= this._textWidth * this._anchor.x;
                this._characterSprites[i].y -= this._textHeight * this._anchor.y;
            }
        }

        async prepareText(text) {
            await this._font.prepareFontForString(text);
        }

        /**
         * Renders text and updates it when needed
         *
         * NOTE: This is the core functionality of BitmapText, it's probably could use some breaking up into separate
         * methods. We have modified it somewhat to use the TextStyle object, but it still will need additional modification
         * to support text resizing and other text box features.
         *
         * @private
         */
        updateText() {
            // First we measure the text
            // NOTE: A lot of things that happen immediately after this may be able to happen within measureText or vice versa. The API
            // extraction is very very leaky.
            const measured = pixiNamespace.BitmapTextMetrics.measureText(
                this._text || ' ',
                this._font,
                this._style,
                this._style.wordWrap,
            );

            // Given the font, the wrapping/resizing rules from the text style, and the string
            // we now know a lot of properties of this block of text
            this.lines = measured.lines;
            const {
                fontProperties,
                lineHeight,
                lineWidths,
                maxLineWidth,
                maxLineHeight,
                textBounds
            } =
            measured;

            // Clear out existing character sprites sprites
            this.removeChildren().forEach((child) => child.destroy({
                children: true
            }));

            this._characterSprites = [];

            // Cache the height and width measurements for use in accessors
            this._textWidth = textBounds.width;
            this._textHeight = textBounds.height;

            // Now we're going to collect a bunch of information about the characters in the text box

            // An array of lines, each of which is an array of "glyphs"; e.g.
            // character information provided by the typeface(s) (either the actual font or the fallback font)
            const glyphsByLine = this.lines.map((line) =>
                this._font.getGlyphsForString(line, this._style.fontSize),
            );

            // Counting the total characters, words, etc. (Used by text animators)
            const totalCharacters = glyphsByLine.reduce((prev, line) => prev + line.length, 0);
            const totalCharactersExcludingSpaces = glyphsByLine.reduce(
                (prev, line) => prev + line.filter(({
                    isSpace
                }) => !isSpace).length,
                0,
            );
            const totalWords = glyphsByLine.reduce((prev, line) => {
                let wordsInLine = 0;
                let isPrevCharacterSpace = true;
                for (let index = 0; index < line.length; index++) {
                    const {
                        isSpace
                    } = line[index];
                    if (!isSpace && isPrevCharacterSpace) {
                        wordsInLine += 1;
                    }
                    isPrevCharacterSpace = isSpace;
                }
                return prev + wordsInLine;
            }, 0);

            // Now, we're going to loop through each line of text and
            // - Create a sprite for every character with the proper positioning
            // - Collect information about each character like its word, line, etc. for character animators
            let currentWordIndex = -1;
            // eslint-disable-next-line no-restricted-syntax
            for (const [lineIndex, lineGlyphs] of glyphsByLine.entries()) {
                // Used to keep track of words
                let isPrevCharacterSpace = true;

                let alignOffset = 0;
                if (this._style.align === 'right') {
                    alignOffset = maxLineWidth - lineWidths[lineIndex];
                } else if (this._style.align === 'center') {
                    alignOffset = (maxLineWidth - lineWidths[lineIndex]) / 2;
                }

                // This point is used to help calculate the position of the sprite
                const pos = new pixiNamespace.Point();
                pos.x = 0;
                pos.y = lineIndex * lineHeight + fontProperties.ascent;

                let prevGlyph = null;
                for (let index = 0; index < lineGlyphs.length; index += 1) {
                    const {
                        string,
                        height,
                        kerning,
                        texture,
                        width,
                        xAdvance,
                        xOffset,
                        yOffset,
                        isImageFont,
                        isMark,
                        isBaseForm,
                        isSpace,
                        indicPositionalCategory,
                    } = lineGlyphs[index];

                    // If there's a kerning pair add the kerning amount
                    if (prevGlyph && kerning[prevGlyph.codePoints[prevGlyph.codePoints.length - 1]]) {
                        pos.x += kerning[prevGlyph.codePoints[prevGlyph.codePoints.length - 1]];
                    }

                    let positionX = pos.x + xOffset;

                    // The right and bottom positioned glyphs are measured off of the completed width of the last glyph
                    if (['bottom', 'right'].includes(indicPositionalCategory) && prevGlyph) {
                        positionX -= this.letterSpacing;
                        // Non-baseform marks come after the character they are modifying, so remove the previous letterspacing
                    } else if (isMark && !isBaseForm) {
                        positionX -= this.letterSpacing;
                    }

                    const charSprite = new pixiNamespace.Sprite();

                    charSprite.roundPixels = this.roundPixels;
                    // Only tint characters intended to be tinted
                    if (!isImageFont) {
                        charSprite.tint = this.tint;
                    }
                    try {
                        charSprite.texture = texture || pixiNamespace.Texture.EMPTY;
                    } catch (e) {
                        console.error(e);
                    }

                    this._characterSprites.push(charSprite);
                    this.addChild(charSprite);

                    // Setting width/height sets the scale
                    // We don't set 0 because for some reason `charSprite.width = 0` results in `Number.isNaN(charSprite.width) === true`
                    if (width !== 0) {
                        charSprite.width = width;
                    }

                    if (height !== 0) {
                        charSprite.height = height;
                    }

                    // Add the line's align offset
                    charSprite.position.set(positionX + alignOffset + width / 2, pos.y);

                    // Can't divide by zero, so if height is 0, we just use 0 without any math
                    charSprite.anchor.set(0.5, height ? yOffset / height : 0);

                    // eslint-disable-next-line no-multi-assign
                    charSprite._character = string;
                    charSprite._glyph = lineGlyphs[index];

                    // Update Text Animators here?
                    const currentCharacterIndex = this._characterSprites.length - 1;
                    const currentCharacterIndexExcludingSpaces =
                        this._characterSprites.filter(({
                            isSpace: isGlyphSpace
                        }) => !isGlyphSpace).length - 1;

                    if (!isSpace && isPrevCharacterSpace) {
                        currentWordIndex += 1;
                    }
                    isPrevCharacterSpace = isSpace;

                    charSprite.textAnimatorOptions = {
                        totalCharacters,
                        currentCharacterIndex,
                        totalCharactersExcludingSpaces,
                        currentCharacterIndexExcludingSpaces,
                        totalWords,
                        currentWordIndex: isSpace ? -1 : currentWordIndex,
                        totalLines: this.lines.length,
                        currentLineIndex: lineIndex,
                        baseTransform: charSprite.transform,
                    };

                    // Advance the character positioning
                    pos.x += xAdvance;
                    // Marking baseforms should not add letterspacing, as they are modifying the character after them
                    if (!isMark && isBaseForm) {
                        pos.x += this.letterSpacing;
                    }
                    prevGlyph = lineGlyphs[index];
                }
            }

            this._maxLineHeight = maxLineHeight;

            /**
             * When the text anchor is updated, calculate the anchor property based
             * on adjustments due to the content and styling.
             *
             * Anchor points are exported as pixel values relative to the origin of the object
             * PixiJS instead wants anchor points as unitless values in relation to the object's width and height.
             * ex: [.5, .5] is the origin of the object, [1, 1] is the bottom right.
             */
            this.anchor.set(this.anchorAdjustment.x, this.anchorAdjustment.y);
            this.updateGlyphAnchors();

            // If we don't have any text animators, we're technically done (with an anchor point grouping value of "characters").
            // But, now we're going to account for the "Anchor Point Grouping" property. This potentially doesn't have to be done after all
            // the above measurements are finished. But it's easy to do so because at this point in the code's execution
            // we know the the properties of every character sans-text animators.
            //
            // For every anchor point group property value (all, word, line, character) we will:
            // - Measure every anchor point that is needed by finding the "middle" (or "middle bottom")
            // of the word, line, etc.
            // - Once the anchor point is found, the pivot of every character sprite is modified to point to the anchor point.

            // A helper function that will give you the top-left coordinates of a sprite.
            // eslint-disable-next-line arrow-body-style
            const getTopLeftRect = (spr) => {
                return new pixiNamespace.Rectangle(
                    spr.position.x - spr.anchor.x * spr.width,
                    spr.position.y - spr.anchor.y * spr.height,
                    spr.width,
                    spr.height,
                );
            };

            // "all" means the anchor point for every character sprite is the middle of the text box
            if (this.anchorPointGrouping === WMBitmapText.AnchorPointGrouping.all) {
                if (this._characterSprites.length > 0) {
                    // Find the rectangle that contains every character
                    const textBoxRectangle = pixiNamespace.Rectangle.EMPTY;
                    textBoxRectangle.copyFrom(getTopLeftRect(this._characterSprites[0]));
                    this._characterSprites.forEach((sprite) =>
                        textBoxRectangle.enlarge(getTopLeftRect(sprite)),
                    );

                    // Anchor point is middle-middle
                    const anchorPoint = {
                        x:
                            (textBoxRectangle.x +
                                (textBoxRectangle.width / 2) * (1 + this.anchorPointGroupingAlignment.x)) /
                            this.scale.x,
                        y:
                            (textBoxRectangle.y +
                                (textBoxRectangle.height / 2) * (1 + this.anchorPointGroupingAlignment.y)) /
                            this.scale.y,
                    };

                    // Set the pivot to point to the anchor point and modify the position
                    // to compensate for this pivot change (otherwise, setting the pivot will shift the position of the
                    // sprite, which is currently in the position we desire)
                    // eslint-disable-next-line no-restricted-syntax
                    for (const sprite of this._characterSprites) {
                        const localAnchorPoint = sprite.toLocal(anchorPoint, this);
                        sprite._localAnchorPoint = localAnchorPoint;
                    }
                }
            }
            // "word" means the anchor point for every character sprite is the middle-bottom of the word the character
            // belongs to
            else if (this.anchorPointGrouping === WMBitmapText.AnchorPointGrouping.word) {
                const spritesByWords = Object.values(
                    _.groupBy(
                        this._characterSprites.filter(
                            (sprite) => sprite.textAnimatorOptions.currentWordIndex !== -1,
                        ),
                        (sprite) => sprite.textAnimatorOptions.currentWordIndex,
                    ),
                );
                // Loop over every word
                // eslint-disable-next-line no-restricted-syntax
                for (const sprites of spritesByWords) {
                    if (sprites.length === 0) {
                        continue;
                    }
                    // Create a rectangle calculate the anchor point
                    const startOfWord = sprites[0];
                    const endOfWord = sprites[sprites.length - 1];
                    const wordRectangle = pixiNamespace.Rectangle.EMPTY;
                    wordRectangle.copyFrom(getTopLeftRect(startOfWord));
                    wordRectangle.enlarge(getTopLeftRect(endOfWord));

                    // middle-bottom
                    const baselineY = startOfWord.height * startOfWord.anchor.y;
                    const anchorPoint = {
                        x:
                            (wordRectangle.x +
                                (wordRectangle.width / 2) * (1 + this.anchorPointGroupingAlignment.x)) /
                            this.scale.x,
                        y:
                            (wordRectangle.y + baselineY * (1 + this.anchorPointGroupingAlignment.y)) /
                            this.scale.y,
                    };

                    // Set the pivot to point to the anchor point
                    // eslint-disable-next-line no-restricted-syntax
                    for (const sprite of sprites) {
                        const localAnchorPoint = sprite.toLocal(anchorPoint, this);
                        sprite._localAnchorPoint = localAnchorPoint;
                    }
                }
            }
            // "line" means the anchor point for every character sprite is the middle-bottom of the line the character
            // belongs to
            else if (this.anchorPointGrouping === WMBitmapText.AnchorPointGrouping.line) {
                const spritesByLines = Object.values(
                    _.groupBy(
                        this._characterSprites,
                        (sprite) => sprite.textAnimatorOptions.currentLineIndex,
                    ),
                );

                // eslint-disable-next-line no-restricted-syntax
                for (const sprites of spritesByLines) {
                    if (sprites.length === 0) {
                        continue;
                    }
                    // Create a rectangle for each line and calculate the anchor point
                    const startOfLine = sprites[0];
                    const endOfLine = sprites[sprites.length - 1];

                    const lineRectangle = pixiNamespace.Rectangle.EMPTY;
                    lineRectangle.copyFrom(getTopLeftRect(startOfLine));
                    lineRectangle.enlarge(getTopLeftRect(endOfLine));

                    const baselineY = startOfLine.height * startOfLine.anchor.y;
                    const anchorPoint = {
                        x:
                            (lineRectangle.x +
                                (lineRectangle.width / 2) * (1 + this.anchorPointGroupingAlignment.x)) /
                            this.scale.x,
                        y:
                            (lineRectangle.y + baselineY * (1 + this.anchorPointGroupingAlignment.y)) /
                            this.scale.y,
                    };

                    // eslint-disable-next-line no-restricted-syntax
                    for (const sprite of sprites) {
                        const localAnchorPoint = sprite.toLocal(anchorPoint, this);
                        sprite._localAnchorPoint = localAnchorPoint;
                    }
                }
            } else if (this.anchorPointGrouping === WMBitmapText.AnchorPointGrouping.characters) {
                if (this._characterSprites.length > 0) {
                    // "character" means the anchor point for every character sprite is the middle-bottom of the character
                    // TODO: This "firstCharacter" thing doesn't work if there are no children
                    // eslint-disable-next-line no-restricted-syntax
                    const firstCharacter = this._characterSprites[0];
                    const baselineY = firstCharacter.height * firstCharacter.anchor.y;
                    for (const sprite of this._characterSprites) {
                        sprite._localAnchorPoint = new pixiNamespace.Point(
                            ((sprite.width / 2) * this.anchorPointGroupingAlignment.x) / sprite.scale.x,
                            (baselineY * this.anchorPointGroupingAlignment.y) / sprite.scale.y,
                        );
                    }
                }
            }

            for (const sprite of this._characterSprites) {
                sprite.transform.updateLocalTransform();
                sprite._originalLocalTransform = sprite.transform.localTransform.clone();
                sprite._originalAlpha = sprite.alpha;
            }
        }

        /**
         * Updates the transform of this object
         *
         * @private
         */
        updateTransform() {
            this.validate();
            this.containerUpdateTransform();
        }

        /**
         * Gets the local bounds of the sprite object.
         * Validates text before calling parent's getLocalBounds
         *
         * @param {pixiNamespace.Rectangle} [rect] - The output rectangle.
         * @returns {pixiNamespace.Rectangle} The bounds.
         */
        getLocalBounds(rect) {
            this.validate();

            return super.getLocalBounds.call(this, rect);
        }

        /**
         * Updates text when needed
         *
         * @private
         */
        validate() {
            // If the scale has changed at all, we need to re-calculate the text
            // NOTE: There may be a better way to unify/codify the `this.dirty` logic. Furthermore, this scale only needs to mark
            // as dirty because it's used in the positioning of glyphAnchors. It may be overkill to regenerate *all* the text and
            // not simply re-calculate the glyph positions.
            if (
                this._latestScale === null ||
                !(this.scale.x === this._latestScale.x && this._latestScale.y === this.scale.y)
            ) {
                this._latestScale = this.scale.clone();
                this.dirty = true;
            }

            // Same thing as above, but for the linked parent
            if (
                this.waymarkLinkedParent &&
                (this._latestLinkedParentScale === null ||
                    !(
                        this.waymarkLinkedParent.scale.x === this._latestLinkedParentScale.x &&
                        this._latestLinkedParentScale.y === this.waymarkLinkedParent.scale.y
                    ))
            ) {
                this._latestLinkedParentScale = this.waymarkLinkedParent.scale.clone();
                this.dirty = true;
            }

            if (this._latestLineHeight === null || this.style.lineHeight !== this._latestLineHeight) {
                this._latestLineHeight = this.style.lineHeight;
                this.dirty = true;
            }

            if (this.dirty) {
                this.updateText();
                this.dirty = false;
            }
        }

        /**
         * Renders the object using the WebGL renderer
         *
         * @param {pixiNamespace.Renderer} renderer The Pixi renderer being used for this render
         */
        render(renderer) {
            // if the object is not visible or the alpha is 0 then no need to render this element
            if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
                return;
            }

            // This is potentially inefficent/misplaced (we probably need a better way to tie into the child timelines to
            // update the sprite properties based on the animators). But, for now, we're going to update the text animators
            // during the render loop.
            if (this.animators.length) {
                for (let i = 0, j = this.children.length; i < j; ++i) {
                    const child = this.children[i];
                    if (child.textAnimatorOptions) {
                        this.applyTextAnimators(child, child.textAnimatorOptions);
                    }
                }
            }

            // do a quick check to see if this element has a mask or a filter.
            if (this._mask || (this.filters && this.filters.length)) {
                this.renderAdvanced(renderer);
            } else {
                this._render(renderer);
                // simple render children!
                for (let i = 0, j = this.children.length; i < j; ++i) {
                    this.children[i].render(renderer);
                }
            }
        }

        applyTextAnimators(charSprite, options) {
            // This is a product of bad code organization, but we're going to reset the transform of the
            // character because if we don't, the transform will contain the result of the text animator.
            // _originalLocalTransform contains the local transform of the text before any text animators are applied.
            // on the second run. (e.g. 1st run = character + text animators, 2nd run = character + text animators + text animators)
            if (charSprite._localAnchorPoint === undefined) {
                return;
            }
            charSprite.transform.setFromMatrix(charSprite._originalLocalTransform);
            charSprite.transform.updateLocalTransform();
            charSprite.alpha = charSprite._originalAlpha;

            const charSpriteLocalTransform = charSprite._originalLocalTransform.clone();
            const finalTransform = charSpriteLocalTransform.clone();

            // Shift the pivot, so that the rotation and scaling will occur around _localAnchorPoint
            finalTransform.append(
                pixiNamespace.Matrix.IDENTITY.translate(
                    charSprite._localAnchorPoint.x,
                    charSprite._localAnchorPoint.y,
                ),
            );

            // This will collect all of the animator transforms
            const animatorTransform = new pixiNamespace.Transform();

            // Apply all animators to a transform
            for (let index = 0; index < this.animators.length; index++) {
                const animator = this.animators[index];
                // eslint-disable-next-line no-param-reassign
                animator.apply(charSprite, options, animatorTransform);
            }

            animatorTransform.updateLocalTransform();

            // Final matrix is
            // - Original matrix X
            // - Transitioning the pivot point to the _localAnchorPoint X
            // - All text animator transforms X
            // - Un-transitioning the pivot point now that text animator transforms are applied
            charSprite.transform.setFromMatrix(
                finalTransform
                .append(animatorTransform.localTransform)
                .append(
                    pixiNamespace.Matrix.IDENTITY.translate(-charSprite._localAnchorPoint.x, -charSprite._localAnchorPoint.y, ),
                ),
            );
        }

        /**
         * The way in which anchor points are grouped
         *
         * @member {string}
         */
        get anchorPointGrouping() {
            return this._anchorPointGrouping;
        }

        set anchorPointGrouping(
            value, // eslint-disable-line require-jsdoc
        ) {
            this._anchorPointGrouping = value;
        }

        /**
         * The way in which anchor points are grouped
         *
         * @member {pixiNamespace.ObservablePoint}
         */
        get anchorPointGroupingAlignment() {
            return this._anchorPointGroupingAlignment;
        }

        set anchorPointGroupingAlignment(
            value, // eslint-disable-line require-jsdoc
        ) {
            if (typeof value === 'number') {
                this._anchorPointGroupingAlignment.set(value);
            } else {
                this._anchorPointGroupingAlignment.copyFrom(value);
            }
        }

        /**
         * The tint of the BitmapText object.
         *
         * @member {number}
         */
        get tint() {
            // NOTE: Put this in the TextStyle Object?
            //       Tint needs to be a numeric hex value.
            // this._tint = parseInt(this.style.fill.slice(1), 16);
            this._tint = pixiNamespace.utils.string2hex(this.style.fill);
            this._tintRGB = (this._tint >> 16) + (this._tint & 0xff00) + ((this._tint & 0xff) << 16);
            return this._tint;
        }

        // eslint-disable-next-line class-methods-use-this
        set tint(
            value, // eslint-disable-line require-jsdoc
        ) {
            console.warn('Set tint using "style.fill"');
        }

        /**
         * The alignment of the BitmapText object.
         *
         * @member {string}
         * @default 'left'
         */
        get align() {
            return this.style.align;
        }

        // eslint-disable-next-line class-methods-use-this
        set align(
            value, // eslint-disable-line require-jsdoc
        ) {
            console.warn('Set align using "style.align"');
        }

        /**
         * The anchor sets the origin point of the text.
         *
         * The default is `(0,0)`, this means the text's origin is the top left.
         *
         * Setting the anchor to `(0.5,0.5)` means the text's origin is centered.
         *
         * Setting the anchor to `(1,1)` would mean the text's origin point will be the bottom right corner.
         *
         * @member {pixiNamespace.Point | number}
         */
        get anchor() {
            return this._anchor;
        }
        set anchor(value) {
            if (typeof value === 'number') {
                this._anchor.set(value);
            } else {
                this._anchor.copyFrom(value);
            }
            this.updateGlyphAnchors();
        }

        /**
         * The font descriptor of the BitmapText object.
         *
         * @member {object}
         */
        get font() {
            return this._font;
        }

        set font(
            value, // eslint-disable-line require-jsdoc
        ) {
            if (!value) {
                return;
            }
            this._font = value;
            this.dirty = true;
        }

        /**
         * The text of the BitmapText object.
         *
         * @member {string}
         */
        get text() {
            return this._text;
        }

        set text(
            text, // eslint-disable-line require-jsdoc
        ) {
            // eslint-disable-next-line no-param-reassign
            text = String(text === null || text === undefined ? '' : text);

            if (this._text === text) {
                return;
            }
            this._text = text;
            this.dirty = true;
        }

        /**
         * The max width of this bitmap text in pixels. If the text provided is longer than the
         * value provided, line breaks will be automatically inserted in the last whitespace.
         * Disable by setting the value to 0.
         *
         * NOTE: This is a BitmapText property that could be in TextStyle
         *
         * @member {number}
         */
        get maxWidth() {
            return this._maxWidth;
        }

        set maxWidth(
            value, // eslint-disable-line require-jsdoc
        ) {
            if (this._maxWidth === value) {
                return;
            }
            this._maxWidth = value;
            this.dirty = true;
        }

        /**
         * The max line height. This is useful when trying to use the total height of the Text,
         * i.e. when trying to vertically align.
         *
         * NOTE: This is a BitmapText property that could be in TextStyle
         *
         * @member {number}
         * @readonly
         */
        get maxLineHeight() {
            this.validate();

            return this._maxLineHeight;
        }

        /**
         * The width of the overall text, different from fontSize,
         * which is defined in the style object.
         *
         * @member {number}
         * @readonly
         */
        get textWidth() {
            this.validate();

            return this._textWidth;
        }

        /**
         * Additional space between characters.
         *
         * @member {number}
         */
        get letterSpacing() {
            if (this.style) {
                return this.style.letterSpacing;
            }
            return this._letterSpacing;
        }

        set letterSpacing(
            value, // eslint-disable-line require-jsdoc
        ) {
            if (this._letterSpacing !== value) {
                this._letterSpacing = value;
                this.dirty = true;
            }
        }

        /**
         * The height of the overall text, different from fontSize,
         * which is defined in the style object.
         *
         * @member {number}
         * @readonly
         */
        get textHeight() {
            this.validate();

            return this._textHeight;
        }

        /**
         * Register a bitmap font with data and a texture.
         *
         * @param {object} data The bitmap font data
         * @param {pixiNamespace.Texture[]} textures Textures of font spritesheets
         * @deprecated since 5.3.0
         * @see PIXI.BitmapFont.install
         * @static
         */
        static registerFont(data, textures) {
            pixiNamespace.utils.deprecation(
                '5.3.0',
                'PIXI.WMBitmapText.registerFont is deprecated, use PIXI.BitmapFont.install',
            );

            return pixiNamespace.BitmapFont.install(data, textures);
        }

        /**
         * Get the list of installed fonts.
         *
         * @see pixiNamespace.BitmapFont.available
         * @deprecated since 5.3.0
         * @static
         * @readonly
         * @member {object.<string, pixiNamespace.BitmapFont>}
         */
        static get fonts() {
            pixiNamespace.utils.deprecation(
                '5.3.0',
                'PIXI.WMBitmapText.fonts is deprecated, use PIXI.BitmapFont.available',
            );

            return pixiNamespace.BitmapFont.available;
        }
    }

    /**
     * @typedef {object} Anchor Point Grouping
     * The selector to determine how text is grouped and animated from a text animator
     * @property {string} [characters='characters']  An individual character
     * @property {string} [word='word']  A whole word
     * @property {string} [line='line']  A whole line
     * @property {string} [all='all']  All of the text
     * @global
     */
    WMBitmapText.AnchorPointGrouping = {
        characters: 'characters',
        word: 'word',
        line: 'line',
        all: 'all',
    };

    WMBitmapText.mixin(textMixins);
    WMBitmapText.mixin({
        /**
         * Set the style of the text. Set up an event listener to listen for changes on the style
         * object and mark the text as dirty.
         *
         * @member {object|pixiNamespace.TextStyle}
         */
        get style() {
            return this._style;
        },
        set style(style) {
            // eslint-disable-next-line no-param-reassign
            style = style || {};
            if (style instanceof pixiNamespace.TextStyle) {
                this._style = style;
            } else {
                this._style = new pixiNamespace.TextStyle(style);
            }
            this.localStyleID = -1;
            this.dirty = true;
        },

        getTextAnchorAdjustment() {
            const {
                width,
                height
            } = this.measureText(this.text, this.renderedTextStyle);
            return this.getAnchorAdjustment(width, height);
        },

        measureText(text, style) {
            return pixiNamespace.BitmapTextMetrics.measureText(text, this.font, style);
        },
    });

    modifyUpdateText(WMBitmapText);
    // eslint-disable-next-line no-param-reassign
    pixiNamespace.WMBitmapText = WMBitmapText;
}