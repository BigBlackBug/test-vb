// Vendor
import { memo, useState, useCallback } from 'react';

// Editor
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';
import { useEditorDispatch } from 'editor/providers/EditorStateProvider.js';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';

/* APP DEPENDENCIES */
import VideoShareModal from 'app/components/VideoShareModal/VideoShareModal';
import { useAppThemeConfig } from 'app/state/appThemeStore';
import EditorCompleteVideoConfirmationModal from './EditorCompleteVideoConfirmationModal';
import { useEditorVideoContext } from 'editor/providers/EditorVideoProvider';
import { useIsSDKSession } from 'app/providers/SDKSessionProvider';
/* APP DEPENDENCIES */

interface EditorCompleteVideoButtonProps {
  isPurchased?: boolean;
}

/**
 * Renders "done" button which will fire a `videoCompleted` editor event.
 * For Waymark, this opens the checkout flow for purchasing the video currently being edited (see WaymarkEditPage.js)
 * For the SDK, this marks the video as purchased and sends a `videoCompleted` event along to the SDK (see SDKEditPage.tsx)
 */
const EditorCompleteVideoButton = ({ isPurchased = false }: EditorCompleteVideoButtonProps) => {
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  const appThemeConfig = useAppThemeConfig();

  // Get the config for the confirmation modal
  const completeVideoConfirmationModalConfig =
    appThemeConfig.editor.labels.completeVideoConfirmation;

  const shouldShowConfirmationModal = completeVideoConfirmationModalConfig.shouldShow;

  const { saveDraft } = useEditorDispatch();
  const { editorUserVideo } = useEditorVideoContext();

  const isSDKSession = useIsSDKSession();

  // Save the video and then emit a
  const onCompleteVideo = useCallback(async () => {
    setIsLoadingCheckout(true);

    try {
      if (isSDKSession) {
        // Perform one final save, marking it as a "final save" so it'll kick off re-renders
        // for already-purchased videos
        const userVideo = await saveDraft(true);
        editorEventEmitter.emit('videoCompleted', userVideo);
      } else {
        await saveDraft();
        setIsShareModalVisible(true);
      }
    } catch (err) {
      // If an error was thrown for some other reason, that's not expected
      // so let's log it!
      const errorMessage = `An error occurred while attempting to complete the video: ${JSON.stringify(
        err,
        null,
        2,
      )}`;

      editorEventEmitter.emit('error', errorMessage);
      console.error(errorMessage);
      setIsLoadingCheckout(false);
    }

    setIsLoadingCheckout(false);
  }, [saveDraft, isSDKSession]);

  return (
    <>
      <WaymarkButton
        onClick={() => {
          if (shouldShowConfirmationModal) {
            setIsConfirmationModalVisible(true);
          } else {
            onCompleteVideo();
          }
        }}
        isLoading={isLoadingCheckout}
        analyticsAction={isPurchased ? 'selected_finish_close_editor' : 'selected_finish_checkout'}
        colorTheme="Primary"
        isSmall
        data-testid="editorPurchaseButton"
      >
        {isSDKSession ? 'Finish' : 'Share'}
      </WaymarkButton>
      {editorUserVideo ? (
        <VideoShareModal
          isVisible={isShareModalVisible}
          onCloseModal={() => setIsShareModalVisible(false)}
          userVideo={{ title: editorUserVideo.videoTitle, guid: editorUserVideo.guid }}
        />
      ) : null}
      {shouldShowConfirmationModal ? (
        <EditorCompleteVideoConfirmationModal
          isVisible={isConfirmationModalVisible}
          onCloseModal={() => setIsConfirmationModalVisible(false)}
          onCompleteVideo={onCompleteVideo}
          title={completeVideoConfirmationModalConfig.title}
          bodyText={completeVideoConfirmationModalConfig.body}
          confirmButtonText={completeVideoConfirmationModalConfig.confirmButton}
          cancelInterface="text"
          cancelButtonText={completeVideoConfirmationModalConfig.cancelButton}
        />
      ) : null}
    </>
  );
};

// Memoizing because the only props are frequently shallowly equal between re-renders
export default memo(EditorCompleteVideoButton);
