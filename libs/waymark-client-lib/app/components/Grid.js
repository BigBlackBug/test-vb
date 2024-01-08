// Vendor
import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {
    Grid
} from 'react-flexbox-grid';

// Local
import * as styles from './Grid.css';

/**
 * Returns a react-flexbox-grid with modified padding for each breakpoints,
 * for use when constructing page layouts. This <Grid> ensures 120px gutter padding
 * on >=sm screens.
 */
const PageGrid = ({
    className = '',
    ...extendedProps
}) => ( <
    Grid className = {
        classNames(styles.Grid, className)
    } { ...extendedProps
    }
    />
);

PageGrid.propTypes = {
    className: PropTypes.string,
};

export default PageGrid;