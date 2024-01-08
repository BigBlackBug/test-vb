import { css } from '@emotion/css';
import { useRef } from 'react';

import { WaymarkButton, WaymarkButtonProps } from './WaymarkButton';

export interface FileBrowserUploadButtonProps extends Omit<WaymarkButtonProps, 'onClick'> {
  /** Callback for when the files to upload are selected */
  onUploadFiles: (files: File[]) => void;
  /** File types accepted to be uploaded */
  acceptedMimeTypes: string[];
  /** Whether or not this component should allow the user to select more than one file */
  shouldAcceptMultipleFiles?: boolean;
  /** The color theme to apply to the button
   *
   * @defaultValue 'Upload'
   */
  colorTheme?: WaymarkButtonProps['colorTheme'];
}

/** A component that creates a generic file browser button which selects files to be uploaded */
export default function FileBrowserUploadButton({
  onUploadFiles,
  acceptedMimeTypes,
  shouldAcceptMultipleFiles = false,
  colorTheme = 'Upload',
  ...props
}: FileBrowserUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={shouldAcceptMultipleFiles}
        accept={acceptedMimeTypes.join(',')}
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          event.target.files = null;
          // Reset the value of the input so that the user can upload the same file again
          event.target.value = '';
          onUploadFiles(files);
        }}
        className={css`
          display: none;
        `}
      />
      <WaymarkButton
        onClick={() => {
          fileInputRef.current?.click();
        }}
        colorTheme={colorTheme}
        {...props}
      />
    </>
  );
}
