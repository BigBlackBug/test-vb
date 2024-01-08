// Vendor
import { WAYMARK_AUTHOR_PREVIEW_SLUG } from 'editor/constants/Editor';
import HeaderButtonRow from 'editor/components/EditorControlPanelHeaderButtonRow.js';
import EditorExitButton from 'editor/components/EditorExitButton';
import EditorSaveDraftButton from 'editor/components/EditorSaveDraftButton.js';
import EditorCompleteVideoButton from 'editor/components/EditorCompleteVideoButton';
import { useEditorVideoContext } from 'editor/providers/EditorVideoProvider.js';

import { extraPanelButtons } from './PanelHeader.css';
import { utilityClasses } from '@libs/shared-ui-styles/src';

/**
 * Header for editor main controls - has buy and save draft buttons and the back button closes the editor
 */
export default function MainPanelHeader() {
  const { editorVariant, editorUserVideo, isEditableTemplate } = useEditorVideoContext();

  const isAuthorPublishPreview = editorVariant.slug === WAYMARK_AUTHOR_PREVIEW_SLUG;

  // Hide the complete button if we're in the author preview or if the video has already been purchased
  const shouldHideCompleteButton = isAuthorPublishPreview;

  // Hide the save button if we're in the author preview or if the template is not editable
  const shouldHideSaveDraftButton = isAuthorPublishPreview || !isEditableTemplate;

  return (
    <HeaderButtonRow>
      <EditorExitButton isDisabled={isAuthorPublishPreview} />
      <span className={extraPanelButtons}>
        {!shouldHideSaveDraftButton ? (
          <EditorSaveDraftButton className={utilityClasses.flexCenter} />
        ) : null}
        {!shouldHideCompleteButton ? (
          <EditorCompleteVideoButton isPurchased={editorUserVideo?.isPurchased} />
        ) : null}
      </span>
    </HeaderButtonRow>
  );
}
