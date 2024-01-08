// We need to pull a WebGL context from a canvas to get the maximum size
const canvas = document.createElement('canvas');
const context = canvas.getContext('webgl');
// The maximum size a texture can be for a WebGL canvas
// If we don't have a context (likely testing in a non-browser environment), use a low default.
export const maxWebGLTextureSize = context ? context.getParameter(context.MAX_TEXTURE_SIZE) : 4096;

// The largest dimension on either side a canvas can be in Chrome
// https://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element#11585939
// We are making the assumption here that the max 2d canvas that we support cannot be larger than the max WebGL texture we can support.
// Given that we frequently use 2d canvases for textures (Text objects in particular), this is a strong limit to enforce.
export const maxCanvasSize = maxWebGLTextureSize;