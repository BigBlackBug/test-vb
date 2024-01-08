/* eslint-disable no-underscore-dangle */
import {
    Filter,
    Point3D,
    ObservablePoint3D
} from 'pixi.js';
// import fragment from './MotionBlur3DFilter.frag';

const fragment = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec3 uVelocity;
uniform float uAngle;
uniform vec3 uCenter;
uniform int uKernelSize;
uniform float uShutterPhase;

uniform highp vec4 inputSize;
uniform highp vec4 inputClamp;

const int MAX_KERNEL_SIZE = 32;

/**
 * MotionBlur3D Fragment shader
 *
 * This shader performs 2 main actions:
 *  - A 3 dimensional blur: controlled by the uniform, uVelocity
 *  - A rotational blur: controlled by the uniform, uAngle.
 *
 *  The perspective of the dimensional blur and the origin of the rotation are controlled by the uniform, uCenter.
 *
 *  Additional uniforms:
 *  - uKernelSize: The number of passes of the blur, higher number = higher quality, but also lower performance
 *  - uShutterPhase: The the amount of lag the shutter has when capturing a frame. 0 is perfect, -1 is 1 frame behind
 *
 */


// author: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
highp float rand(vec2 co, float seed) {
    const highp float a = 12.9898, b = 78.233, c = 43758.5453;
    highp float dt = dot(co + seed, vec2(a, b)), sn = mod(dt, 3.14159);
    return fract(sin(sn) * c + seed);
}

// Notice:
// the perfect way:
//    int kernelSize = min(uKernelSize, MAX_KERNELSIZE);
// BUT in real use-case , uKernelSize < MAX_KERNELSIZE almost always.
// So use uKernelSize directly.

