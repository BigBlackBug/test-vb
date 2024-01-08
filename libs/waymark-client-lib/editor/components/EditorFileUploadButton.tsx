// Vendor
import { useState } from 'react';
import fileSize from 'filesize';
import { css, cx as emotionClassNames } from '@emotion/css';

// Editor
import EditorFileUploadErrorModal from 'editor/components/EditorFileUploadErrorModal';
import { EditorFileUploadError } from 'editor/utils/editorFileUpload';
import FileUploadDragAndDropZone from 'editor/components/FileUploadDragAndDropZone';

// Shared
import FileBrowserUploadButton from 'shared/components/FileBrowserUploadButton';

/* WAYMARK APP DEPENDENCIES */
import { UploadIcon } from 'app/icons/PeopleAndSharingIcons';

/* END WAYMARK APP DEPENDENCIES */

import { darkCoolGrayColor } from 'styles/themes/waymark/colors.js';
import { useTypography } from 'styles/hooks/typography.js';

interface EditorFileUploadButtonProps {
  /** Takes an array of validated files and uploads them */
  onUploadFiles: (files: File[]) => void;
  /** Array of MIME type strings for all file types that we should accept (ie, 'image/jpg') */
  acceptedFileTypes: string[];
  /** Array of more human readable versinos of the file types that we should accept (ie, '.jpg') */
  acceptedFileNames: string[];
  /** The max size in bytes that we should accept for uploaded files before throwing an error; defaults to 200MB */
  maxFileSizeBytes?: number | null;
  /** The max number of files the user can upload at a time */
  maxFileCount?: number | null;
  /** Main text to display on the upload button */
  uploadButtonText?: string | null;
  /** Secondary subtext to display on the upload button */
  uploadButtonSubtext?: string | null;
  /** Styles the upload as a wide rectangle instead of a square */
  isWide?: boolean;
  /** Whether the upload button should also accept uploads via dragging + dropping files onto the editor panel */
  shouldAcceptDragAndDropUploads?: boolean;
  /** The ID of the element that should be used as the drop zone for drag + drop uploads */
  dropZoneTargetId: string;
}

/**
 * Renders a button which provides users with a UI for uploading files.
 * It will open the system's file browser when clicked, or will show a drop zone modal covering the editor panel if the user drags a file into the window.
 */
