// Vendor
import PropTypes from 'prop-types';

// Local
import {
    SrcSet
} from 'shared/utils/images';
import flickityOptions from './flickityOptions.js';

/**
 * Describes an instance of a Configurator.
 */
const configurator = PropTypes.object;

/**
 * Override object to pass to the template coordinator for studio previews
 */
const studioPreviewOverrides = PropTypes.shape({
    // eslint-disable-next-line react/forbid-prop-types
    formDescription: PropTypes.object.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    editingActions: PropTypes.object.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    projectManifest: PropTypes.object.isRequired,
});

/**
 * A selectable image within an image chooser.
 */
const selectableImage = PropTypes.shape({
    base_url: PropTypes.string.isRequired,
    image_class: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
});

/**
 * A selectable panel within an image panel list.
 */
const selectablePanel = PropTypes.shape({
    url: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    isLoading: PropTypes.bool,
    number: PropTypes.number,
});

/**
 * A content field info for a video configuration.
 */
const contentFieldInfo = PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    imageType: PropTypes.string,
    label: PropTypes.string,
    contentCharacterLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
    minimumWordCount: PropTypes.number,
    configurationDotPaths: PropTypes.arrayOf(PropTypes.string),
    secondsAfterStart: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
});

/**
 * A content field image for a video configuration.
 */
const contentFieldImage = PropTypes.shape({
    // The width of the image / the height of the image or null (No aspect ratio, typically logos), or a function to return the aspect ratio
    aspectRatio: PropTypes.oneOfType([PropTypes.number, PropTypes.func, PropTypes.instanceOf(null)]),
    configurationDotPaths: PropTypes.arrayOf(PropTypes.string),
    index: PropTypes.number,
    secondsAfterStart: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
    url: PropTypes.string,
});

/**
 * A set of images for img tag at various image sizes
 */
const imageSrcSet = PropTypes.instanceOf(SrcSet);

/**
 * A PropType Validator for a DOM element Inspired by
 * https://stackoverflow.com/questions/39401676/react-proptypes-dom-element
 *
 * @param      {object}      props          The supplied properties
 * @param      {string}      propName       The property name
 * @param      {string}      componentName  The name of the component using this
 *                                          PropType
 * @return     {null|Error}  null (A success) or Error (A validation error)
 */
const domElement = (props, propName, componentName) => {
    if (props[propName] instanceof Element === false) {
        return new Error(
            `Invalid prop ${propName} supplied to ${componentName}, expected a DOM Element`,
        );
    }
    return null;
};

/**
 * Describes children for a react component which can be a single node or an array of nodes
 */
const children = PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]);

export default {
    children,
    configurator,
    contentFieldImage,
    contentFieldInfo,
    domElement,
    flickityOptions,
    imageSrcSet,
    selectableImage,
    selectablePanel,
    studioPreviewOverrides,
};