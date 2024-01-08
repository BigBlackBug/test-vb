// import fragment from './alphaSpriteMaskFilter.frag';
// import vertex from './alphaSpriteMaskFilter.vert';

const fragment = `
varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D mask;
uniform float alpha;
uniform float npmAlpha;
uniform vec4 maskClamp;

void main(void)
{
    float clip = step(3.5,
        step(maskClamp.x, vMaskCoord.x) +
        step(maskClamp.y, vMaskCoord.y) +
        step(vMaskCoord.x, maskClamp.z) +
        step(vMaskCoord.y, maskClamp.w));

    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    // PIXI JS CHANGE: masky.r changed to masky.a to support alpha matte
    original *= (alphaMul * masky.a * alpha * clip);

    gl_FragColor = original;
}
`;

const vertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 otherMatrix;

varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;
}
`;

/* eslint-disable func-names, no-param-reassign */
export default function enableAlphaSpriteMaskFilterProperties(pixiNamespace) {
    /**
     * This classis a direct copy of SpriteMaskFilter, only differentiated by importing a
     * different fragment. This is done to solve an issue with the SpriteMaskFilter
     * only using the red channel to mask out shapes (similar to a luma mask). However,
     * we want to mask things out using just the alpha channel.
     *
     * See this Github Issue for context: https://github.com/pixijs/pixi.js/issues/5624
     *
     * @class      AlphaSpriteMaskFilter (name)
     */
    class AlphaSpriteMaskFilter extends pixiNamespace.Filter {
        constructor(sprite) {
            const maskMatrix = new pixiNamespace.Matrix();

            super(vertex, fragment);

            sprite.renderable = false;

            /**
             * Sprite mask
             * @member {PIXI.Sprite}
             */
            this.maskSprite = sprite;

            /**
             * Mask matrix
             * @member {PIXI.Matrix}
             */
            this.maskMatrix = maskMatrix;
        }

        /**
         * Applies the filter
         *
         * @param {PIXI.systems.FilterSystem} filterManager - The renderer to retrieve the filter from
         * @param {PIXI.RenderTexture} input - The input render target.
         * @param {PIXI.RenderTexture} output - The target to output to.
         * @param {boolean} clear - Should the output be cleared before rendering to it.
         */
        apply(filterManager, input, output, clear) {
            const {
                maskSprite
            } = this;
            const {
                texture
            } = this.maskSprite;

            if (!texture.valid) {
                return;
            }
            if (!texture.transform) {
                // margin = 0.0, let it bleed a bit, shader code becomes easier
                // assuming that atlas textures were made with 1-pixel padding
                texture.transform = new pixiNamespace.TextureMatrix(texture, 0.0);
            }
            texture.transform.update();

            this.uniforms.npmAlpha = texture.baseTexture.alphaMode ? 0.0 : 1.0;
            this.uniforms.mask = texture;
            // get _normalized sprite texture coords_ and convert them to _normalized atlas texture coords_ with `prepend`
            this.uniforms.otherMatrix = filterManager
                .calculateSpriteMatrix(this.maskMatrix, maskSprite)
                .prepend(texture.transform.mapCoord);
            this.uniforms.alpha = maskSprite.worldAlpha;
            this.uniforms.maskClamp = texture.transform.uClampFrame;

            filterManager.applyFilter(this, input, output, clear);
        }
    }

    pixiNamespace.AlphaSpriteMaskFilter = AlphaSpriteMaskFilter;
}