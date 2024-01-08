// Vendor
import {
    useMemo
} from 'react';
import PropTypes from 'prop-types';
import {
    useSelector
} from 'react-redux';
import {
    css,
    cx as emotionClassNames
} from '@emotion/css';

// Local
import ProgressiveImage from 'shared/components/ProgressiveImage';
import {
    ExternalLink
} from 'shared/components/WaymarkLinks';
import {
    cmsURLs
} from 'app/constants/urls.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    getImgixUrl
} from 'shared/utils/urls.js';

// Styles
import {
    blackColor
} from 'styles/themes/waymark/colors.js';
import breakpoints from 'styles/constants/breakpoints.js';

const WAYMARK_LOGO_IMAGE_URL = getImgixUrl('app/components/waymark_header/waymark-header-logo.png');

/**
 * Creates a Waymark logo.
 * The logo padding is equal to the logo height.
 */
export const WaymarkLogoImage = ({
    className,
    ...props
}) => ( <
    ProgressiveImage src = {
        WAYMARK_LOGO_IMAGE_URL
    }
    alt = "Waymark"
    className = {
        emotionClassNames(
            css `
        background-color: ${blackColor};

        height: 100%;
        width: 246px;

        @media ${breakpoints.medium.queryDown} {
          width: 205px;
        }

        @media ${breakpoints.small.queryDown} {
          width: 195px;
        }
      `,
            className,
        )
    }
    shouldFillWidth isTransparent { ...props
    }
    />
);

WaymarkLogoImage.propTypes = {
    className: PropTypes.string,
};
WaymarkLogoImage.defaultProps = {
    className: null,
};

/**
 * Creates a Waymark logo.
 * The logo padding is equal to the logo height.
 */
