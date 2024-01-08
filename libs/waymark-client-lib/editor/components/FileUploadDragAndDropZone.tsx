// Vendor
import { useEffect, useMemo, useState } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

// Shared
import Portal from 'shared/components/Portal.js';

import * as styles from './FileUploadDragAndDropZone.css';

interface FileUploadDragAndDropZoneProps {
  // Takes an array of validated files and uploads them
  validateAndUploadFiles: (files: File[]) => void;
  // The ID of the element that the drop zone modal should be rendered as a child of
  dropZoneTargetId: string;
}

/**
 * Renders a button which provides users with a UI for uploading files.
 * It will open the system's file browser when clicked, or will show a drop zone modal covering the editor panel if the user drags a file into the window.
 */
export default function FileUploadDragAndDropZone({
  validateAndUploadFiles,
  dropZoneTargetId,
}: FileUploadDragAndDropZoneProps) {
  const [{ canDropFilesOnTarget, isDraggingFiles }, dropZoneRef] = useDrop({
    // Only track when files are dragged
    accept: NativeTypes.FILE,
    // Collect is called on each render and allows us to derive/expose state from react-dnd's monitor state
    // The object returned by this function is what will be returned as the first item in the array returned by this `useDrop` hook
    collect: (monitor) => {
      const draggingItem = monitor.getItem();

      return {
        // We can drop files on the target if the user has dragged something over the target zone
        canDropFilesOnTarget: monitor.isOver(),
        // If draggingItem is not null, we know that files are being dragged. Inconsistencies between browsers
        // means that draggingItem.items can be empty in Safari and Chrome even when files are being dragged,
        // so we have to make this distinction rather than just checking if the number of files being dragged is > 0.
        isDraggingFiles: Boolean(draggingItem),
      };
    },
    // When the user drops files over the drop zone, upload them
    // Due to the way types are setup in react-dnd, we have to use `any` here
    drop: (item: any) => {
      validateAndUploadFiles(item.files);
    },
  });

  // Get the container element which we want to render the drop zone modal as a direct child of
  // This is necessary so that we can cleanly guarantee that the drop zone modal will be able to fully cover the contents we want it to
  // without needing to fight with weird CSS hacks or manually measuring elements
  const [portalContainerElement, setPortalContainerElement] = useState<HTMLElement | null>(() =>
    document.getElementById(dropZoneTargetId),
  );

  useEffect(() => {
    setPortalContainerElement(document.getElementById(dropZoneTargetId));
  }, [dropZoneTargetId]);

  return portalContainerElement ? (
    <Portal container={portalContainerElement}>
      <div
        className={styles.DropZoneModal}
        {...styles.dataIsDraggingFiles(isDraggingFiles)}
        ref={dropZoneRef}
      >
        <div
          className={styles.DropZone}
          // Highlight the drop zone when the user has dragged files on top of the target and can drop them to upload
          {...styles.dataCanDropFiles(canDropFilesOnTarget)}
        >
          <h3 className={styles.DropZoneLabel}>Drop your files here</h3>
        </div>
      </div>
    </Portal>
  ) : null;
}
