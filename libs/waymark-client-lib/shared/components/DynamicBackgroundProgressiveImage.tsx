import { useState } from 'react';
import ProgressiveImage, { ProgressiveImageProps } from './ProgressiveImage';
import classNames from 'classnames';

import useEvent from 'shared/hooks/useEvent';

import * as styles from './DynamicBackgroundProgressiveImage.css';

/**
 * Class manages a pool of canvases which can be used to extract pixel data
 * to calculate the average luminance of images. This is intended to reduce
 * the overhead of creating and destroying tons of canvas instances for each image
 * rendered in the UI, as this number can get pretty high.
 */
class CanvasPool {
  /**
   * Pool of canvases which are available to use.
   * If a canvas sits idle for too long, it will be removed from the pool.
   * Currently, we rarely exceed just having one canvas in the pool at a time, but that
   * may change in the future when we switch to React 18's concurrent mode.
   */
  pooledCanvases: {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    expirationTimeoutID: number;
  }[] = [];

  /**
   * Get a canvas from the pool, or create a new one if none are available
   */
  getCanvas() {
    let canvas: HTMLCanvasElement | null;
    let context: CanvasRenderingContext2D | null;

    const pooledCanvas = this.pooledCanvases.pop();

    if (pooledCanvas) {
      canvas = pooledCanvas.canvas;
      context = pooledCanvas.context;
      // Cancel the expiration timeout for this canvas
      window.clearTimeout(pooledCanvas.expirationTimeoutID);
    } else {
      canvas = document.createElement('canvas');
      // Make the canvas 1x1; this means that when we draw images to the canvas,
      // that single pixel will be the average color of the image
      canvas.width = 1;
      canvas.height = 1;
      context = canvas.getContext('2d', {
        // Flag that we're going to be reading the image data from this canvas frequently so the browser
        // can optimize accordingly
        willReadFrequently: true,
      });
    }

    if (canvas === null || context === null) {
      throw new Error('Failed to create canvas');
    }

    return { canvas, context, release: () => this.releaseCanvas(canvas, context) };
  }

  /**
   * Release a canvas back into the pool so it can be used by other components.
   * If the canvas sits idle for too long after being released, it will expire and be removed from the pool.
   * @param canvas
   * @param context
   */
  releaseCanvas(canvas: HTMLCanvasElement | null, context: CanvasRenderingContext2D | null) {
    if (canvas === null || context === null) {
      console.error('Attempted to release a null canvas or context');
      return;
    }

    this.pooledCanvases.push({
      canvas,
      context,
      expirationTimeoutID: window.setTimeout(() => {
        // Remove this canvas from the pool if it's inactive for 5s
        // This timeout will be canceled if the canvas is used again before it expires
        this.pooledCanvases = this.pooledCanvases.filter(
          (pooledCanvas) => pooledCanvas.canvas !== canvas,
        );
      }, 5000),
    });
  }
}

const canvasPool = new CanvasPool();

// Cache the result of the luminance calculation for each image URL to further reduce
// the number of times we need to calculate the luminance for each image
const isImageLightCache = new Map<string, boolean>();

const getIsImageLight = async (image: HTMLImageElement) => {
  // Split off any query params from the image URL to keep it normalized for caching purposes
  const imageURL = image.src.split('?')[0];

  if (isImageLightCache.has(imageURL)) {
    // If we already have a cached result for this image, return it
    return isImageLightCache.get(imageURL);
  }

  // Get a canvas to draw the image to
  const { context, release } = canvasPool.getCanvas();

  // Draw the image to the canvas
  context.drawImage(image, 0, 0, 1, 1);
  // Get the rgb pixel data for the single pixel in the canvas
  const {
    data: [r, g, b],
  } = context.getImageData(0, 0, 1, 1);

  // Release the canvas back into the pool
  release();

  // Use rough formula for calculating the luminance of a color shamelessly stolen from https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
  // Note that the rgb values are 0-255, so this luminance value will be roughly on a 0-255 scale as well
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // If the luminance is greater than 127, we'll consider the image to be light
  const isImageLight = luminance > 127;

  isImageLightCache.set(imageURL, isImageLight);

  return isImageLight;
};

// Allow all ProgressiveImage props except isTransparent, as it messes with the background color that we're trying to set
type DynamicBackgroundProgressiveImageProps = Omit<ProgressiveImageProps, 'isTransparent'>;

/**
 * A ProgressiveImage component, enhanced to dynamically change the background color
 * of the image wrapper based on the average luminance of the image's pixels to maximize
 * the readability of the image.
 *
 * This is mainly useful for places where something like a logo image may be displayed in the UI,
 * since logos frequently have transparent backgrounds and may be difficult to read if they are
 * all-white or all-black.
 */
export const DynamicBackgroundProgressiveImage = ({
  onLoad: onLoadCallback,
  imageWrapperClassName,
  ...props
}: ProgressiveImageProps) => {
  // Whether the image's average luminance is light or dark. We will apply a dark or light background respectively
  // to maximize the readability of the image.
  const [isImageLight, setIsImageLight] = useState(
    // Attempt to get an initial state value from the cache. If we don't have a cached value,
    // we'll default to false and update the state once the image loads
    () => Boolean(props.src) && Boolean(isImageLightCache.get(props.src.split('?')[0])),
  );

  const onLoad = useEvent(async (event: React.SyntheticEvent<HTMLImageElement>) => {
    onLoadCallback?.(event);

    if (event.target instanceof HTMLImageElement) {
      const isLight = await getIsImageLight(event.target);
      setIsImageLight(isLight ?? false);
    }
  });

  return (
    <ProgressiveImage
      onLoad={onLoad}
      imageWrapperClassName={classNames(
        imageWrapperClassName,
        isImageLight ? styles.DarkBackground : styles.LightBackground,
      )}
      {...props}
    />
  );
};
