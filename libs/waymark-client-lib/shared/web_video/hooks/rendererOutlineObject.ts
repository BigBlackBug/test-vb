import { useEffect, useMemo } from 'react';

import {
  useIsConfiguratorSetup,
  useVideoTemplateConfigurator,
} from '../providers/VideoTemplateConfiguratorProvider';
import {
  createOutlineObject_TEMP,
  removeOutlineObject_TEMP,
} from 'shared/WaymarkAuthorWebRenderer';

/**
 * Takes an editing field key for an editor field and returns functions to create and remove an outline object
 * around the field's display object.
 */
export const useShowRendererOutline = (shouldShowOutline: boolean, editingFieldKey: string) => {
  const configurator = useVideoTemplateConfigurator();
  const isConfiguratorSetup = useIsConfiguratorSetup();

  const displayObjects = useMemo(() => {
    const collectedDisplayObjects = [];
    if (configurator && isConfiguratorSetup) {
      for (const [layerKey, layerEditiability] of Object.entries(
        configurator.templateManifest.layersExtendedAttributes as Record<string, any>,
      )) {
        // If this key is equal to the uuid in layersExtendedAttributes *or*
        // the key is equal to an override this layer's editability points to, then
        // add the display object to the list of display objects to outline.
        if (
          layerKey === editingFieldKey ||
          layerEditiability?.content?.override === editingFieldKey
        ) {
          collectedDisplayObjects.push(configurator.renderer.findLayerObject(layerKey));
        }
      }
    }
    return collectedDisplayObjects;
  }, [configurator, isConfiguratorSetup, editingFieldKey]);

  useEffect(() => {
    if (shouldShowOutline && configurator && isConfiguratorSetup) {
      for (const displayObject of displayObjects) {
        createOutlineObject_TEMP(displayObject, configurator.renderer);
      }
      return () => {
        for (const displayObject of displayObjects) {
          removeOutlineObject_TEMP(displayObject, configurator.renderer);
        }
      };
    }
  }, [configurator, displayObjects, isConfiguratorSetup, shouldShowOutline]);
};
