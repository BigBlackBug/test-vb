import crypto from 'crypto';
import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';

/**
 * Creates a factory function for creating scoped data attributes which can be shared between Vanilla Extract styles and React components.
 *
 * @param {string} scopeName - A name which we'll generate a scoped hash from to append to all data attributes created for this scope.
 *                              Note that there's technically nothing stopping you from using the same scope name in multiple places,
 *                              which can result in collisions. Typically, a good practice is to just use the name of the file that the scope is being created in.
 *
 * @returns {(attrName: string) => Function} A factory function which will creates a data attribute function which takes a value of the type you specified and returns
 *                                           an object with the scoped data attribute name and the value you passed in.
 *                                           NOTE: You must supply a generic type argument to this function to specify the type of the attribute's value; otherwise, it will default to `never` and not be usable.
 *                                           This object can be spread onto an element in JSX to apply the data attribute to it. The object also has a `toString` method that returns
 *                                           a CSS selector for the attribute + value combo which can be used in Vanilla Extract style selectors.
 *
 * @example
 * // SlideTransition.css.ts
 *
 * // Set up a scoped data attribute factory function for this file.
 * const makeDataAttribute = makeDataAttributeScope('SlideTransition');
 *
 * const slideDirections = {
 *  left: 'left',
 *  right: 'right',
 *  up: 'up',
 *  down: 'down',
 * } as const;
 *
 * export type SlideDirections = typeof slideDirections[keyof typeof slideDirections];
 *
 * export const dataSlideDirection = makeDataAttribute<SlideDirections>('data-slide-direction');
 *
 * export const dataIsDisabled = makeDataAttribute<boolean>('data-isdisabled')
 *
 * export const SlideTransition = style({
 *  selectors: {
 *    [`&${dataSlideDirection("left")}`]: {
 *      // styles for when data-slide-direction is left
 *    },
 *    [`&${dataSlideDirection("right")}`]: {
 *      // styles for when data-slide-direction is right
 *    },
 *    [`&${dataIsDisabled(true)}`]: {
 *     // styles for when data-isdisabled is true
 *    },
 *    ...etc
 *  }
 * });
 *
 * // SlideTransition.tsx
 * import { SlideDirections, dataSlideDirection, dataIsDisabled } from './SlideTransition.css.ts';
 *
 * export const SlideTransition = ({ slideDirection, isDisabled = false }: { slideDirection: SlideDirections, isDisabled?: boolean  }) => (
 *   <div
 *    className={styles.SlideTransition}
 *    {...dataSlideDirection(slideDirection)}
 *    {...dataIsDisabled(isDisabled)}
 *   />
 * );
 *
 * // Rendered HTML
 * <SlideTransition slideDirection="left" /> --> <div class="SlideTransition" data-slide-direction="left" data-isdisabled="false" />
 */
export function makeDataAttributeScope(scopeName: string) {
  const scopeHash = crypto
    .createHash('shake256', { outputLength: 4 })
    .update(scopeName)
    .digest('hex');

  return function makeDataAttribute<TAttrValue extends string | boolean | number = never>(
    attrName: string,
  ) {
    const scopedName = `${attrName}-${scopeHash}`;
    const dataAttributeValueGetter = _dataAttribute<TAttrValue>(scopedName);

    // Use Vanilla Extract's magical addFunctionSerializer so we can guarantee that
    // the scoped data attribute value getter callback we're creating here
    // is able to be exported from a Vanilla Extract .css.ts file
    // in a way that can be used at runtime
    addFunctionSerializer(dataAttributeValueGetter, {
      importName: '_dataAttribute',
      importPath: '@libs/shared-ui-styles/src/utils/dataAttribute',
      args: [[scopedName]],
    });

    return dataAttributeValueGetter;
  };
}

/**
 * Makes a global unscoped data attribute.
 * Beware that this could cause collisions if you use the same global attribute name in multiple places.
 */
export function makeGlobalDataAttribute<TAttrValue extends string | boolean | number = never>(
  attrName: string,
) {
  const dataAttributeValueGetter = _dataAttribute<TAttrValue>(attrName);

  // Use Vanilla Extract's magical addFunctionSerializer so we can guarantee that
  // the scoped data attribute value getter callback we're creating here
  // is able to be exported from a Vanilla Extract .css.ts file
  // in a way that can be used at runtime
  addFunctionSerializer(dataAttributeValueGetter, {
    importName: '_dataAttribute',
    importPath: '@libs/shared-ui-styles/src/utils/dataAttribute',
    args: [[attrName]],
  });

  return dataAttributeValueGetter;
}

/**
 * Takes a data attribute name and returns a function that can take a value for that attribute
 * and return an object that can be spread to apply the attribute to elements in JSX, or
 * will be stringified as a CSS selector for that attribute + value combo which can be used in
 * a Vanilla Extract style selector.
 *
 * Note that this function is not intended to be used directly; instead, use the `makeDataAttribute` function.
 * This is only exported so that it can be used in the `addFunctionSerializer` call in `makeDataAttribute`
 * to enable us to create a data attribute function in a Vanilla Extract .css.ts file but then export it in a way
 * that can also be used at runtime in a React component file.
 *
 * @param {string} attributeName - The name of the data attribute
 */
export function _dataAttribute<TAttrValue extends string | number | boolean>(
  attributeName: string,
) {
  const getDataAttributeValue = (attributeValue: TAttrValue) => {
    const propObject = {
      [attributeName]: `${attributeValue}`,
    };

    // Overriding the object's toString method to return a string representing
    // a CSS selector for the data attribute with the given value,
    // ie "[data-is-toggled='true']"
    Object.defineProperty(propObject, 'toString', {
      value: () => `[${attributeName}="${attributeValue}"]`,
    });

    return propObject;
  };

  // Add an `attributeName` property to the function so we can access it at runtime;
  // this will mainly be useful for debugging/testing purposes
  Object.defineProperty(getDataAttributeValue, 'attributeName', {
    value: attributeName,
  });

  return getDataAttributeValue as typeof getDataAttributeValue & {
    attributeName: string;
  };
}
