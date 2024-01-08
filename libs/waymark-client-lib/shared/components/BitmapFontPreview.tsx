// Vendor
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

// Shared
import settings from 'shared/utils/settings.js';

// App
import { useIsElementInViewport, defaultIntersectionObserver } from 'app/hooks/element';

// Styles
import * as styles from './BitmapFontPreview.css';
import { assignInlineVars } from '@vanilla-extract/dynamic';

/**
 * Fetches a URL for a BFS preview image with the given font variant and text
 *
 * @param {string} fontVariantUUID    UUID of the font variant to write the text in
 * @param {string} text               Text to use in the image
 */
const getBitmapFontImageURL = async (fontVariantUUID: string, text: string) => {
  let fontPreviewURL: string | null = null;

  try {
    // This URL hits the BFS API and responds with a redirect, which contains the image URL
    const fontImageRequestURL = `${
      settings.BFS_API_ENDPOINT
    }/font-variants/${fontVariantUUID}/preview-image?text=${encodeURIComponent(text)}`;

    const redirectResponse = await fetch(
      fontImageRequestURL,
      // The following fix is for Safari and Chrome on iOS (shocker) -
      // The BFS uses the wildcard* Access-Control-Allow-Origin setting, which means
      // credentials are not allowed, but the browsers on iOS are hitting the API with
      // `credentials: true`.
      { credentials: 'omit' },
    );

    // The BFS still returns the constructed URL even if the font UUID is invalid, so
    // we only want to capture the URL if a 200 status was returned.
    // NOTE: The BFS will return 500 (not 400 or 404) if the font is not found.
    if (redirectResponse.status === 200) {
      fontPreviewURL = redirectResponse.url;
    }
  } catch (error) {
    console.error('Problem fetching font previews:', error);
  }

  // Some of our font names have parenthesis, but they aren't escaped by `encodeURI` so we have to
  // manually replace them. Ideally this would happen in the BFS before the string is returned, but
  // it's easier from a resource perspective to make the fix here.
  return fontPreviewURL?.replaceAll('(', '%28').replaceAll(')', '%29');
};

const BFS_PREVIEW_IMAGE_LOADING_STATE = {
  loading: 'loading',
  success: 'success',
  failed: 'failed',
};

interface BitmapFontTextProps {
  /**
   * URL of the font preview image
   */
  imageURL: string;
  /**
   * The font preview text in the image
   */
  text: string;
  /**
   * Class to apply custom styles to the font preview image element
   */
  className?: string;
  /**
   * Whether or not to lazy load the font preview image (this is recommended if rendering a large list of font previews)
   * @default false
   */
  shouldLazyLoad?: boolean;
  /**
   * Intersection observer to use to determine when the font preview element is visible
   * and therefore ready to be lazy loaded, assuming shouldLazyLoad is true
   */
  lazyLoadIntersectionObserver?: IntersectionObserver | null;
}

/**
 * Loads and renders the BFS font image for a font preview image URL
 */