export const WaymarkLogoSVG = (color, className, ...props) => ( <
    svg xmlns = "http://www.w3.org/2000/svg"
    height = "100%"
    viewBox = "0 0 830.4 161"
    className = {
        emotionClassNames(
            css `
        height: 24px;
        width: auto;

        @media ${breakpoints.small.queryDown} {
          height: 20px;
        }
      `,
            className,
        )
    } { ...props
    } >
    <
    title > Waymark < /title> <
    path fill = {
        color
    }
    d = "M260.8,37.6v79.2h-31.2V105c-2.9,6.5-12.9,13.9-24.2,13.9c-21.7,0-36.8-16.8-36.8-41.6s15.1-41.6,36.8-41.6
    c11 .3, 0, 21.4, 7.2, 24.2, 13.7 V37 .6 H260 .8 z M229 .5, 77.3 c0 - 8.6 - 6.1 - 15.6 - 15 - 15.6 c - 8.6, 0 - 14.7, 7 - 14.7, 15.6 c0, 8.4, 6.1, 15.6, 14.7, 15.6 C223 .5, 92.9, 229.5, 85.7, 229.5, 77.3 z M289 .5, 146.4 c - 7 - 5.6 - 11.1 - 14 - 11.2 - 23 h31 .4 c0 .3, 6.5, 4.8, 10.7, 12, 10.7 c8 .1, 0, 12.1 - 3.7, 12.1 - 13.9 v - 17.4 c - 4.1, 8.3 - 12.9, 13.4 - 24.9, 13.4 c - 9.9, 0 - 17.9 - 3.7 - 22 - 8.3 c - 5.9 - 6.2 - 7.3 - 14 - 7.3 - 25.8 V37 .6 H311v40 .2 c0, 9.4, 2.9, 15, 10.9, 15 c7 .8, 0, 12 - 5.6, 12 - 16.4 V37 .6 h31 .2 v76 .2 c0, 13.2 - 4.9, 26.5 - 12, 32.1 c - 7.6, 6 - 16.1, 8.4 - 31.7, 8.4 C306 .5, 154.3, 296.8, 152.3, 289.5, 146.4 M482 .4, 116.8 V75 .5 c0 - 9.1 - 2.9 - 13.9 - 9.4 - 13.9 c - 6.2, 0 - 10.5, 4 - 10.5, 15.6 v39 .5 h - 29.7 V75 .5 c0 - 9.1 - 2.7 - 13.9 - 9.4 - 13.9 c - 6.2, 0 - 10.5, 4.1 - 10.5, 16.6 v38 .6 h - 29.7 V37 .6 h29 .7 v11 .6 c3 .5 - 7.5, 11.8 - 13.5, 23.6 - 13.5 c13 .4, 0, 20.1, 5.9, 23.3, 14.3 c4 .5 - 8.5, 13.2 - 14.3, 25.2 - 14.3 c22 .5, 0, 27.3, 15, 27.3, 33.6 v47 .5 H482 .4 z M618, 37.6 v79 .2 h - 31.3 V105c - 2.9, 6.5 - 12.9, 13.9 - 24.2, 13.9 c - 21.7, 0 - 36.8 - 16.8 - 36.8 - 41.6 s15 .2 - 41.6, 36.8 - 41.6 c11 .3, 0, 21.4, 7.2, 24.2, 13.7 V37 .6 H618z M586 .7, 77.3 c0 - 8.6 - 6.1 - 15.6 - 15 - 15.6 c - 8.6, 0 - 14.7, 7 - 14.7, 15.6 c0, 8.4, 6.1, 15.6, 14.7, 15.6 C580 .7, 92.9, 586.7, 85.7, 586.7, 77.3 z M699 .6, 65.6 c - 3.5 - 1 - 7.1 - 1.5 - 10.7 - 1.4 c - 12, 0 - 21.2, 5.6 - 21.2, 24.7 v27 .9 h - 31.2 V37 .6 h31 .2 v12 .6 C671 .2, 43, 680.2, 36, 691.5, 36 c2 .8 - 0.1, 5.5, 0.3, 8.1, 1.1 V65 .6 z M699 .6, 65.6 c - 3.5 - 1 - 7.1 - 1.5 - 10.7 - 1.4 c - 12, 0 - 21.2, 5.6 - 21.2, 24.7 v27 .9 h - 31.2 V37 .6 h31 .2 v12 .6 C671 .2, 43, 680.2, 36, 691.5, 36 c2 .8 - 0.1, 5.5, 0.3, 8.1, 1.1 V65 .6 z M771 .5, 77.3 l28 .7, 39.5 h - 36.5 l - 19.9 - 31.7 v31 .7 h - 31.2 V5 .2 h31 .2 v64 .3 l20 .1 - 31.9 h36 .3 L771 .5, 77.3 z M771 .5, 77.3 l28 .7, 39.5 h - 36.5 l - 19.9 - 31.7 v31 .7 h - 31.2 V5 .2 h31 .2 v64 .3 l20 .1 - 31.9 h36 .3 L771 .5, 77.3 z M92 .7, 56.1 l - 18.7, 60.8 H45 .2 L5, 5.2 h35 .1 l19 .8, 66.7 L79 .5, 5.2 h26 .5 l19 .5, 66.7 l19 .9 - 66.7 h35 .1 l - 40.2, 111.6 h - 29 L92 .7, 56.1 z M92 .7, 56.1 l - 18.7, 60.8 H45 .2 L5, 5.2 h35 .1 l19 .8, 66.7 L79 .5, 5.2 h26 .5 l19 .5, 66.7 l19 .9 - 66.7 h35 .1 l - 40.2, 111.6 h - 29 L92 .7, 56.1 z " /
    >
    <
    /svg>
);

WaymarkLogoSVG.propTypes = {
    color: PropTypes.string,
};

WaymarkLogoSVG.defaultProps = {
    color: blackColor,
};

