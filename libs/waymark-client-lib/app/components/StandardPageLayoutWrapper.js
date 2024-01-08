// Vendor
import classNames from 'classnames';
import PropTypes from 'prop-types';

// Local
import Grid from 'app/components/Grid.js';
import WaymarkHeader from 'app/components/WaymarkHeader.js';
import {
    useScrollToTop
} from 'app/hooks/dom.js';
import * as styles from './StandardPageLayoutWrapper.css';

const StandardPageLayoutWrapper = ({
        children,
        className,
        gridClassName,
        headerProps,
        shouldShowHeader,
    }) => {
        // Ensure the page is scrolled to the top when initially rendered
        useScrollToTop();

        return ( <
            main className = {
                classNames(styles.StandardPageLayoutWrapper, className)
            } > {
                shouldShowHeader && < WaymarkHeader { ...headerProps
                }
                />} <
                Grid className = {
                    classNames(styles.GridWrapper, gridClassName)
                } > {
                    children
                } < /Grid> <
                /main>
            );
        };

        StandardPageLayoutWrapper.propTypes = {
            children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
            className: PropTypes.string,
            gridClassName: PropTypes.string,
            headerProps: PropTypes.shape({
                shouldHideProps: PropTypes.bool,
            }),
            shouldShowHeader: PropTypes.bool,
        };

        StandardPageLayoutWrapper.defaultProps = {
            className: '',
            gridClassName: '',
            headerProps: {},
            shouldShowHeader: true,
        };

        export default StandardPageLayoutWrapper;