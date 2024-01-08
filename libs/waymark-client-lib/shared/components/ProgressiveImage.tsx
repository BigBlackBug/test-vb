// Vendor
import {
  useMemo,
  useState,
  useRef,
  memo,
  type HTMLAttributes,
  type ReactNode,
  type ReactEventHandler,
} from 'react';
import classNames from 'classnames';
import 'lazysizes';
import 'lazysizes/plugins/attrchange/ls.attrchange';
// @ts-expect-error - no types available
import Imgix from 'react-imgix';

// Local
import { addQueryParametersToURL } from 'shared/utils/urls.js';

import * as styles from './ProgressiveImage.css';

export interface ProgressiveImageProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onLoad'> {
  src: string;
  alt: string;
  className?: string | null;
  imageWrapperClassName?: string | null;
  overlay?: ReactNode | null;
  overlayClassName?: string | null;
  isTransparent?: boolean | null;
  shouldCoverContainer?: boolean;
  shouldFillWidth?: boolean | null;
  shouldFillHeight?: boolean;
  isDraggable?: boolean;
  onLoad?: ReactEventHandler<HTMLImageElement> | null;
}

/**
 * An image component which uses lazy loading and placeholders to improve UX while waiting for the full image to load
 *
 * @class ProgressiveImage
 *
 * @param   {string}          src                           Desktop/default image url
 * @param   {string}          alt                           Alt text for image
 * @param   {string}          [className]                   Class name to apply to image container
 * @param   {string}          [imageWrapperclassName]       Class name to apply to wrapper element for the image
 * @param   {bool}            [shouldCoverContainer=false]  Whether the image should expand to cover its parent container
 * @param   {bool}            [isTransparent=false]         Whether image has transparency and should not have a grey background
 * @param   {func}            [onLoad]                      Callback function when image is fully loaded
 * @param   {element}         [overlay]                     Element for an icon to overlay over the image
 * @param   {string}          [overlayClassName]            Class name to apply to the overlay wrapper
 * @param   {bool}            [shouldFillWidth=false]       Whether we should force the image to fill the width of its container,
 *                                                            regardless of the aspect ratio of the container or image
 * @param   {bool}            [shouldFillHeight=false]      Whether we should force the image to fill the height of its container,
 *                                                            regardless of the aspect ratio of the container or image
 * @param   {bool}            [isDraggable=false]           Whether we should allow the image to be dragged. We usually want this disabled
 *                                                            because it's not very useful to users and it can interfere with drag and drop file upload UIs
 */
const ProgressiveImage = ({
  // Allow src to fall back to an empty string if nothing was provided - propType
  // validation will still catch that src was not provided, but things will still be able to
  // fail more gracefully rather than completely crashing everything
  src = '',
  alt,
  className = null,
  imageWrapperClassName = null,
  shouldCoverContainer = false,
  isTransparent = false,
  onLoad = null,
  overlay = null,
  overlayClassName = null,
  shouldFillWidth = false,
  shouldFillHeight = false,
  isDraggable = false,
  ...props
}: ProgressiveImageProps) => {
  // Keep a ref to the outermost containing div or the image so we can measure
  // the parent node that this image is being rendered in
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState<null | {
    width: number;
    height: number;
  }>(null);
  const imageAspectRatio = useMemo(
    () => (dimensions ? dimensions.width / dimensions.height : 1),
    [dimensions],
  );

  // Construct a url for a low-res placeholder image that's 24px wide and blurred
  const lowResPlaceholderURL = useMemo(
    () =>
      addQueryParametersToURL(src, {
        w: 24,
        blur: 10,
        auto: ['compress', 'format'],
        fit: 'max',
      }),
    [src],
  );

  // How the image component should be sized relative to the parent
  const imageComponentSizes = useMemo(() => {
    // Calculate the width and height that the image should use relative to the container
    // based on its aspect ratio
    // Doing this in `useEffect` so we can guarantee that the component has mounted and we will be able to
    // to access the ref to the container
    const imageContainer = imageContainerRef.current;

    if (!imageContainer) {
      return {
        width: 'auto',
        height: 'auto',
      };
    }

    const containerBoundingRect = imageContainer.getBoundingClientRect();

    const containerAspectRatio = containerBoundingRect.width / containerBoundingRect.height;

    if (shouldCoverContainer || imageAspectRatio === containerAspectRatio) {
      // if we want the image to fully cover its container or its aspect ratio exactly matches the ratio of its container,
      // let's expand to fill both the width and height
      return {
        width: '100%',
        height: '100%',
      };
    } else if (imageAspectRatio >= containerAspectRatio || shouldFillWidth) {
      // If the image aspect ratio is wider or as wide as the parent node or we are being forced to fill width,
      // let's expand to fill the parent's width
      return {
        width: '100%',
        height: 'auto',
      };
    } else if (imageAspectRatio <= containerAspectRatio || shouldFillHeight) {
      // If the image aspect ratio is taller or as tall as the parent nodeor we are being forced to fill height,
      // let's expand to fill the parent's height
      return {
        width: 'auto',
        height: '100%',
      };
    } else {
      return {
        width: 'auto',
        height: 'auto',
      };
    }
  }, [imageAspectRatio, shouldCoverContainer, shouldFillHeight, shouldFillWidth]);

  if (!src) {
    console.error("ProgressiveImage unable to render: missing 'src' prop");
    return null;
  }

  return (
    <div
      className={classNames(styles.ProgressiveImageContainer, className)}
      {...styles.dataShouldCoverContainer(shouldCoverContainer)}
      ref={imageContainerRef}
      // Pass through any other props to the progressive image container
      {...props}
    >
      <div
        className={classNames(styles.ImageWrapper, imageWrapperClassName, {
          [styles.IsTransparent]: isTransparent,
        })}
        style={{
          ...imageComponentSizes,
        }}
      >
        <Imgix
          attributeConfig={{
            src: 'data-src',
            srcSet: 'data-srcset',
            sizes: 'data-sizes',
          }}
          src={src}
          sizes="auto"
          imgixParams={{
            auto: ['compress', 'format'],
            fit: 'max',
          }}
          className={classNames(
            styles.Image,
            // This is a magical class which will indicate to `lazysizes` that this image
            // should be lazy loaded and sized when it gets near/enters the viewport
            'lazyload',
          )}
          htmlAttributes={{
            src: lowResPlaceholderURL,
            alt: alt,
            onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => {
              setDimensions({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
              onLoad?.(event);
            },
            width: dimensions?.width,
            height: dimensions?.height,
            style: {
              ...imageComponentSizes,
            },
            draggable: isDraggable,
            crossOrigin: 'anonymous',
          }}
        />
        {overlay && (
          <div className={classNames(styles.OverlayIcon, overlayClassName)}>
            {/* Render overlay icon on top of image if one was provided */}
            {overlay}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ProgressiveImage);