const WhitelabeledLogo = (color, className, ...props) => ( <
    svg xmlns = "http://www.w3.org/2000/svg"
    viewBox = "420 0 1080 1080"
    height = "100%"
    className = {
        emotionClassNames(
            css `
        height: 46px;
        width: auto;
      `,
            className,
        )
    } { ...props
    } >
    <
    title > Logo < /title> <
    g >
    <
    path fill = {
        color
    }
    d = "M1002.95,508.09c-9.27,0-16.64,3.65-22.08,10.95c-5.45,7.3-8.17,16.99-8.17,29.04c0,11.82,2.72,21.56,8.17,29.21
    c5 .44, 7.65, 12.81, 11.48, 22.08, 11.48 c9 .74, 0, 17.21 - 3.83, 22.43 - 11.48 c5 .22 - 7.65, 7.82 - 17.39, 7.82 - 29.21 c0 - 11.13 - 2.61 - 20.57 - 7.82 - 28.34 C1020 .16, 511.98, 1012.68, 508.09, 1002.95, 508.09 z " /
    >
    <
    path fill = {
        color
    }
    d = "M802.3,504.96c-10.2,0-17.73,4.58-22.6,13.74c-4.87,9.16-7.3,21.27-7.3,36.34c0,15.07,2.43,27.18,7.3,36.34
    c4 .87, 9.16, 12.4, 13.74, 22.6, 13.74 c10 .2, 0, 17.85 - 4.57, 22.95 - 13.74 c5 .1 - 9.16, 7.65 - 21.27, 7.65 - 36.34 c0 - 15.07 - 2.55 - 27.18 - 7.65 - 36.34 C820 .15, 509.54, 812.5, 504.96, 802.3, 504.96 z " /
    >
    <
    path fill = {
        color
    }
    d = "M420,0v1080h1080V0H420z M689.28,643.37h-67.46V394.73h67.46V643.37z M892.89,592.42c-4.52,11.48-10.95,21.39-19.3,29.73
    s - 18.49, 14.9 - 30.43, 19.65 c - 11.94, 4.75 - 25.33, 7.13 - 40.16, 7.13 c - 14.84, 0 - 28.23 - 2.38 - 40.16 - 7.13 c - 11.94 - 4.75 - 22.14 - 11.3 - 30.6 - 19.65 c - 8.46 - 8.35 - 15.01 - 18.26 - 19.65 - 29.73 c - 4.64 - 11.48 - 6.96 - 23.93 - 6.96 - 37.38 c0 - 13.44, 2.31 - 25.91, 6.96 - 37.38 c4 .63 - 11.48, 11.18 - 21.44, 19.65 - 29.91 c8 .46 - 8.46, 18.66 - 15.07, 30.6 - 19.82 c11 .94 - 4.75, 25.33 - 7.13, 40.16 - 7.13 c14 .83, 0, 28.22, 2.38, 40.16, 7.13 c11 .94, 4.75, 22.08, 11.36, 30.43, 19.82 c8 .35, 8.46, 14.78, 18.43, 19.3, 29.91 s6 .78, 23.94, 6.78, 37.38 C899 .67, 568.49, 897.41, 580.95, 892.89, 592.42 z M1095 .1, 622.15 c0, 14.38 - 2.38, 26.89 - 7.13, 37.56 c - 4.75, 10.66 - 11.07, 19.35 - 18.95, 26.08 c - 8.12, 6.96 - 17.85, 11.94 - 29.21, 14.95 c - 11.36, 3.01 - 23.65, 4.52 - 36.86, 4.52 c - 25.04, 0 - 45.61 - 4.87 - 61.72 - 14.61 c - 16.12 - 9.74 - 25.79 - 24.46 - 29.04 - 44.16 h63 .29 c1 .16, 3.71, 3.88, 7.13, 8.17, 10.26 c4 .29, 3.13, 10.37, 4.7, 18.26, 4.7 c10 .66, 0, 18.08 - 2.84, 22.25 - 8.52 c4 .17 - 5.68, 6.26 - 13.15, 6.26 - 22.43 v - 16 h - 1.39 c - 5.34, 6.03 - 11.54, 10.9 - 18.6, 14.6 c - 7.07, 3.71 - 15.82, 5.56 - 26.25, 5.56 c - 10.2, 0 - 19.82 - 1.74 - 28.86 - 5.22 c - 9.04 - 3.48 - 17.04 - 8.75 - 23.99 - 15.82 c - 6.96 - 7.07 - 12.46 - 15.82 - 16.52 - 26.25 c - 4.06 - 10.43 - 6.08 - 22.6 - 6.08 - 36.51 c0 - 12.75, 1.74 - 24.63, 5.22 - 35.64 c3 .48 - 11.01, 8.35 - 20.57, 14.61 - 28.69 c6 .26 - 8.11, 13.85 - 14.49, 22.78 - 19.13 c8 .92 - 4.63, 18.83 - 6.95, 29.73 - 6.95 c12 .52, 0, 22.78, 2.26, 30.78, 6.78 s14 .54, 10.61, 19.65, 18.26 h1 .04 v - 19.47 h62 .59 V622 .15 z M1298 .7, 592.42 c - 4.52, 11.48 - 10.95, 21.39 - 19.3, 29.73 c - 8.35, 8.35 - 18.49, 14.9 - 30.43, 19.65 c - 11.94, 4.75 - 25.33, 7.13 - 40.16, 7.13 c - 14.84, 0 - 28.23 - 2.38 - 40.17 - 7.13 c - 11.94 - 4.75 - 22.14 - 11.3 - 30.6 - 19.65 c - 8.47 - 8.35 - 15.01 - 18.26 - 19.65 - 29.73 c - 4.64 - 11.48 - 6.96 - 23.93 - 6.96 - 37.38 c0 - 13.44, 2.31 - 25.91, 6.96 - 37.38 c4 .63 - 11.48, 11.18 - 21.44, 19.65 - 29.91 c8 .46 - 8.46, 18.66 - 15.07, 30.6 - 19.82 c11 .94 - 4.75, 25.33 - 7.13, 40.17 - 7.13 c14 .83, 0, 28.22, 2.38, 40.16, 7.13 c11 .94, 4.75, 22.08, 11.36, 30.43, 19.82 c8 .35, 8.46, 14.78, 18.43, 19.3, 29.91 c4 .52, 11.48, 6.78, 23.94, 6.78, 37.38 C1305 .48, 568.49, 1303.22, 580.95, 1298.7, 592.42 z " /
    >
    <
    path fill = {
        color
    }
    d = "M1208.11,504.96c-10.2,0-17.73,4.58-22.6,13.74c-4.87,9.16-7.3,21.27-7.3,36.34c0,15.07,2.43,27.18,7.3,36.34
    c4 .87, 9.16, 12.4, 13.74, 22.6, 13.74 c10 .2, 0, 17.85 - 4.57, 22.95 - 13.74 c5 .1 - 9.16, 7.65 - 21.27, 7.65 - 36.34 c0 - 15.07 - 2.55 - 27.18 - 7.65 - 36.34 C1225 .96, 509.54, 1218.31, 504.96, 1208.11, 504.96 z " /
    >
    <
    /g> <
    /svg>
);

