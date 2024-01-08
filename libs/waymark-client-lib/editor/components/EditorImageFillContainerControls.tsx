// Vendor
import { useCallback } from 'react';

// Editor
import { ImageModifications } from 'editor/constants/EditorImage.js';
import EditorControlsSlider from 'editor/components/EditorControlsSlider';

import * as styles from './EditorImageFillContainerControls.css';

interface EditorImageFillContainerControlsProps {
  useCurrentImageModificationsValue: (path: string) => number;
  updateImageModifications: (newValue: number, path: string) => void;
}

export default function EditorImageFillContainerControls({
  useCurrentImageModificationsValue,
  updateImageModifications,
}: EditorImageFillContainerControlsProps) {
  // Get the current zoom image modifications
  const currentZoomValue = useCurrentImageModificationsValue(ImageModifications.zoomZ.path) || 1;

  // Using a callback to avoid messing up the debounced onChange
  const onChangeZoom = useCallback(
    (newZoomAmount) => updateImageModifications(newZoomAmount, ImageModifications.zoomZ.path),
    [updateImageModifications],
  );

  return (
    <EditorControlsSlider
      initialSliderValue={currentZoomValue}
      label="Zoom"
      min={1}
      max={5}
      step={0.05}
      onChange={onChangeZoom}
      onChangeDebounceTime={300}
      className={styles.SliderControl}
    />
  );
}
