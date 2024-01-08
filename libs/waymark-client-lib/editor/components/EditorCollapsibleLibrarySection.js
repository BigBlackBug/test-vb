// Vendor
import PropTypes from 'prop-types';
import {
    useEffect,
    useState
} from 'react';
import {
    css,
    cx as emotionClassNames
} from '@emotion/css';

// WAYMARK APP DEPENDENCIES
import ToggleCollapseTransition from 'app/components/ToggleCollapseTransition';

// Shared
import {
    ArrowDownIcon
} from 'shared/components/Icons.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';

/**
 *
 * @param {node} children: Contents to display in collapsible section.
 * @param {string} contentsWrapperClassName: Classname applied to toggle transition.
 * @param {string} buttonClassName
 * @param {string} secondaryTextClassName
 * @param {string} primaryText: Section name.
 * @param {string} secondaryText: Optional secondary section name.
 * @param {bool} isInitiallyExpanded: If section should be expanded by default.
 * @param {bool} isExpanded: Controlled prop to manually manage if the section should be expanded.
 * @param {object} typography: Optional typography variant name.
 * @param {function} onToggleSection: Optional callback for when section is expanded.
 */
const EditorCollapsibleLibrarySection = ({
    children,
    contentsWrapperClassName = '',
    buttonClassName = '',
    secondaryTextClassName = '',
    primaryText = '',
    secondaryText = '',
    isInitiallyExpanded = false,
    isExpanded = undefined,
    typography = 'title6',
    onToggleSection = null,
}) => {
    const [isSectionExpanded, setIsSectionExpanded] = useState(isInitiallyExpanded);

    useEffect(() => {
        if (isExpanded !== undefined) {
            setIsSectionExpanded(isExpanded);
        }
    }, [isExpanded]);

    return ( <
        div className = {
            css `
        margin-bottom: 24px;
      `
        } >
        <
        WaymarkButton onClick = {
            () => {
                setIsSectionExpanded(!isSectionExpanded);
                onToggleSection ? .();
            }
        }
        className = {
            emotionClassNames(
                css `
            text-align: left !important;
            display: flex;
            align-items: center;
            margin: 0 0 18px;
            width: 100%;

            &:first-child {
              margin-top: 0;
            }
          `,
                buttonClassName,
            )
        }
        typography = {
            typography
        }
        colorTheme = "BlackText"
        hasFill = {
            false
        }
        isUppercase = {
            false
        } >
        {
            primaryText
        } & nbsp; <
        div className = {
            css `
            display: inline-flex;
            align-items: center;
          `
        } >
        <
        span className = {
            secondaryTextClassName
        } > {
            secondaryText
        } < /span> <
        ArrowDownIcon fieldProps = {
            {
                className: emotionClassNames(
                    css `
                  width: 16px;
                  margin-left: 8px;
                  transition: transform 0.2s ease-in-out;
                `, {
                        [css `
                    transform: rotate(-90deg);
                  `]: !isSectionExpanded,
                    },
                ),
            }
        }
        /> <
        /div> <
        /WaymarkButton> <
        ToggleCollapseTransition isVisible = {
            isSectionExpanded
        }
        contentsWrapperClassName = {
            contentsWrapperClassName
        }
        data - testid = "sectionContents" >
        {
            children
        } <
        /ToggleCollapseTransition> <
        /div>
    );
};

EditorCollapsibleLibrarySection.propTypes = {
    children: sharedPropTypes.children.isRequired,
    contentsWrapperClassName: PropTypes.string,
    buttonClassName: PropTypes.string,
    secondaryTextClassName: PropTypes.string,
    primaryText: PropTypes.string,
    secondaryText: PropTypes.string,
    isInitiallyExpanded: PropTypes.bool,
    typography: PropTypes.string,
    onToggleSection: PropTypes.func,
    isExpanded: PropTypes.bool,
};

export default EditorCollapsibleLibrarySection;