export default function EditorFileUploadButton({
  onUploadFiles,
  acceptedFileTypes,
  acceptedFileNames,
  // Default max file size is exactly 200MB
  maxFileSizeBytes = 209715200,
  maxFileCount = null,
  uploadButtonText = 'Upload',
  uploadButtonSubtext = null,
  isWide = false,
  shouldAcceptDragAndDropUploads = true,
  dropZoneTargetId,
}: EditorFileUploadButtonProps) {
  const [uploadErrorMessage, setUploadErrorMessage] = useState<EditorFileUploadError>();
  const [shouldShowErrorModal, setShouldShowErrorModal] = useState(false);

  const validateAndUploadFiles = async (files: File[] = []) => {
    try {
      // Find any files that don't match one of our accepted file types
      const filesWithInvalidFileType = files.filter(
        (file) => !acceptedFileTypes.includes(file.type),
      );

      // If we have invalid files, show an error message
      if (filesWithInvalidFileType.length > 0) {
        let errorMessageBodyIntro;

        if (filesWithInvalidFileType.length === files.length) {
          errorMessageBodyIntro = 'The';
        } else if (filesWithInvalidFileType.length === 1) {
          errorMessageBodyIntro = 'One of the';
        } else {
          errorMessageBodyIntro = 'Some of the';
        }

        let acceptedFileNameList;

        if (acceptedFileNames.length > 1) {
          const allFileNamesButLast = acceptedFileNames.slice(0, -1);
          const lastFileName = acceptedFileNames[acceptedFileNames.length - 1];

          acceptedFileNameList = `${allFileNamesButLast.join(', ')}${
            // If there are more than 2 file types, add an oxford comma
            acceptedFileNames.length > 2 ? ',' : ''
          } or ${lastFileName}`;
        } else {
          // eslint-disable-next-line prefer-destructuring
          acceptedFileNameList = acceptedFileNames[0];
        }

        throw new EditorFileUploadError(
          'Invalid file type',
          `${errorMessageBodyIntro} file${files.length > 1 ? 's' : ''} you uploaded ${
            filesWithInvalidFileType.length > 1 ? 'are' : 'is'
          } in a format we do not support. Please only use ${acceptedFileNameList} files.`,
        );
      }

      if (maxFileCount && files.length > maxFileCount) {
        throw new EditorFileUploadError(
          'Too many files',
          `Please upload no more than ${maxFileCount} file${
            maxFileCount > 1 ? 's' : ''
          } at a time.`,
        );
      }

      if (maxFileSizeBytes) {
        const filesWithInvalidFileSize = files.filter((file) => file.size > maxFileSizeBytes);

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
            } too large. Please only use files up to ${fileSize(maxFileSizeBytes, {
              round: 0,
              base: 10,
            })}`,
          );
        }
      }

      // If we have no errors, start uploading the files!
      await onUploadFiles(files);
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
  };

  const [caption2TextStyle, caption3TextStyle, headlineSmallTextStyle] = useTypography([
    'caption2',
    'caption3',
    'headlineSmall',
  ]);

  return (
    <>
      <FileBrowserUploadButton
        className={css`
          padding: 4px !important;
          width: 100%;
        `}
        data-is-wide-upload-button={isWide}
        isUppercase={false}
        acceptedMimeTypes={acceptedFileTypes}
        onUploadFiles={(filesToUpload) => validateAndUploadFiles(filesToUpload)}
        shouldAcceptMultipleFiles={maxFileCount !== null && maxFileCount > 1}
      >
        <div
          className={css`
            /* Create a square aspect ratio container for the upload button's contents */
            padding: 100% 0 0;
            width: 100%;
            position: relative;
            border-radius: 4px;

            [data-is-wide-upload-button='true'] & {
              padding: 0;
            }
          `}
        >
          <div
            className={css`
              /* Fill dimensions of square wrapper */
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 4px;

              display: flex;
              justify-content: center;
              align-items: center;
              flex-direction: column;
              border-radius: 4px;

              [data-is-wide-upload-button='true'] & {
                position: relative;
                padding: 12px;
                justify-content: space-between;
                flex-direction: row;
              }
            `}
          >
            <UploadIcon
              className={css`
                width: 24px;

                [data-is-wide-upload-button='true'] & {
                  width: 20px;
                  order: 1;
                }
              `}
            />
            <p
              className={css`
                ${caption2TextStyle}

                [data-is-wide-upload-button='true'] & {
                  ${headlineSmallTextStyle}
                  font-size: 14px;
                }
              `}
            >
              {uploadButtonText}
            </p>
            {uploadButtonSubtext ? (
              <p
                className={emotionClassNames(
                  caption3TextStyle,
                  css`
                    color: ${darkCoolGrayColor};
                    margin: 4px 0 0;
                  `,
                )}
              >
                {uploadButtonSubtext}
              </p>
            ) : null}
          </div>
        </div>
      </FileBrowserUploadButton>
      {shouldAcceptDragAndDropUploads ? (
        <FileUploadDragAndDropZone
          dropZoneTargetId={dropZoneTargetId}
          validateAndUploadFiles={async (files) => {
            await validateAndUploadFiles(files);
          }}
        />
      ) : null}
      {/* Modal displays error messages if the user tries to upload an invalid file */}
      <EditorFileUploadErrorModal
        title={uploadErrorMessage ? uploadErrorMessage.heading : ''}
        errorMessage={uploadErrorMessage ? uploadErrorMessage.body : ''}
        isVisible={shouldShowErrorModal}
        onCloseModal={() => setShouldShowErrorModal(false)}
      />
    </>
  );
}
