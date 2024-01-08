// Vendor
import { useEffect, useRef, useState } from 'react';

import { css, cx as emotionClassNames } from '@emotion/css';

interface AutosizeTextAreaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  wrapperClassName?: string | null;
  inputRef?: React.Ref<HTMLTextAreaElement> | null;
  minRows?: number;
  maxRows?: number | null;
}

/**
 * Ultra simple and fast implementation of a textarea that will dynamically resize to match the height of however many lines of text
 * are currently entered into the field
 *
 * Implementation inspired by this lovely article by Chris Coyier: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
 *
 * Essentially, we're just rendering a hidden div which perfectly replicates the textarea's text contents and styling so that it can
 * take up exactly how much space the textarea should need. Then we simply have the textarea expand to fill the container's dimensions
 * and you're good to go with an almost pure-CSS implementation which is waaaaaaaay faster than all of the calculations and checks that most
 * third party libraries do for this stuff
 *
 * @param {string}  [wrapperClassName]    Classname for applying custom styling to the container wrapping the textarea
 * @param {string}  [className]           Classname for applying custom styling to the textarea
 * @param {func}    onChange              Callback function to call when the textarea's onchange event fires
 * @param {ref}     [inputRef]            React ref to apply to the textarea
 * @param {string}  [value]               Controlled string value to set the textarea's value from outside of the component
 * @param {string}  [defaultValue]        String to use as the textarea's initial default
 * @param {number}  [minRows=1]           Minimum number of rows that the text area should always display with
 * @param {number}  [maxRows]             Max number of rows that the text area can expand to (there is no limit if this is not set)
 */
export default function AutosizeTextArea({
  onChange,
  className,
  value,
  defaultValue,
  wrapperClassName = null,
  inputRef = null,
  minRows = 1,
  maxRows = null,
  ...props
}: AutosizeTextAreaProps) {
  const [currentTextValue, setCurrentTextValue] = useState(value || defaultValue);

  useEffect(() => {
    // If the `value` prop changes, update our current text value to match it
    if (value !== undefined) {
      setCurrentTextValue(value);
    }
  }, [value]);

  const replicatedTextAreaContentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const replacedTextAreaContents = replicatedTextAreaContentsRef.current;

    if (replacedTextAreaContents) {
      // Set a min-height on the replicated text contents to achieve the desired minimum
      // number of rows we want the text area to have
      const { lineHeight, paddingTop, borderTopWidth, paddingBottom, borderBottomWidth } =
        getComputedStyle(replacedTextAreaContents);

      replacedTextAreaContents.style.minHeight = `calc(${borderTopWidth} + ${paddingTop} + (${lineHeight} * ${minRows}) + ${paddingBottom} + ${borderBottomWidth})`;

      // If a max number of rows is set, set a max height on the replicated text contents so they
      // can't expand beyond that number of rows
      if (maxRows) {
        replacedTextAreaContents.style.maxHeight = `calc(${borderTopWidth} + ${paddingTop} + (${lineHeight} * ${maxRows}) + ${paddingBottom} + ${borderBottomWidth})`;
      } else {
        replacedTextAreaContents.style.maxHeight = 'none';
      }
    }
  }, [minRows, maxRows]);

  return (
    <div
      className={emotionClassNames(
        css`
          position: relative;
        `,
        wrapperClassName,
      )}
    >
      <textarea
        style={{
          // If max rows are set, use overflow: auto so any contents in the scroll area that get cut off will be scrollable.
          // Otherwise, use overflow: hidden to remove the possibility of a scroll bar appearing in the text area
          overflow: maxRows ? 'auto' : 'hidden',
        }}
        className={emotionClassNames(
          className,
          css`
            /* Disable manual resizing on the text area */
            resize: none;

            /* Make the text area fill the space of the the wrapper element */
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;

            /* Ensure we break lines in the text area as you would expect */
            word-break: break-word;
          `,
        )}
        onChange={(event) => {
          setCurrentTextValue(event.target.value);
          onChange?.(event);
        }}
        ref={inputRef}
        value={currentTextValue}
        {...props}
      />
      <div
        className={emotionClassNames(
          // Ensure that any custom styling that gets applied to the text area also gets applied to the
          // replicated contents just to make absolutely sure that the dimensions of the replicated contents
          // are perfectly in sync
          className,
          css`
            width: 100%;

            /* Ensure our replicated element's white space and line breaks act like we'd expect them to in the textarea */
            white-space: pre-wrap;
            word-break: break-word;

            /* Ensure our replicated contents are hidden no matter what */
            visibility: hidden;
          `,
        )}
        ref={replicatedTextAreaContentsRef}
      >
        {/* Include an nbsp at the end of the value so that the replicated contents
            will always take up the height of one line of text even if the current value
            is an empty string */}
        {currentTextValue}&nbsp;
      </div>
    </div>
  );
}
