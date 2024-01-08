import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { addLocationSearchToURL, isURLExternal } from 'shared/utils/urls';

import { LinkProps, withBaseWaymarkLink } from './withBaseWaymarkLink';

import * as selectors from 'app/state/selectors';

interface Props extends LinkProps {
  shouldOpenInNewTab?: boolean;
  isCMSPageLink?: boolean;
}

/**
 * A wrapper around a simple anchor element with Waymark's styling
 * and lots of props for further styling and functionality customization.
 *
 * As the name suggests, this component should primarily be used for external links, meaning
 * links to other pages outside of the Waymark SPA.
 *
 * However, it can also be used for links that are within waymark.com if we want to
 * eject out of the SPA and force a full hard-reload when navigating to that page.
 * A common use-case for this is linking to our webflow-hosted marketing pages, as those
 * are not within the SPA.
 */
export const ExternalLink = withBaseWaymarkLink<Props>(function ExternalLinkComponent(
  { linkTo, shouldOpenInNewTab = false, isCMSPageLink = false, ...props }: Props,
  ref,
) {
  const linkURL = useMemo(() => {
    const baseLinkURL = typeof linkTo === 'string' ? linkTo : `${linkTo.pathname}${linkTo.search}`;
    // If the link is internal to waymark.com, make sure to retain our query params
    const isExternal = isURLExternal(baseLinkURL);
    return isExternal ? linkTo : addLocationSearchToURL(baseLinkURL);
  }, [linkTo]);

  const formattedLinkURL = useSelector((state) => {
    if (isCMSPageLink) {
      // Format the CMS page with a branded CMS directory if the user has a partner with branded CMS pages
      return selectors.getBrandedCmsURL(state, linkURL);
    }

    return linkURL;
  });

  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      href={formattedLinkURL}
      target={shouldOpenInNewTab ? '_blank' : '_self'}
      rel="noopener noreferrer"
      ref={ref}
      {...props}
    />
  );
});

export type ExternalLinkProps = React.ComponentProps<typeof ExternalLink>;
