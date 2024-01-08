// Vendor
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';

/* APP DEPENDENCIES */
import { useAppThemeConfig } from 'app/state/appThemeStore/appThemeStore';
/* APP DEPENDENCIES */

interface EditorExitButtonProps {
  isDisabled?: boolean;
}

/**
 *
 * Renders exit button which will close the editor when clicked
 *
 * @param {boolean} isDisabled  Whether the button should be disabled
 */
export default function EditorExitButton({ isDisabled = false }: EditorExitButtonProps) {
  const appThemeConfig = useAppThemeConfig();

  const exitButtonLabel = appThemeConfig.editor.labels.exitEditor;

  return (
    <BaseHeaderBackButton
      colorTheme="Secondary"
      // Emit an `attemptCloseEditor` event to indicate we want to close the editor
      onClick={() => editorEventEmitter.emit('attemptCloseEditor')}
      shouldClosePanel={false}
      buttonText={exitButtonLabel}
      analyticsAction="selected_close_editor"
      isDisabled={isDisabled}
    />
  );
}
