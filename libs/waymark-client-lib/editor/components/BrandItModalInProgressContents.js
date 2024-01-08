// Vendor
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Shared
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';
import AIProgressBar from 'shared/components/AIProgressBar';
import {
    autofillResponseTimeout
} from 'shared/services/AutofillService.js';

// App
import RotatingTipText from 'app/components/RotatingTipText.js';

// List of tips we should rotate through while the user is waiting for branding to complete
const PROGRESS_BAR_TIPS = [
    'AI writing copy and choosing images…',
    'Applying your brand’s contact info…',
    'Matching your style…',
    'Dotting i’s and crossing t’s…',
    'Hang tight, almost ready…',
];

/**
 * Brand it modal contents show a progress bar + tips while branding is in progress
 *
 * @param {bool}  didBrandingSucceed - Whether the branding in progress was successful
 *                                      so we should fill the progress bar the rest of the way
 */
export default function BrandItModalInProgressContents({
    didBrandingSucceed
}) {
    return ( <
        >
        <
        WaymarkModalHeading title = "Branding..."
        titleClassName = {
            css `
          text-align: center;
        `
        }
        className = {
            css `
          margin-bottom: 12px;
        `
        }
        /> { /* Show rotating tips while the user is waiting for branding to complete */ } <
        RotatingTipText tips = {
            PROGRESS_BAR_TIPS
        }
        className = {
            css `
          text-align: center;
        `
        }
        textClassName = {
            css `
          /* Using padding on the text to give us some wiggle room
              so descenders (ie, the bottoms of g or y) don't get cut
              off during transitions */
          padding-bottom: 24px;
        `
        }
        shouldLoop = {
            false
        }
        updateFrequency = {
            6000
        }
        /> <
        AIProgressBar
        // If branding has succeeded, fill the progress bar, but otherwise set progress to null so it
        // will auto-increment to 95% over the course of the timeout.
        autoIncrementProgressDuration = {
            autofillResponseTimeout
        }
        progress = {
            didBrandingSucceed ? 1 : null
        }
        /> <
        />
    );
}
BrandItModalInProgressContents.propTypes = {
    didBrandingSucceed: PropTypes.bool.isRequired,
};