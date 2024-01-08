// Vendor
import { useState } from 'react';
import classNames from 'classnames';

// App
import ToggleCollapseTransition from 'app/components/ToggleCollapseTransition';
import { CloseIcon } from 'app/icons/BasicIcons';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { safeLocalStorage } from 'shared/utils/safeStorage';

// Styles
import * as styles from './VOScriptWritingTips.css';

interface VOScriptWritingTipsProps {
  /** Optional property used to apply a class / styles to the component */
  className?: string | null;
}

/** A dismissable component showing tips for the automated voice over panel */
export default function VOScriptWritingTips({ className = null }: VOScriptWritingTipsProps) {
  const initialIsOpen = () => safeLocalStorage.getItem('hasDismissedVOGenerationTips') == null;
  const [isOpen, setIsOpen] = useState(initialIsOpen);

  return (
    <ToggleCollapseTransition
      isVisible={isOpen}
      className={classNames(className, styles.VOScriptWritingTipsContainer)}
    >
      <WaymarkButton
        className={styles.CloseScriptWritingTipsButton}
        onClick={() => {
          setIsOpen(false);
          safeLocalStorage.setItem('hasDismissedVOGenerationTips', 'true');
        }}
      >
        <CloseIcon className={styles.CloseScriptWritingTipsIcon} />
      </WaymarkButton>
      <div className={styles.VOScriptWritingTipsContent}>
        Tips:
        <ul className={styles.VOScriptWritingTipsList}>
          <li>Try different voices to vary voice speed, language and pronunciation.</li>
          <li>
            As you type or select a word, the preview video will scrub to the location the word will
            be heard. Select a voice first to enable this.
          </li>
          <li>
            Use phonetic spellings for words that might be mispronounced. For WellSaid voices, try
            selecting a word and clicking Respell.
          </li>
        </ul>
      </div>
    </ToggleCollapseTransition>
  );
}
