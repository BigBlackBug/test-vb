// Vendor
import PropTypes from 'prop-types';

const flickityArrowShape = PropTypes.shape({
    x0: PropTypes.number,
    x1: PropTypes.number,
    y1: PropTypes.number,
    x2: PropTypes.number,
    y2: PropTypes.number,
    x3: PropTypes.number,
});

const flickityEventListeners = PropTypes.shape({
    ready: PropTypes.func,
    change: PropTypes.func,
    select: PropTypes.func,
    settle: PropTypes.func,
    scroll: PropTypes.func,
    dragStart: PropTypes.func,
    dragMove: PropTypes.func,
    dragEnd: PropTypes.func,
    pointerDown: PropTypes.func,
    pointerMove: PropTypes.func,
    pointerUp: PropTypes.func,
    staticClick: PropTypes.func,
    lazyLoad: PropTypes.func,
    bgLazyLoad: PropTypes.func,
    fullscreenChange: PropTypes.func,
});

const flickityOptions = PropTypes.shape({
    accessibility: PropTypes.bool,
    adaptiveHeight: PropTypes.bool,
    arrowShape: PropTypes.oneOfType([PropTypes.string, flickityArrowShape]),
    autoPlay: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    cellAlign: PropTypes.oneOf(['left', 'center', 'right']),
    cellSelector: PropTypes.string,
    contain: PropTypes.bool,
    draggable: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    dragThreshold: PropTypes.number,
    freeScroll: PropTypes.bool,
    freeScrollFriction: PropTypes.number,
    friction: PropTypes.number,
    fullscreen: PropTypes.bool,
    groupCells: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    initialIndex: PropTypes.number,
    lazyLoad: PropTypes.number,
    on: flickityEventListeners,
    pageDots: PropTypes.bool,
    pauseAutoPlayOnHover: PropTypes.bool,
    percentPosition: PropTypes.bool,
    prevNextButtons: PropTypes.bool,
    resize: PropTypes.bool,
    rightToLeft: PropTypes.bool,
    selectedAttraction: PropTypes.number,
    setGallerySize: PropTypes.bool,
    watchCSS: PropTypes.bool,
    wrapAround: PropTypes.bool,
});

export default flickityOptions;