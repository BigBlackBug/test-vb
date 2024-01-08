// Vendor
import {
    Row,
    Col
} from 'react-flexbox-grid';

// Local
import StandardPageLayoutWrapper from 'app/components/StandardPageLayoutWrapper.js';
import {
    ExternalLink
} from 'shared/components/WaymarkLinks';
import {
    cmsURLs
} from 'app/constants/urls.js';
import * as styles from './PageNotFoundPage.css';

/**
 * Defines a fallback page when an incorrect URL is entered.
 */
const PageNotFoundPage = () => ( <
    StandardPageLayoutWrapper >
    <
    Row >
    <
    Col className = {
        styles.PageNotFoundPage
    }
    xs = {
        12
    } >
    <
    h3 > Page Not Found < /h3> <
    ExternalLink linkTo = {
        cmsURLs.home
    }
    colorTheme = "PrimaryText"
    underlineMode = "always" >
    Click here to go home <
    /ExternalLink> <
    /Col> <
    /Row> <
    /StandardPageLayoutWrapper>
);

export default PageNotFoundPage;