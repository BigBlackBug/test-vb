// Vendor
import PropTypes from 'prop-types';

import * as styles from './EditorControlPanelHeaderButtonRow.css';

/**
 * Simple component provides consistent styling for the row of buttons at the top of a control
 * panel's header
 */
const HeaderButtonRow = ({
    children,
    ...props
}) => ( <
    div className = {
        styles.HeaderButtonRow
    } { ...props
    } > {
        children
    } <
    /div>
);
HeaderButtonRow.propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
};

export default HeaderButtonRow;