function BitmapFontText({
  imageURL,
  text,
  className,
  shouldLazyLoad,
  lazyLoadIntersectionObserver,
}: BitmapFontTextProps) {
  const fontPreviewElementRef = useRef<HTMLDivElement>(null);

  // State indicates whether the font preview image is loading or not,
  // in which case we should show a placeholder loading state
  const [imageLoadingState, setImageLoadingState] = useState(
    BFS_PREVIEW_IMAGE_LOADING_STATE.loading,
  );

  const isElementInViewport = useIsElementInViewport(
    // If we're not lazy loading, just pass null to skip obseving the element
    shouldLazyLoad ? fontPreviewElementRef : null,
    lazyLoadIntersectionObserver ?? undefined,
  );

  const [hasPreviewImageEnteredViewport, setHasPreviewImageEnteredViewport] =
    useState(isElementInViewport);

  useEffect(() => {
    if (!hasPreviewImageEnteredViewport && isElementInViewport) {
      setHasPreviewImageEnteredViewport(true);
    }
  }, [hasPreviewImageEnteredViewport, isElementInViewport]);

  // We should load the BFS right away if it's not being lazy loaded, or else wait until it has entered the viewport
  const shouldLoadImage = !shouldLazyLoad || hasPreviewImageEnteredViewport;

  // Effect updates the loading state according to the preview image's current loading state
  useEffect(() => {
    if (!shouldLoadImage || !imageURL) {
      return undefined;
    }

    setImageLoadingState(BFS_PREVIEW_IMAGE_LOADING_STATE.loading);

    const previewImage = new Image();

    // Set crossOrigin to anonymous so the image can be successfully
    // loaded in Safari/iOS devices without CORS issues
    previewImage.crossOrigin = 'anonymous';

    // Set up listeners to update the state depending on whether the image succeeds or fails to load
    previewImage.onload = () => setImageLoadingState(BFS_PREVIEW_IMAGE_LOADING_STATE.success);
    previewImage.onerror = (error) => {
      console.error('Error loading font preview image:', error);
      setImageLoadingState(BFS_PREVIEW_IMAGE_LOADING_STATE.failed);
    };

    // Set the src to start loading the image
    previewImage.src = imageURL;

    return () => {
      // On cleanup remove the onload and onerror handlers
      // to make sure they won't be called and mess with our state
      // after the image has been removed
      previewImage.onload = null;
      previewImage.onerror = null;
    };
  }, [shouldLoadImage, imageURL]);

  // If the image is loading or failed to load, we'll show placeholder text with the font's name
  const shouldShowFontPlaceholder = imageLoadingState !== BFS_PREVIEW_IMAGE_LOADING_STATE.success;

  return (
    <div
      ref={fontPreviewElementRef}
      // Set role as img to indicate that this div is being used as an image
      // via the CSS mask-image property
      role="img"
      // Label the element with the text in the preview image
      aria-label={text}
      className={classNames(styles.FontPreviewElement, className)}
      style={assignInlineVars({
        [styles.fontImageURL]: `url('${imageURL}')`,
      })}
      {...styles.dataShouldShowPlaceholder(shouldShowFontPlaceholder)}
    >
      <span>{text}</span>
    </div>
  );
}

interface BitmapFontPreviewProps {
  /**
   * UUID of the font variant to use for the font preview image
   */
  fontVariantUUID: string;
  /**
   * Text to use in the font preview image
   */
  text: string;
  /**
   * Class name to apply additional custom styles to the element
   */
  className?: string;
  /**
   * Whether or not to lazy load the font preview image
   * @default false
   */
  shouldLazyLoad?: boolean;
  /**
   * Intersection observer to use for lazy loading the font preview image if shouldLazyLoad is true.
   * If not provided, a default intersection observer will be used.
   * @default defaultIntersectionObserver
   */
  lazyLoadIntersectionObserver?: IntersectionObserver | null;
}

/**
 * Renders a BFS font image for a snippet of text
 */
export default function BitmapFontPreview({
  fontVariantUUID,
  text,
  className,
  shouldLazyLoad = false,
  lazyLoadIntersectionObserver = defaultIntersectionObserver,
}: BitmapFontPreviewProps) {
  const [imageURL, setImageURL] = useState('');

  useEffect(() => {
    (async () => {
      const fetchedImageURL = await getBitmapFontImageURL(fontVariantUUID, text);

      if (!fetchedImageURL) {
        console.error(
          `Couldn't get font preview image URL for font variant UUID ${fontVariantUUID} and text "${text}"`,
        );
        return;
      }

      setImageURL(fetchedImageURL);
    })();
  }, [fontVariantUUID, text]);

  return (
    <BitmapFontText
      // Use a key to fully re-mount the component element if the image url changes
      // to ensure everythign is loaded and rendered correctly
      key={imageURL}
      imageURL={imageURL}
      text={text}
      className={className}
      shouldLazyLoad={shouldLazyLoad}
      lazyLoadIntersectionObserver={lazyLoadIntersectionObserver}
    />
  );
}
