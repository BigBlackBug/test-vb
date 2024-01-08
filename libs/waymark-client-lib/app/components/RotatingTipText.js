// Vendor
import {
    PureComponent
} from 'react';
import PropTypes from 'prop-types';

// Local
import CrossFadeTransition from 'shared/components/CrossFadeTransition.js';

/**
 * Rotates through displaying strings in a provided array on a given interval
 *
 * @class RotatingTipText
 *
 * @param {string[]}  tips                        Array of strings which will be displayed on rotation
 * @param {number}    [updateFrequency=4000]      Duration that each tip should be shown for in milliseconds before changing
 * @param {bool}      [shouldPickRandomly=false]  Whether we should pick tips randomly - by default it just rotates through them in order
 * @param {string}    [className]                 A className to apply custom styling to the containing element
 * @param {string}    [textClassName]             A className to apply custom styling to the tip text elements
 * @param {bool}      [shouldLoop=true]           Whether tips should restart at the beginning after the last one is displayed
 */
export default class RotatingTipText extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            currentTipIndex: props.shouldPickRandomly ? // If we're picking randomly, let's grab a random tip to start from
                Math.floor(Math.random() * props.tips.length) : // Otherwise, let's just start on the first one
                0,
        };

        // Set interval so that the current tip is changed every X ms
        // Storing the interval so that we can clear it on unmount
        this.updateTipTextInterval = setInterval(this.updateTip, props.updateFrequency);
    }

    componentWillUnmount() {
        // Clear the update interval now that we're unmounting -
        // otherwise this can cause errors because it'll continue executing and trying to call setState!
        clearInterval(this.updateTipTextInterval);
    }

    updateTip = () => {
        const {
            shouldPickRandomly,
            tips,
            shouldLoop
        } = this.props;
        const {
            currentTipIndex
        } = this.state;
        const isLastTip = currentTipIndex === tips.length - 1;

        if (isLastTip && !shouldLoop) {
            return;
        }

        let newIndex;
        if (shouldPickRandomly) {
            // Pick a new random index
            newIndex = Math.floor(Math.random() * tips.length);
            // Ensure that we don't accidentally get the same tip twice!
            if (newIndex === currentTipIndex)
                // We'll just lazily increment the index by one to get something different
                newIndex = (newIndex + 1) % tips.length;
        } else {
            // Using modulo to ensure the new incremented index stays within the bounds of the
            // tips array's length - this way, the new index will just wrap back around to 0 instead
            newIndex = (currentTipIndex + 1) % tips.length;
        }
        this.setState({
            currentTipIndex: newIndex,
        });
    };

    render() {
        const {
            className,
            textClassName,
            tips
        } = this.props;
        const {
            currentTipIndex
        } = this.state;

        return ( <
            CrossFadeTransition className = {
                className
            }
            transitionElementClassName = {
                textClassName
            }
            transitionKey = {
                currentTipIndex
            }
            enterDuration = {
                2000
            }
            exitDuration = {
                1000
            } >
            {
                tips[currentTipIndex]
            } <
            /CrossFadeTransition>
        );
    }
}
RotatingTipText.propTypes = {
    tips: PropTypes.arrayOf(PropTypes.string).isRequired,
    updateFrequency: PropTypes.number,
    shouldPickRandomly: PropTypes.bool,
    className: PropTypes.string,
    textClassName: PropTypes.string,
    shouldLoop: PropTypes.bool,
};
RotatingTipText.defaultProps = {
    updateFrequency: 4000,
    shouldPickRandomly: false,
    className: '',
    textClassName: null,
    shouldLoop: true,
};