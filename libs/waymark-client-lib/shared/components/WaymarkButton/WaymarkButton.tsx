// Vendor
import { forwardRef } from 'react';

import { Button, ButtonProps } from '@libs/shared-ui-components';

// Local
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';

import './WaymarkButton.css';
import useEvent from 'shared/hooks/useEvent';

export interface WaymarkButtonProps extends ButtonProps {
  /**
   *  Name of analytics action to send to google analytics when this button is clicked
   */
  analyticsAction?: string | null;
  /**
   * An optional override for the category of the analytics action we're tracking
   * By default, the component will use the current page's path name
   */
  analyticsCategory?: string | null;
  /**
   * An optional additional label for the analytics action we're tracking
   */
  analyticsLabel?: string | null;
  /**
   * An optional integer value to use for the analytics action we're tracking
   */
  analyticsValue?: number | null;
}

/**
 * A convenient button component used for buttons with onClick events which provides
 * a ton of convenient utilities to make our lives easier - its styling can be set with
 * preset themes and it makes it very easy to apply analytics tracking without needing
 * to wrap anything
 */
export const WaymarkButton = forwardRef<HTMLButtonElement, WaymarkButtonProps>(
  function WaymarkButton(
    {
      onClick,
      analyticsAction = null,
      analyticsCategory = null,
      analyticsLabel = null,
      analyticsValue = null,
      ...props
    },
    ref,
  ) {
    const onClickButton = useEvent<React.MouseEventHandler<HTMLButtonElement>>((event) => {
      // Track the click event if an analytics action was provided
      if (analyticsAction) {
        const eventParams: {
          analyticsCategory?: string;
          eventLabel?: string;
          value?: number;
        } = {};

        if (analyticsCategory) {
          eventParams.analyticsCategory = analyticsCategory;
        }
        if (analyticsLabel) {
          eventParams.eventLabel = analyticsLabel;
        }
        if (analyticsValue) {
          eventParams.value = analyticsValue;
        }

        GoogleAnalyticsService.trackEvent(analyticsAction, eventParams);
      }

      onClick?.(event);
    });

    return (
      <Button
        ref={ref}
        onClick={onClickButton}
        data-testid="waymark-button"
        // Spread any additional props on the button
        {...props}
      />
    );
  },
);
