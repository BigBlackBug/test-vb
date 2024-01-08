// Vendor
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// Shared
import useThrottle from 'shared/hooks/useThrottle';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import { useShowRendererOutline } from 'shared/web_video/hooks/rendererOutlineObject';
import { useIsConfiguratorSetup } from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import useEvent from 'shared/hooks/useEvent';

/* WAYMARK APP DEPENDENCIES */
import { useIsWindowMobile } from 'app/hooks/windowBreakpoint.js';
import ToggleCollapseTransition from 'app/components/ToggleCollapseTransition';
/* END WAYMARK APP DEPENDENCIES */

import { TextStyleEditor } from './TextStyleEditor';

import * as styles from './TextField.css';

const calculateTextFieldAdditionalCharacterLength = (textValue: string) => {
  // Safari counts newlines as two characters, so we need to add an
  // additional character to the text input maxLength for every newline.
  if (
    navigator.userAgent.indexOf('Safari') !== -1 &&
    navigator.userAgent.indexOf('Chrome') === -1
  ) {
    return (textValue.match(/\n/g) || []).length;
  }

  return 0;
};

interface TextFieldProps {
  /**
   * The key of the field we're editing
   */
  editingFieldKey: string;
  /**
   * Updates configuration when the text input's value changes
   */
  updateConfigurationValue: (newValue: string) => void;
  /**
   * Jumps video to the display time for this text field
   */
  onFieldFocus: () => void;
  /**
   * Optional character limit to apply to text field
   */
  characterLimit?: number | null;
  /**
   * Default value to display in the text field
   */
  configurationValue?: string;
}

/**
 * A component that renders an individual TextInput for configurable
 * fields in VideoTemplate configuration.
 */
export default function TextField({
  editingFieldKey,
  updateConfigurationValue,
  onFieldFocus,
  characterLimit = null,
  configurationValue = '',
}: TextFieldProps) {
  const isMobile = useIsWindowMobile();

  const textFieldContainerRef = useRef<HTMLDivElement>(null);

  // Keep track of the value to display in the text input
  const [currentInputValue, setCurrentInputValue] = useState(configurationValue || '');

  const textFieldMaxLength = useMemo(() => {
    // Keep track of the max length we should set on the text input - this is needed because
    // some browsers count newlines as two characters, meaning that the user could become unable to
    // fully type all of the characters they're alloted with their character limit
    return characterLimit
      ? characterLimit + calculateTextFieldAdditionalCharacterLength(currentInputValue)
      : null;
  }, [characterLimit, currentInputValue]);

  // Keep a ref to the last input value we committed into the configuration with `updateConfigurationValue`
  // This is helpful since we are applying a throttle to calls to update the configuration value and that
  // can potentially result in our local input value state getting out of sync if the user types faster than the configuration can update.
  const lastCommittedConfigurationValue = useRef(configurationValue);

  useEffect(() => {
    // If the configuration value changes and doesn't match the last committed value, that likely
    // means an external change to the configuration has occurred which has caused a desync (ie, resetting
    // the template to default values)
    // In this case, we should use the configuration value to make sure the UI stays in sync as expected.
    if (configurationValue !== lastCommittedConfigurationValue.current) {
      setCurrentInputValue(configurationValue);
    }
  }, [configurationValue]);

  // Create a throttled version of `updateConfigurationValue` to improve performance.
  // We are applying a particularly big throttle time on mobile devices since they tend to be much slower
  // and the user won't be able to see the video as they type anyways, but also applying a small
  // amount for desktop devices to make typing quickly a much smoother experience overall
  //
  // Note that we're doing this rather than using the `WaymarkTextInput` component's built-in `onChangeThrottleTime`
  // prop because we don't want to throttle the entire onChange call, only the part that updates the configuration
  const throttledUpdateConfigurationValue = useThrottle(
    (newValue: string) => {
      updateConfigurationValue(newValue);
      // Store this value that we just committed to the configuration so we can
      // keep track of when things get out of sync
      lastCommittedConfigurationValue.current = newValue;
    },
    isMobile ? 500 : 30,
  );

  const onInputChange = useCallback(
    (event) => {
      const inputTextValue = event.target.value;

      // Keep our controlled input value up to date
      setCurrentInputValue(inputTextValue);

      throttledUpdateConfigurationValue(inputTextValue);
    },
    [throttledUpdateConfigurationValue],
  );

  const [isFocused, setIsFocused] = useState(false);

  // Show an outline around the text in the renderer when the field is focused
  useShowRendererOutline(isFocused, editingFieldKey);

  const onFocus = useEvent(() => {
    onFieldFocus?.();
    setIsFocused(true);
  });

  const onBlur = useEvent((event?: React.FocusEvent<HTMLDivElement>) => {
    if (event && (!event.relatedTarget || event.currentTarget.contains(event.relatedTarget))) {
      // Don't do anything if the blur event wasn't related to shifting focus to another element
      // This is necessary because we don't necessarily want to collapse the text style editor
      // if the user just clicked on some empty space in the text style editor UI; only if the user
      // clicked outside of the text field and style UI entirely
      return;
    }

    setIsFocused(false);
  });

  useEffect(() => {
    if (isFocused) {
      const textFieldContainer = textFieldContainerRef.current;

      const onWindowMouseUp = (mouseUpEvent: MouseEvent) => {
        // Remove the mouseup listener so it'll only execute once
        window.removeEventListener('mouseup', onWindowMouseUp);

        // If the mouseup event didn't land on the text field, blur the text field
        if (textFieldContainer && !textFieldContainer.contains(mouseUpEvent.target as Node)) {
          onBlur();
        }
      };

      // If the field has focus, listen for mousedown events that fall outside of the text field
      // so we can blur the field when the user completes their click outside of the text field as well
      const onWindowMousedown = (mouseDownEvent: MouseEvent) => {
        // If the mousedown event landed outside of the text field container, start listening for the mouseup event.
        // If the user completes their click outside of the text field container as well, we'll blur the text field.
        if (textFieldContainer && !textFieldContainer.contains(mouseDownEvent.target as Node)) {
          window.addEventListener('mouseup', onWindowMouseUp);
        }
      };

      window.addEventListener('mousedown', onWindowMousedown);

      return () => {
        window.removeEventListener('mousedown', onWindowMousedown);
        window.removeEventListener('mouseup', onWindowMouseUp);
      };
    }
  }, [isFocused, onBlur]);

  const isConfiguratorSetup = useIsConfiguratorSetup();

  return (
    <div
      className={styles.VideoContentTextField}
      onFocus={onFocus}
      onBlur={onBlur}
      ref={textFieldContainerRef}
    >
      <WaymarkTextInput
        className={styles.VideoContentTextInput}
        maxLength={textFieldMaxLength || undefined}
        onChange={onInputChange}
        shouldExpandWithDynamicRows
        value={currentInputValue}
        subtext={
          // Only show character limit if the text field has focus
          characterLimit ? characterLimit - currentInputValue.length : null
        }
        subtextClassName={styles.CharacterLimit}
        {...styles.dataHasHitCharacterLimit(
          textFieldMaxLength ? currentInputValue.length / textFieldMaxLength > 0.85 : false,
        )}
      />
      <ToggleCollapseTransition
        // Only show the text style UI if the field is focused and the configurator is setup
        isVisible={isFocused && isConfiguratorSetup}
        className={styles.TextStyleEditorCollapsibleSection}
      >
        <TextStyleEditor editingFieldKey={editingFieldKey} />
      </ToggleCollapseTransition>
    </div>
  );
}
