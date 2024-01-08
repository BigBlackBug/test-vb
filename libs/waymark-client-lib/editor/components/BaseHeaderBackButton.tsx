// Vendor
import { useEditorPanelDispatch } from 'editor/providers/EditorPanelProvider';
import { EditorPanelKey } from 'editor/constants/Editor';

// Shared
import { WaymarkButton, WaymarkButtonProps } from 'shared/components/WaymarkButton';

interface BaseHeadBackButtonProps extends WaymarkButtonProps {
  /**
   * The key of the panel which we should go back to.
   * Will just go to the previously opened panel if not provided.
   */
  targetPanelKey?: EditorPanelKey | null;
  /**
   * Whether the button should close the current control panel when clicked.
   * If set to false, the button will just execute the provided onClick callback for custom behavior.
   *
   * @defaultValue true
   */
  shouldClosePanel?: boolean;
  /**
   * The text to put inside the button
   *
   * @defaultValue 'Back'
   */
  buttonText?: string;
}

/**
 * A back button to use in the headers of editor controls
 */
const BaseHeaderBackButton = ({
  onClick,
  targetPanelKey = null,
  shouldClosePanel = true,
  buttonText = 'Back',
  colorTheme = 'Secondary',
  ...props
}: BaseHeadBackButtonProps) => {
  const { closeControlPanel } = useEditorPanelDispatch();

  return (
    <WaymarkButton
      data-testid="editorExitButton"
      colorTheme={colorTheme}
      onClick={(event) => {
        onClick?.(event);

        if (shouldClosePanel) {
          closeControlPanel({
            targetPanelKey,
          });
        }
      }}
      {...props}
    >
      {buttonText}
    </WaymarkButton>
  );
};

export default BaseHeaderBackButton;
