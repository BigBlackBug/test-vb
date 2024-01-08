import { forwardRef } from 'react';

import { buttonStyleVariants, typographyStyleVariants } from '@libs/shared-ui-styles';

import {
  dataIsDisabled,
  dataHasFill,
  dataButtonSize,
} from '@libs/shared-ui-components/src/Button/Button.css';
import { waymarkLink, UnderlineMode, dataUnderlineMode } from './WaymarkLinks.css';
import useEvent from 'shared/hooks/useEvent';
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService';
import classNames from 'classnames';

export interface LinkProps extends React.ComponentPropsWithRef<'a'> {
  linkTo: Location | string;
}

export interface BaseLinkHOCProps {
  /**
   * Whether the link should be disabled, meaning the text is grayed out and the link is not clickable
   *
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Whether the link should log Google Analytics events when clicked
   *
   * @default true
   */
  shouldUseAnalytics?: boolean;
  /**
   * The Google Analytics action name to log when the link is clicked
   */
  analyticsAction?: string | null;
  /**
   * Optional category name include in analytics events logged when the link is clicked
   */
  analyticsCategory?: string | null;
  /**
   * Optional label to include in analytics events logged when the link is clicked
   */
  analyticsLabel?: string | number | null;
  /**
   * Optional integer value to include in analytics events logged when the link is clicked
   */
  analyticsValue?: number | null;
  /**
   * Name of a color theme to apply to the link
   *
   * @default "PrimaryText"
   */
  colorTheme?: keyof typeof buttonStyleVariants | null;
  /**
   * Name of a typography style to apply to the link
   */
  typography?: keyof typeof typographyStyleVariants | null;
  /**
   * Whether the link should be styled as a filled button
   *
   * @default false
   */
  hasFill?: boolean;
  /**
   * Whether the link should be styled as small filled button (only applies if hasFill is true)
   *
   * @default false
   */
  isSmall?: boolean;
  /**
   * How the link's underline should behave; options are:
   * - never: never show an underline
   * - hover: show an underline only when the link is hovered
   * - always: always show an underline
   *
   * @default "never"
   */
  underlineMode?: UnderlineMode;
}

/**
 * HOC which provides base shared functionality to the InternalLink and ExternalLink components
 */
export function withBaseWaymarkLink<TWrappedLinkProps extends LinkProps>(
  WrappedLinkComponent: React.ForwardRefRenderFunction<HTMLAnchorElement, LinkProps>,
) {
  const WrappedLinkComponentWithForwardRef = forwardRef(WrappedLinkComponent);

  const WaymarkLinkHOC = forwardRef<HTMLAnchorElement, BaseLinkHOCProps & TWrappedLinkProps>(
    (
      {
        linkTo,
        onClick,
        isDisabled = false,
        colorTheme = 'PrimaryText',
        typography = null,
        hasFill = false,
        isSmall = false,
        underlineMode = 'never',
        className,
        // Analytics props
        shouldUseAnalytics = true,
        analyticsAction = null,
        analyticsCategory = null,
        analyticsLabel = null,
        analyticsValue = null,
        ...props
      },
      ref,
    ) => {
      const handleClick = useEvent((event: React.MouseEvent<HTMLAnchorElement>) => {
        if (isDisabled) {
          // If the link is disabled, cancel the click event
          event.preventDefault();
          return;
        }

        // Track the click event if analytics are enabled
        if (shouldUseAnalytics) {
          const eventParams: {
            analyticsCategory?: string;
            eventLabel?: string | number;
            value?: number;
          } = {};

          if (analyticsCategory) {
            eventParams.analyticsCategory = analyticsCategory;
          }
          if (analyticsLabel != null) {
            eventParams.eventLabel = analyticsLabel;
          }
          if (analyticsValue != null) {
            eventParams.value = analyticsValue;
          }

          GoogleAnalyticsService.trackEvent(
            analyticsAction || `selected_${typeof linkTo === 'string' ? linkTo : linkTo.pathname}`,
            eventParams,
          );
        }

        onClick?.(event);
      });

      let typographyClass = typography
        ? typographyStyleVariants[typography]
        : typographyStyleVariants.inherit;

      // If no typography prop was provided, and hasFill is true meaning this should be styled like a button,
      // use the appropriate button typography variant based on the isSmall prop
      if (!typography && hasFill) {
        typographyClass = typographyStyleVariants.buttonSmall;
      }

      return (
        <WrappedLinkComponentWithForwardRef
          linkTo={linkTo}
          onClick={handleClick}
          className={classNames(
            waymarkLink,
            colorTheme ? buttonStyleVariants[colorTheme] : null,
            typographyClass,
            className,
          )}
          ref={ref}
          {...dataHasFill(hasFill)}
          {...dataButtonSize(isSmall ? 'tiny' : 'small')}
          {...dataIsDisabled(isDisabled)}
          {...dataUnderlineMode(underlineMode)}
          {...props}
        />
      );
    },
  );
  WaymarkLinkHOC.displayName = 'WaymarkLinkHOC';

  return WaymarkLinkHOC;
}