// A Waymark logo wrapped in a navigation link to the homepage
export const WaymarkLogoHomeButton = ({
        brandedImageClassName,
        defaultLogoClassName,
        ...props
    }) => {
        const {
            brandedHeaderLogoURL,
            isSiteWhitelabeled
        } = useSelector((state) => ({
            brandedHeaderLogoURL: selectors.getBrandingHeaderLogo(state),
            isSiteWhitelabeled: selectors.getBrandingProfileIsSiteWhitelabeled(state),
        }));

        const logo = useMemo(() => {
                if (brandedHeaderLogoURL) {
                    return ( <
                        div className = {
                            css `
            display: flex;
            align-items: center;
          `
                        } >
                        {!isSiteWhitelabeled && < WaymarkLogoImage className = {
                                defaultLogoClassName
                            }
                            />} <
                            img
                            src = {
                                brandedHeaderLogoURL
                            }
                            alt = ""
                            className = {
                                emotionClassNames(
                                    css `
                padding-left: 12px;
                max-height: 60px;
                max-width: 260px;

                @media ${breakpoints.small.queryDown} {
                  max-height: 32px;
                }
              `,
                                    brandedImageClassName,
                                )
                            }
                            /> <
                            /div>
                        );
                    }

                    return ( <
                        div className = {
                            css `
          display: flex;
          align-items: center;
        `
                        } >
                        {
                            isSiteWhitelabeled ? ( <
                                WhitelabeledLogo className = {
                                    defaultLogoClassName
                                }
                                />
                            ) : ( <
                                WaymarkLogoImage className = {
                                    defaultLogoClassName
                                }
                                />
                            )
                        } <
                        /div>
                    );
                }, [brandedHeaderLogoURL, isSiteWhitelabeled, brandedImageClassName, defaultLogoClassName]);

            return ( <
                ExternalLink linkTo = {
                    cmsURLs.home
                } { ...props
                } > {
                    logo
                } <
                /ExternalLink>
            );
        };

        WaymarkLogoHomeButton.propTypes = {
            brandedImageClassName: PropTypes.string,
            defaultLogoClassName: PropTypes.string,
        };

        WaymarkLogoHomeButton.defaultProps = {
            brandedImageClassName: '',
            defaultLogoClassName: '',
        };