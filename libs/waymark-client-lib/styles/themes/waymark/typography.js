import {
    css
} from '@emotion/css';

import {
    themeVars,
    mediaQueries
} from '@libs/shared-ui-styles';

const button = css(themeVars.font.typeVariants.button);

const smallButton = css(themeVars.font.typeVariants.buttonSmall);

// TODO design system migration note: "hero" is now "title0" in the new system
const hero = css(themeVars.font.typeVariants.title0);

// TODO design system migration note: "heroSmall" is now "title1" in the new system
const heroSmall = css(themeVars.font.typeVariants.title1);

/* A responsive version of Hero text that switches
   between the full sized and small versions depending on if the screen is
   large or small */
const heroResponsive = css `
  ${hero}

  @media ${mediaQueries.breakpoints.small.queryDown} {
    ${heroSmall}
  }
`;

// TODO design system migration note: "title1" is now "title2" in the new system
const title1 = css(themeVars.font.typeVariants.title2);

// TODO design system migration note: "title1Small" is now "title3" in the new system
const title1Small = css(themeVars.font.typeVariants.title3);

// TODO design system migration note: "title2" is now "title4" in the new system
const title2 = css(themeVars.font.typeVariants.titl4);

// TODO design system migration note: "title2Small" is now "title5" in the new system
const title2Small = css(themeVars.font.typeVariants.title5);

/* A responsive version of Title2 text */
const title2Responsive = css `
  ${title2}

  @media ${mediaQueries.breakpoints.small.queryDown} {
    ${title2Small}
  }
`;

// TODO design system migration note: "title3" is now "title6" in the new system
const title3 = css(themeVars.font.typeVariants.title6);

// TODO design system migration note: "title3Heavy" no longer exists. It's only used in one place and can be replaced with "title6" + "font.weight.heavy"
const title3Heavy = css `
  ${title3}
  font-weight: ${themeVars.font.weight.heavy};
`;

// TODO design system migration note: "headline" no longer exists. The most direct conversion is "bodyMedium" in the new system
const headline = css({
    ...themeVars.font.typeVariants.bodyRegular,
    fontWeight: themeVars.font.weight.medium,
});

// TODO design system migration note: "headlineSmall" no longer exists. The most direct conversion is "bodySmall" + "font.weight.medium" in the new system
const headlineSmall = css({
    ...themeVars.font.typeVariants.bodySmall,
    fontWeight: themeVars.font.weight.medium,
});

const headlineResponsive = css `
  ${headline}

  @media ${mediaQueries.breakpoints.small.queryDown} {
    ${headlineSmall}
  }
`;

const body = css(themeVars.font.typeVariants.bodyRegular);

const bodySmall = css(themeVars.font.typeVariants.bodySmall);

// TODO design system migration note: "bodyHeavy" is now "bodyBold" in the new system
const bodyHeavy = css(themeVars.font.typeVariants.bodyBold);

const caption1 = css(themeVars.font.typeVariants.caption1);

const caption2 = css(themeVars.font.typeVariants.caption2);

const caption3 = css(themeVars.font.typeVariants.caption3);

const inherit = css `
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
`;

const typographyStyles = {
    button,
    smallButton,
    hero,
    heroSmall,
    heroResponsive,
    title1,
    title1Small,
    title2,
    title2Small,
    title2Responsive,
    title3,
    title3Heavy,
    headline,
    headlineSmall,
    headlineResponsive,
    body,
    bodyHeavy,
    bodySmall,
    caption1,
    caption2,
    caption3,
    inherit,
};

export default typographyStyles;