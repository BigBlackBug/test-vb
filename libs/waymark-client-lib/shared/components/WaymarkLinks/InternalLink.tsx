import { useMemo } from 'react';

import { Link } from 'react-router-dom';
import { addLocationSearchToURL, addPersistedQueryParamsToSearchString } from 'shared/utils/urls';

import { withBaseWaymarkLink, LinkProps } from './withBaseWaymarkLink';

/**
 * A wrapper around the react-router-dom Link component with Waymark's styling
 * and lots of props for further styling and functionality customization.
 *
 * As the name suggests, this component should be used for internal links, meaning
 * links to other pages within the Waymark SPA.
 */
export const InternalLink = withBaseWaymarkLink<LinkProps>(function InternalLinkComponent(
  { linkTo, ...props },
  ref,
) {
  const formattedLinkTo = useMemo(
    () =>
      typeof linkTo === 'string'
        ? addLocationSearchToURL(linkTo)
        : {
            ...linkTo,
            search: addPersistedQueryParamsToSearchString(linkTo.search),
          },
    [linkTo],
  );

  return <Link to={formattedLinkTo} ref={ref} {...props} />;
});

export type InternalLinkProps = React.ComponentProps<typeof InternalLink>;
