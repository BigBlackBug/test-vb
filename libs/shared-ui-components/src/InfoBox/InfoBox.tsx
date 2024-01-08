// Styles
import * as styles from './InfoBox.css';

// Local
import { CloseIcon } from './CloseIcon';
import classNames from 'classnames';

interface InfoBoxProps {
  /** Direction of the arrow */
  arrowDirection?: 'top' | 'right' | 'bottom' | 'left' | 'none';
  /** Callback for when the InfoBox is closed */
  onClose?: () => void;
  /** Content of the InfoBox */
  children: React.ReactNode;
  /** Color theme of the InfoBox */
  colorTheme?: keyof typeof styles.InfoBoxColorThemes;
  /** Optional Classname for the InfoBox */
  className?: string | null;
}

/**
 * InfoBox is a component that displays information in a box with an optional arrow
 * @param arrowDirection Direction of the arrow (default: none)
 * @param onClose Callback for when the InfoBox is closed
 * @param children Content of the InfoBox
 * @param colorTheme Color theme of the InfoBox (default: InfoBoxColorThemes.Default)
 * @param className Optional Classname for the InfoBox
 * @returns
 * @example
 * <InfoBox arrowDirection="top" onClose={() => {}}>
 *  This is the content of the InfoBox
 * </InfoBox>
 */
export const InfoBox = ({
  arrowDirection = 'none',
  onClose,
  children,
  className = null,
  colorTheme = styles.InfoBoxColorThemes.Default,
}: InfoBoxProps) => {
  return (
    <div
      {...styles.dataColorTheme(styles.InfoBoxColorThemes[colorTheme])}
      className={classNames(className, styles.infoBox)}
    >
      <div className={styles.infoBoxContent} {...styles.dataArrowDirection(arrowDirection)}>
        {children}
        {onClose && (
          <button className={styles.infoBoxClose} onClick={() => onClose()}>
            <CloseIcon width="18px" height="18px" />
          </button>
        )}
      </div>
    </div>
  );
};