void main(void)
{

    vec4 color = texture2D(uSampler, vTextureCoord);

    if (uKernelSize == 0)
    {
        gl_FragColor = color;
        return;
    }

    int k = uKernelSize - 1;

    // Randomize the lookup values to hide the fixed number of samples
    float offset = rand(vTextureCoord, 0.0);

    // Convert the center into a 0->1 based coordinate system
    vec2 center = uCenter.xy / inputSize.xy;


    // Convert the velocity into a 0->1 based coordinate system
    vec2 velocityXY = uVelocity.xy / inputSize.xy;

    // Get our directional vector by adding the velocity vector to a z-directional vector that has been flattened to 2D
    vec2 dir = vec2(center - vTextureCoord) * (uVelocity.z / inputSize.xy) + velocityXY;

    // Based on the shutter phase, see how much forward and backward we need to draw the blur
    vec2 dirForward = dir * (1.0 + uShutterPhase);
    float angleForward = uAngle * (1.0 + uShutterPhase);
    vec2 dirBackward = dir * uShutterPhase;
    float angleBackward = uAngle * uShutterPhase;

    for(int i = 0; i < MAX_KERNEL_SIZE - 1; i++) {
        if (i == k) {
            break;
        }

        // The offset adds the noise to the blur
        float percent = (float(i) + offset) / float(uKernelSize);

        // Capture our current coordinates for both the forward and backward blur
        vec2 coordForward = vTextureCoord;
        vec2 coordBackward = vTextureCoord;

        // Apply the positional velocity to the coordinates
        coordForward += dirForward * percent;
        coordBackward += dirBackward * percent;

        // Radial blur
        float radianStepForward = angleForward * percent;
        float radianStepBackward = angleBackward * percent;
        float sForward = sin(radianStepForward);
        float sBackward = sin(radianStepBackward);
        float cForward = cos(radianStepForward);
        float cBackward = cos(radianStepBackward);
        mat2 rotationMatrixForward = mat2(vec2(cForward, -sForward), vec2(sForward, cForward));
        mat2 rotationMatrixBackward = mat2(vec2(cBackward, -sBackward), vec2(sBackward, cBackward));

        // Remove the center offset,
        coordForward -= center;
        coordBackward -= center;

        // rotate
        coordForward *= rotationMatrixForward;
        coordBackward *= rotationMatrixBackward;

        // reapply the rotation
        coordForward += center;
        coordBackward += center;

        // Constrain the coordinantes by the edges of the input
        vec4 sampleForward = texture2D(uSampler, clamp(coordForward, inputClamp.xy, inputClamp.zw));
        vec4 sampleBackward = texture2D(uSampler, clamp(coordBackward, inputClamp.xy, inputClamp.zw));

        // Constrain the weight of the sample based on how much of the overall blur is controlled by a forward or backwards directional
        // Ex: with a -.25 shutterPhase, the backward sample is weighted at 25% of the overall color while the forward is 75%
        color += sampleForward * (1.0 - abs(uShutterPhase));
        color += sampleBackward * abs(uShutterPhase);
    }
    gl_FragColor = color / float(uKernelSize);
}
`;
/**
 * The MotionBlur3DFilter applies a Motion blur to an object in 3 Dimensions.
 *
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 * @see {@link https://www.npmjs.com/package/pixi-filters|pixi-filters}
 * @param {PIXI.ObservablePoint|PIXI.Point|number[]} [velocity=[0, 0]] Sets the velocity of the motion for blur effect.
 * @param {number} [angle=0] Sets the angle of rotation (in radians) of the object for blur effect.
 * @param {PIXI.ObservablePoint|PIXI.Point|number[]} [center=[0, 0]] Sets the center of the motion for blur effect.
 * @param {number} [kernelSize=5] - The kernelSize of the blur filter. Must be odd number >= 5
 * @param {number} [shutterPhase=-.25]
 * The the amount of lag the shutter has when capturing a frame. 0 is perfect, -1 is 1 frame behind
 *
 */
export default class MotionBlur3DFilter extends Filter {
    constructor(
        velocity = [0, 0, 0],
        angle = 0,
        center = [0, 0, 0],
        kernelSize = 5,
        shutterPhase = -0.25,
    ) {
        // undefined will use the default vertex shader
        super(undefined, fragment);
        this.uniforms.uVelocity = new Float32Array(3);
        this.uniforms.uCenter = new Float32Array(3);
        this._velocity = new ObservablePoint3D(this.velocityChanged, this);
        this.velocity = velocity;
        this.angle = angle;

        this._center = new ObservablePoint3D(this.centerChanged, this);
        this.center = center;

        this.kernelSize = kernelSize;
        this.shutterPhase = shutterPhase;
    }

    /**
     * Override existing apply method in PIXI.Filter
     * @private
     */
    apply(filterManager, input, output, clear) {
        const {
            x,
            y,
            z
        } = this.velocity;

        this.uniforms.uKernelSize =
            x !== 0 || y !== 0 || z !== 0 || this.angle !== 0 ? this.kernelSize : 0;

        filterManager.applyFilter(this, input, output, clear);
    }

    /**
     * Sets the velocity of the motion for blur effect.
     *
     * @member {PIXI.ObservablePoint}
     */
    set velocity(value) {
        if (Array.isArray(value)) {
            this._velocity.set(value[0], value[1], value[2]);
        } else if (value instanceof Point3D || value instanceof ObservablePoint3D) {
            this._velocity.copyFrom(value);
        }
    }

    get velocity() {
        return this._velocity;
    }

    /**
     * Handle velocity changed
     * @private
     */
    velocityChanged() {
        // The direction in webgl is reverse from what it is in PIXI space
        this.uniforms.uVelocity[0] = -this._velocity.x;
        this.uniforms.uVelocity[1] = -this._velocity.y;
        this.uniforms.uVelocity[2] = this._velocity.z;
    }

    /**
     * Sets the angle in radians of the motion for blur effect.
     *
     * @member {Number}
     * @default 0
     */
    set angle(value) {
        this._angle = value;
        // The angle in webgl is reverse from what it is in PIXI space
        this.uniforms.uAngle = -value;
    }
    get angle() {
        return this._angle;
    }

    /**
     * Center of the effect.
     *
     * @member {PIXI.Point3D|number[]}
     * @default [0, 0, 0]
     */
    get center() {
        return this._center;
    }
    set center(value) {
        if (Array.isArray(value)) {
            this._center.set(value[0], value[1], value[2]);
        } else if (value instanceof Point3D || value instanceof ObservablePoint3D) {
            this._center.copyFrom(value);
        }
    }

    /**
     * Handle center changed
     * @private
     */
    centerChanged() {
        this.uniforms.uCenter[0] = this._center.x;
        this.uniforms.uCenter[1] = this._center.y;
        this.uniforms.uCenter[2] = this._center.z;
    }

    /**
     * Sets the shutter phase for the blur effect.
     *
     * @member {Number}
     * @default -.25
     */
    set shutterPhase(value) {
        this._shutterPhase = value;
        this.uniforms.uShutterPhase = value;
    }
    get shutterPhase() {
        return this._shutterPhase;
    }
}