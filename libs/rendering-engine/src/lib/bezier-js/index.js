import enableBezierUtilities from './Bezier.js';
import enablePolyBezierUtilities from './PolyBezier.js';

export default function enableBezierJSUtilities(bezierJSNamespace) {
    enableBezierUtilities(bezierJSNamespace);
    enablePolyBezierUtilities(bezierJSNamespace);
}