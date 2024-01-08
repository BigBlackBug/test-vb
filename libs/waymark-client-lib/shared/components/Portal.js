import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

/**
 * Renders a child component that defaults to the top level (direct child to 'body').
 * Useful for modals and overlays that need to exist out of the direct
 * DOM Tree of its instantiating component.
 * Uses a React Portal, see https://reactjs.org/docs/portals.html
 * @param {node} children Portal children to render
 */
const Portal = ({
    container,
    children
}) => ReactDOM.createPortal(children, container);

Portal.propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
    // Native DOM element expected here, which doesn't match PropTypes.node or PropTypes.element
    container: PropTypes.instanceOf(Element),
};

Portal.defaultProps = {
    container: document.body,
};

export default Portal;