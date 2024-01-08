import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
// Importing pixi just for the DisplayObject type
import { DisplayObject } from 'pixi.js';

import useEvent from 'shared/hooks/useEvent';
import { layerTypes } from 'shared/WaymarkAuthorWebRenderer';

import {
  useIsConfiguratorSetup,
  useVideoTemplateConfigurator,
} from '../providers/VideoTemplateConfiguratorProvider';
import { TextLayer } from '@libs/shared-types/src/videoDescriptor/layers';

interface RendererTextLayer extends DisplayObject {
  renderedTextStyle?: {
    fontSize: number;
    lineHeight: number;
    fill?: string;
    stroke?: string;
  };
}

// TODO: Move this to a shared location eventually
const rgbArrayToHexString = (rgbArray: number[]) => {
  return rgbArray
    .map((value) => {
      const hex = (value * 255).toString(16).split('.')[0];
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('');
};

// Hook to get "all" colors from the layers of a template
// Right now this is text fill, text stroke, and layer solid colors
export const useAllTemplateColors = () => {
  const configurator = useVideoTemplateConfigurator();
  const isConfiguratorSetup = useIsConfiguratorSetup();

  return useMemo(() => {
    if (!configurator || !isConfiguratorSetup) {
      return new Set<string>();
    }

    const colorHexSet = new Set<string>();
    const { layersExtendedAttributes } = configurator.templateManifest;

    const addToColorSet = (color: string) => {
      colorHexSet.add(color.toUpperCase());
    };

    for (const [layerUuid, layerEditiability] of Object.entries(
      layersExtendedAttributes as Record<string, any>,
    )) {
      if (layerEditiability.fillColor) {
        const layerData = configurator.renderer.findLayer(layerUuid) as any;

        // Solid fill color
        if (layerData['sc']) {
          addToColorSet(layerData['sc']);
        }

        if (layerData['ty'] === layerTypes.text) {
          const textPropertyKeyframes = layerData['t']['d']['k'] as any[];
          textPropertyKeyframes.forEach((textPropertyKeyframe: any) => {
            if (_.isObject(textPropertyKeyframe as any)) {
              // Text fill color
              const textFillColor = textPropertyKeyframe['s']['fc'];
              if (Array.isArray(textFillColor)) {
                const hexString = rgbArrayToHexString(textFillColor);
                addToColorSet(hexString);
              }

              // Text stroke color
              const textStrokeColor = textPropertyKeyframe['s']['sc'];
              if (Array.isArray(textStrokeColor)) {
                const hexString = rgbArrayToHexString(textStrokeColor);
                addToColorSet(hexString);
              }
            }
          });
        }
      }
    }

    return colorHexSet;
  }, [configurator, isConfiguratorSetup]);
};

/**
 * Takes an editing field key for a text field and a getter callback which can be used
 * to extract values from the manifest and/or renderer layers for that field.
 *
 * NOTE: { manifestLayers, rendererLayers } will contain more than one layer in their arrays
 * if the editingFieldKey is associate with an override.
 *
 * Note that this hook must only be used in a component which is nested inside a <VideoTemplateConfiguratorProvider>
 */
export const useTextFieldLayerValue = <TValue>(
  editingFieldKey: string,
  getValue: ({
    manifestLayers,
    rendererLayers,
    layerEditiabilityInfo,
  }: {
    manifestLayers: TextLayer[];
    rendererLayers: RendererTextLayer[];
    layerEditiabilityInfo: any;
  }) => TValue,
) => {
  const configurator = useVideoTemplateConfigurator();
  const isConfiguratorSetup = useIsConfiguratorSetup();

  const layers = useMemo(() => {
    const manifestLayers: any[] = [];
    const rendererLayers: any[] = [];
    // Keeping track of the layer editability info for the layer we're editing, so we know which changes to apply later
    let layerEditiabilityInfo = {};

    if (configurator && isConfiguratorSetup) {
      const collectedLayerUuids = [];

      for (const [layerUuid, layerEditiability] of Object.entries(
        configurator.templateManifest.layersExtendedAttributes as Record<string, any>,
      )) {
        // If this key is equal to the uuid in layersExtendedAttributes *or*
        // the key is equal to an override this layer's editability points to, then
        // add the display object to the list of display objects to outline.
        if (
          layerUuid === editingFieldKey ||
          layerEditiability?.content?.override === editingFieldKey
        ) {
          collectedLayerUuids.push(layerUuid);
          layerEditiabilityInfo = layerEditiability;
        }
      }

      for (const layerUuid of collectedLayerUuids) {
        manifestLayers.push(configurator.renderer.findLayer(layerUuid));
      }

      for (const layerUuid of collectedLayerUuids) {
        rendererLayers.push(configurator.renderer.findLayerObject(layerUuid));
      }
    }

    return {
      manifestLayers,
      rendererLayers,
      layerEditiabilityInfo,
    };
  }, [configurator, editingFieldKey, isConfiguratorSetup]);

  const [value, setValue] = useState<TValue>(() => getValue(layers));

  const stableGetValue = useEvent(getValue);

  useEffect(() => {
    if (!configurator || !isConfiguratorSetup) {
      return;
    }

    const onApplyChange = () => {
      setValue((currentValue) => {
        const newValue = stableGetValue(layers);
        if (_.isEqual(currentValue, newValue)) {
          return currentValue;
        }

        return newValue;
      });
    };

    // Run once up front to make sure our state is in sync
    onApplyChange();

    configurator.renderer.on('applyChange:end', onApplyChange);
    configurator.renderer.on('applyChangeList:end', onApplyChange);

    return () => {
      configurator.renderer.off('applyChange:end', onApplyChange);
      configurator.renderer.off('applyChangeList:end', onApplyChange);
    };
  }, [configurator, isConfiguratorSetup, layers, stableGetValue]);

  return value;
};
