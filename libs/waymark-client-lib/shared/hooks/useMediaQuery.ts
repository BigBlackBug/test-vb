import { useEffect, useState } from 'react';

/**
 * Hook takes a media query string and returns whether or not the query matches the current viewport.
 */
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    // mediaQueryList will emit an onChange event if the provided media query's status changes!
    const onMediaQueryChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    mediaQueryList.addEventListener('change', onMediaQueryChange);

    return () => {
      mediaQueryList.removeEventListener('change', onMediaQueryChange);
    };
  }, [query]);

  return matches;
};
