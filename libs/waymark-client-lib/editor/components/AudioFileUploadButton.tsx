// Vendor
import _ from 'lodash';
import { useCallback, useState } from 'react';
import fileSize from 'filesize';
import { useSelector } from 'react-redux';

// Editor
import {
  ACCEPTED_AUDIO_MIME_TYPES,
  editorAudioConfigurationPaths,
  MAX_AUDIO_FILES_TO_UPLOAD,
  MAX_AUDIO_FILE_SIZE_BITES,
  waymarkAPSPluginType,
} from 'editor/constants/EditorAudio.js';
import { EditorFileUploadError } from 'editor/utils/editorFileUpload';
import { useEditorFieldsOfType } from 'editor/providers/EditorFormDescriptionProvider.js';
import { VideoEditingFieldTypes } from 'editor/constants/Editor';
import EditorFileUploadErrorModal from 'editor/components/EditorFileUploadErrorModal';
import { useAudioControlsContext } from 'editor/providers/EditorAudioControlsProvider.js';

// Shared
import FileBrowserUploadButton from 'shared/components/FileBrowserUploadButton';
import audioProcessingService from 'shared/services/AudioProcessingService';

import { createAccountAudioAsset } from 'shared/api/index.js';

// WAYMARK APP DEPENDENCIES
import * as selectors from 'app/state/selectors/index.js';
import { AudioSources } from 'app/models/accountAudioAssets/types';

// Styles
import { coolGrayColor } from 'styles/themes/waymark/colors.js';

/**
 * Takes a list of files which the user is trying to upload and ensures they're valid,
 * throwing an EditorFileUploadError if any of them are not
 *
 * @param {File[]} files
 */
const validateFiles = (files: File[] = []) => {
  // Make sure they didn't try to upload too many files at once
  if (files.length > MAX_AUDIO_FILES_TO_UPLOAD) {
    throw new EditorFileUploadError(
      'Too many files',
      `Please upload no more than ${MAX_AUDIO_FILES_TO_UPLOAD} file${
        MAX_AUDIO_FILES_TO_UPLOAD > 1 ? 's' : ''
      } at a time.`,
    );
  }

  // Make sure the file(s) aren't too big
  if (MAX_AUDIO_FILE_SIZE_BITES) {
    const filesWithInvalidFileSize = files.filter((file) => file.size > MAX_AUDIO_FILE_SIZE_BITES);

    // If one or more of our files is too big, show an error message
    if (filesWithInvalidFileSize.length > 0) {
      let errorMessageBodyIntro;

      if (filesWithInvalidFileSize.length === files.length) {
        errorMessageBodyIntro = 'The';
      } else if (filesWithInvalidFileSize.length === 1) {
        errorMessageBodyIntro = 'One of the';
      } else {
        errorMessageBodyIntro = 'Some of the';
      }

      throw new EditorFileUploadError(
        'File too large',
        `${errorMessageBodyIntro} file${files.length > 1 ? 's' : ''} you uploaded ${
          filesWithInvalidFileSize.length > 1 ? 'are' : 'is'
        } too large. Please only use files up to ${fileSize(MAX_AUDIO_FILE_SIZE_BITES, {
          round: 0,
          base: 10,
        })}`,
      );
    }
  }
};

interface AudioAssetUploadButtonProps {
  // Class name for the file browser upload button
  className?: string;
  // Callback called when the user has successfully uploaded a file with this button
  onUploadComplete?: () => void;
  // Callback called when the user has started uploading a file with this button
  onUploadStart?: () => void;
  // Content to display within the button
  children: React.ReactNode;
  // Disables the button
  isDisabled?: boolean;
}

/** A button component that allows a single audio file to be uploaded */
export default function AudioAssetUploadButton({
  className = '',
  onUploadComplete = undefined,
  onUploadStart = undefined,
  children,
  isDisabled = false,
}: AudioAssetUploadButtonProps) {
  const accountGUID = useSelector(selectors.getAccountGUID);
  const serviceAccessToken = useSelector(selectors.getServiceAccessToken);

  const audioField = useEditorFieldsOfType(VideoEditingFieldTypes.audio);
  const { useCurrentConfigurationValue, useUpdateConfigurationValue } = audioField;

  const currentConfigurationValue = useCurrentConfigurationValue(
    editorAudioConfigurationPaths.auxiliaryAudio,
  );
  const updateConfigurationValue = useUpdateConfigurationValue();

  const { masterVolumeChanges } = useAudioControlsContext();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<EditorFileUploadError>();
  const [shouldShowErrorModal, setShouldShowErrorModal] = useState(false);

  /**
   * Takes a File, validates it, uploads it through the audio processing service, and then
   * applies it to the configuration
   *
   * @param {File} audioFile
   */
  const uploadAudioFile = useCallback(
    async (audioFile: File) => {
      try {
        setIsUploading(true);
        onUploadStart?.();

        const { sourceKey, duration } = await audioProcessingService.processAudioFile(
          audioFile,
          serviceAccessToken,
        );

        const displayName = audioFile.name.substring(0, audioFile.name.lastIndexOf('.'));

        // Create an AccountAudioAsset record in the DB for this uploaded asset
        await createAccountAudioAsset(accountGUID, sourceKey, {
          // Extract a display name from the file name
          displayName,
          duration,
          source: AudioSources.Upload,
        });

        // Now that the asset has been successfully uploaded and stored in the DB, let's
        // apply the new audio asset to the configuration's auxiliary audio
        updateConfigurationValue(
          {
            content: {
              type: 'audio',
              location: {
                plugin: waymarkAPSPluginType,
                sourceAudio: sourceKey,
              },
            },
            isMuted: _.get(currentConfigurationValue, 'isMuted', false),
            volume: _.get(currentConfigurationValue, 'volume', 1),
            volumeChanges: _.get(currentConfigurationValue, 'volumeChanges', masterVolumeChanges),
          },
          editorAudioConfigurationPaths.auxiliaryAudio,
        );

        onUploadComplete?.();
        setIsUploading(false);
      } catch (err) {
        setIsUploading(false);
        // Re-throw any errors that occur during the upload process
        throw err as Error;
      }
    },
    [
      accountGUID,
      currentConfigurationValue,
      masterVolumeChanges,
      onUploadStart,
      onUploadComplete,
      serviceAccessToken,
      updateConfigurationValue,
    ],
  );

  return (
    <>
      <FileBrowserUploadButton
        isDisabled={isDisabled}
        isLoading={isUploading}
        onUploadFiles={(files) => {
          try {
            validateFiles(files);
            uploadAudioFile(files[0]);
          } catch (error) {
            if (error instanceof EditorFileUploadError) {
              setUploadErrorMessage(error);
            } else {
              setUploadErrorMessage(
                new EditorFileUploadError(
                  'Sorry, something went wrong',
                  'An error occurred while attempting to upload your files. Please try again later or try using different files.',
                ),
              );
              console.error('An error occurred while attempting to upload files', error);
            }
            setShouldShowErrorModal(true);
          }
        }}
        acceptedMimeTypes={ACCEPTED_AUDIO_MIME_TYPES}
        className={className}
        dotLoaderColor={coolGrayColor}
        colorTheme="Secondary"
      >
        {children}
      </FileBrowserUploadButton>
      <EditorFileUploadErrorModal
        title={uploadErrorMessage ? uploadErrorMessage.heading : ''}
        errorMessage={uploadErrorMessage ? uploadErrorMessage.body : ''}
        isVisible={shouldShowErrorModal}
        onCloseModal={() => setShouldShowErrorModal(false)}
      />
    </>
  );
}
