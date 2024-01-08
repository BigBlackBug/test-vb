// Vendor
import classNames from 'classnames';

// Editor
import { EditorPanelKey } from 'editor/constants/Editor';
import { useEditorPanelDispatch } from 'editor/providers/EditorPanelProvider';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';

import * as styles from './ControlPanelButton.css';

export interface ControlPanelButtonProps {
  panelKey: EditorPanelKey;
  icon: React.ReactNode;
  text: string;
  className?: string | null;
}

/**
 * Renders a button to open an editor panel
 *
 * @param {EditorPanelKey} panelKey - key of the panel which this button should open
 * @param {React.ReactNode} icon - icon to display in the button
 * @param {string} text - text to display in the button under the icon
 * @param {string} [className] - optional className to apply to the button
 */
export default function ControlPanelButton({
  panelKey,
  icon,
  text,
  className = null,
}: ControlPanelButtonProps) {
  const { openControlPanel } = useEditorPanelDispatch();

  return (
    <WaymarkButton
      onClick={() => openControlPanel(panelKey)}
      colorTheme="Secondary"
      analyticsAction={`selected_${panelKey}_mode`}
      isSmall
      className={classNames(styles.ControlPanelButton, className)}
    >
      {icon}
      <span className={styles.ControlPanelButtonText}>{text}</span>
    </WaymarkButton>
  );
}
