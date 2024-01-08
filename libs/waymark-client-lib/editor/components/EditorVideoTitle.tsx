// Vendor
import { useState } from 'react';

// Editor
import { useEditorState, useEditorDispatch } from 'editor/providers/EditorStateProvider.js';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';

/* WAYMARK APP DEPENDENCIES */
import { EditPencilIcon } from 'app/icons/ToolsAndActionsIcons';
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './EditorVideoTitle.css';

/**
 * Displays the video's title and allows the user to edit it
 */
export default function EditorVideoTitle() {
  // Get the video title currently saved in the editor state
  const { videoTitle: savedEditorVideoTitle } = useEditorState();
  const { updateVideoTitle } = useEditorDispatch();

  // Keep track of current contents of text input
  const [editorVideoTitle, setEditorVideoTitle] = useState(savedEditorVideoTitle);
  // Keep track of whether we should show the text input to edit the title or not
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const onEditTitleFieldChange = (
    event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const titleFieldText = event.currentTarget.value.trim();

    setEditorVideoTitle(titleFieldText);
  };

  // Ensure the video title is a string and is neither empty nor too long
  const hasValidTitle =
    typeof editorVideoTitle === 'string' &&
    editorVideoTitle.length > 0 &&
    editorVideoTitle.length <= 70;

  return (
    // Apply short fade animation when switching between displaying title and editable text input */}
    <FadeSwitchTransition
      className={styles.TitleSection}
      transitionKey={isEditingTitle ? 'editingTitle' : 'displayingTitle'}
      duration={100}
    >
      {isEditingTitle ? (
        <form
          className={styles.TitleEditor}
          onSubmit={(event) => {
            event.preventDefault();

            // Don't do anything if the new title is invalid
            if (!hasValidTitle) {
              return;
            }

            // Only update the title if it has actually been changed
            if (editorVideoTitle !== savedEditorVideoTitle) {
              updateVideoTitle(editorVideoTitle);
            }

            setIsEditingTitle(false);
          }}
        >
          <div className={styles.EditTitleTextBoxWrapper}>
            <WaymarkTextInput
              defaultValue={editorVideoTitle}
              className={styles.EditTitleTextBox}
              maxLength={70}
              onChange={onEditTitleFieldChange}
              onBlur={onEditTitleFieldChange}
              hasError={!hasValidTitle}
              shouldFocusOnMount
            />
          </div>
          <WaymarkButton type="submit" isDisabled={!hasValidTitle} colorTheme="Primary">
            Save
          </WaymarkButton>
        </form>
      ) : (
        <WaymarkButton
          // Clicking on the title will switch us into the editing state
          onClick={() => setIsEditingTitle(true)}
          hasFill={false}
          className={styles.EditTitleButton}
          colorTheme="BlackText"
          analyticsAction="selected_edit_video_title"
          tooltipText="Edit Title"
          isUppercase={false}
        >
          <h1 className={styles.CurrentTitle}>
            {editorVideoTitle}&nbsp;
            <EditPencilIcon />
          </h1>
        </WaymarkButton>
      )}
    </FadeSwitchTransition>
  );
}
