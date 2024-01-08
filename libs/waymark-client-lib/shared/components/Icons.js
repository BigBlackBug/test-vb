import PropTypes from 'prop-types';

const colorIconPropTypes = {
    fieldProps: PropTypes.object,
    color: PropTypes.string,
};

const colorIconDefaultProps = {
    fieldProps: {},
    color: 'currentColor',
};

/** Defines a down arrow icon. */
export const ArrowDownIcon = ({
    fieldProps,
    color
}) => ( <
    svg { ...fieldProps
    }
    version = "1.1"
    viewBox = "0 0 32 32"
    preserveAspectRatio = "none"
    width = "100%"
    xmlns = "http://www.w3.org/2000/svg" >
    <
    title > arrow - down < /title> <
    g id = "01.-Glyphs-/-arrow-down"
    stroke = "none"
    strokeWidth = "1"
    fill = "none"
    fillRule = "evenodd"
    strokeLinecap = "round"
    strokeLinejoin = "round" >
    <
    polyline id = "chevron"
    stroke = {
        color
    }
    strokeWidth = "3"
    transform = "translate(16.250000, 15.500000) scale(-1, 1) rotate(90.000000) translate(-16.250000, -15.500000) "
    points = "10.75 5.25 21.75 15.25 10.75 25.75" /
    >
    <
    /g> <
    /svg>
);

ArrowDownIcon.propTypes = colorIconPropTypes;
ArrowDownIcon.defaultProps = colorIconDefaultProps;

/** Defines a left arrow icon. */
export const ArrowLeftIcon = ({
    fieldProps,
    color
}) => ( <
    svg { ...fieldProps
    }
    xmlns = "http://www.w3.org/2000/svg"
    width = "32"
    height = "32"
    viewBox = "0 0 32 32" >
    <
    title > Left Arrow < /title> <
    path stroke = {
        color
    }
    fill = "none"
    strokeLinecap = "round"
    strokeLinejoin = "round"
    d = "M20 6L9 16l11 10.5" /
    >
    <
    /svg>
);

ArrowLeftIcon.propTypes = colorIconPropTypes;
ArrowLeftIcon.defaultProps = colorIconDefaultProps;

/** Defines a right arrow icon. */
export const ArrowRightIcon = ({
    fieldProps,
    color
}) => ( <
    svg { ...fieldProps
    }
    xmlns = "http://www.w3.org/2000/svg"
    width = "32"
    height = "32"
    viewBox = "0 0 32 32" >
    <
    title > Right Arrow < /title> <
    path fill = "none"
    stroke = {
        color
    }
    strokeLinecap = "round"
    strokeLinejoin = "round"
    d = "M12 6l11 10-11 10.5" /
    >
    <
    /svg>
);

ArrowRightIcon.propTypes = colorIconPropTypes;
ArrowRightIcon.defaultProps = colorIconDefaultProps;

/** Defines a checkmark icon for checkboxes */
export const CheckboxCheckMarkIcon = ({
    fieldProps,
    color
}) => ( <
    svg { ...fieldProps
    }
    xmlns = "http://www.w3.org/2000/svg"
    width = "22"
    height = "20"
    viewBox = "0 0 22 20" >
    <
    path fill = "none"
    stroke = {
        color
    }
    strokeLinecap = "round"
    strokeLinejoin = "round"
    d = "M1 13.077L7.923 20 21 0" /
    >
    <
    /svg>
);
CheckboxCheckMarkIcon.propTypes = colorIconPropTypes;
CheckboxCheckMarkIcon.defaultProps = colorIconDefaultProps;

/** Defines a close icon. */
export const CloseMenuIcon = ({
    fieldProps,
    color
}) => ( <
    svg { ...fieldProps
    }
    xmlns = "http://www.w3.org/2000/svg"
    width = "32px"
    height = "32px"
    viewBox = "0 0 32 32" >
    <
    g id = "01.-Glyphs-/-menu-close"
    stroke = "none"
    strokeWidth = "1"
    fill = "none"
    fillRule = "evenodd"
    strokeLinecap = "round"
    strokeLinejoin = "round" >
    <
    path d = "M8,24.9705627 L24.9705627,8"
    id = "bottom-line"
    stroke = {
        color
    }
    /> <
    path d = "M8,8 L24.9705627,24.9705627"
    id = "top-line"
    stroke = {
        color
    }
    /> <
    /g> <
    /svg>
);

CloseMenuIcon.propTypes = colorIconPropTypes;
CloseMenuIcon.defaultProps = colorIconDefaultProps;

/** Defines a menu icon. */
export const NavMenuIcon = ({
    fieldProps,
    color
}) => ( <
    svg { ...fieldProps
    }
    xmlns = "http://www.w3.org/2000/svg"
    width = "32px"
    height = "32px"
    viewBox = "0 0 32 32" >
    <
    g id = "01.-glyphs-/-menu"
    stroke = "none"
    strokeWidth = "1"
    fill = "none"
    fillRule = "evenodd"
    strokeLinejoin = "round" >
    <
    path d = "M6,21 L26,21"
    id = "bottom-line"
    stroke = {
        color
    }
    /> <
    path d = "M6,12 L26,12"
    id = "top-line"
    stroke = {
        color
    }
    /> <
    /g> <
    /svg>
);

NavMenuIcon.propTypes = colorIconPropTypes;
NavMenuIcon.defaultProps = colorIconDefaultProps;

/** Defines a small search icon. */
export const SmallSearchIcon = ({
    fieldProps,
    color
}) => ( <
    svg { ...fieldProps
    }
    xmlns = "http://www.w3.org/2000/svg"
    width = "20"
    height = "20"
    viewBox = "0 0 32 32" >
    <
    g fill = "none"
    fillRule = "evenodd"
    stroke = {
        color
    }
    strokeLinecap = "round"
    strokeLinejoin = "round"
    strokeWidth = "3" >
    <
    circle cx = "14"
    cy = "14"
    r = "8" / >
    <
    path d = "M19.5 19.5l6 6" / >
    <
    /g> <
    /svg>
);

SmallSearchIcon.propTypes = colorIconPropTypes;
SmallSearchIcon.defaultProps = colorIconDefaultProps;

export const MusicIcon = ({
    fieldProps,
    color
}) => ( <
    svg xmlns = "http://www.w3.org/2000/svg"
    width = "32"
    height = "32"
    viewBox = "0 0 32 32" { ...fieldProps
    } >
    <
    g fill = "none"
    fillRule = "evenodd"
    stroke = {
        color
    }
    strokeWidth = {
        1.5
    }
    strokeLinecap = "round"
    strokeLinejoin = "round" >
    <
    path d = "M12 24.5V9.08c0-.942.608-1.775 1.504-2.063L23.17 3.91A2.167 2.167 0 0 1 26 5.972V20.5" / >
    <
    path d = "M8 28c-2.21 0-4-1.567-4-3.5S5.79 21 8 21s4 1.567 4 3.5S10.21 28 8 28zm14-4c-2.21 0-4-1.567-4-3.5s1.79-3.5 4-3.5 4 1.567 4 3.5-1.79 3.5-4 3.5z" / >
    <
    /g> <
    /svg>
);
MusicIcon.propTypes = colorIconPropTypes;
MusicIcon.defaultProps = colorIconDefaultProps;