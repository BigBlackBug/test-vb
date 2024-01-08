// Vendor
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
import ProgressBar from 'shared/components/ProgressBar';

import * as styles from './EditorFileUploadPlaceholder.css';

interface EditorFileUploadPlaceholderProps {
  /**
   * The current progress of the asset's upload (from 0-1)
   */
  uploadProgress: number;
  /**
   * If true, the progress bar will automatically increment from 0 to 95% over 10 seconds
   * @defaultValue false
   */
  shouldAutoIncrementProgress?: boolean;
  /**
   * Optional label to display under the progress bar
   * @defaultValue null
   */
  uploadProgressLabel?: string | null;
}

/**
 * A placeholder for a library image that shows a progress bar while it is uploading
 * @type
 * @class EditorFileUploadPlaceholder
 *
 * @param {number}  uploadProgress  The current progress of this image's upload (from 0-1)
 * @param {string}  [uploadProgressLabel] `Optional label to display under the progress bar
 */
const EditorFileUploadPlaceholder = ({
  uploadProgress,
  shouldAutoIncrementProgress = false,
  uploadProgressLabel = null,
}: EditorFileUploadPlaceholderProps) => (
  <div className={styles.UploadPlaceholderContainer}>
    <div className={styles.UploadPlaceholder}>
      <ProgressBar
        progress={shouldAutoIncrementProgress ? null : uploadProgress}
        // Auto increment to 95% over 10 seconds
        autoIncrementProgressDuration={10000}
      />
      {uploadProgressLabel && (
        <FadeSwitchTransition transitionKey={uploadProgressLabel}>
          <div className={styles.UploadingProgressLabel}>{uploadProgressLabel}</div>
        </FadeSwitchTransition>
      )}
    </div>
  </div>
);

export default EditorFileUploadPlaceholder;
