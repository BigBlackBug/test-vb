import { useEffect, useMemo, useState } from 'react';

// Shared
import { useAllTemplateColors, useTextFieldLayerValue } from 'shared/web_video/hooks/layers';
import {
  useIsConfiguratorSetup,
  useVideoTemplateConfigurator,
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import useThrottle from 'shared/hooks/useThrottle';
import { safeLocalStorage } from 'shared/utils/safeStorage';

// App
import { AddIcon, SubtractIcon } from 'app/icons/BasicIcons';
import Color from 'app/models/colorLibraries/Color';

// Editor
import { useEditorState } from 'editor/providers/EditorStateProvider';
import { useColorLibrariesForBusiness } from 'app/models/colorLibraries/hooks';
import ColorLibraryListItem from 'editor/components/ColorLibraryListItem';
import AddColorToColorLibraryButton from 'editor/components/AddColorToColorLibraryButton';

import * as styles from './TextStyleEditor.css';

interface TextStyleEditorProps {
  /**
   * The key of the field we're editing
   */
  editingFieldKey: string;
}

/**
 * UI for editing a text field's styles such as font size and color
 */
export const TextStyleEditor = ({ editingFieldKey }: TextStyleEditorProps) => {
  const [isTextColorEditable, setIsTextColorEditable] = useState<boolean>(false);

  const { currentFontSize, currentLineHeight, currentFillColor, layerUuids, editableLayerKeys } =
    useTextFieldLayerValue(
      editingFieldKey,
      ({ manifestLayers, rendererLayers, layerEditiabilityInfo }) => {
        const renderedTextStyle = rendererLayers.length
          ? rendererLayers[0].renderedTextStyle
          : null;

        // Checking which layers are editable, and then setting the editable layer keys
        const editableLayerKeys = Object.keys(layerEditiabilityInfo).filter(
          (layerKey) => layerEditiabilityInfo[layerKey] != null,
        );

        if (
          editableLayerKeys.includes('fillColor') ||
          editableLayerKeys.includes('fillEffect') ||
          editableLayerKeys.includes('strokeColor')
        ) {
          setIsTextColorEditable(true);
        }

        return {
          currentFontSize: renderedTextStyle?.fontSize ?? 0,
          currentLineHeight: renderedTextStyle?.lineHeight ?? 0,
          currentFillColor: renderedTextStyle?.fill ?? null,
          layerUuids: manifestLayers.map((layer) => layer?.meta?.uuid),
          editableLayerKeys,
        };
      },
    );

  // Tracks the current font size displayed in the UI; this does not necessarily reflect the
  // actual current saved font size stored in the manifest because those changes are throttled
  // and we need to be able to display states where the stored number the the input number are disconnected,
  // ie when the user has cleared all text in the input field
  const [displayFontSize, setDisplayFontSize] = useState<string>(() => `${currentFontSize}`);

  useEffect(() => {
    setDisplayFontSize(`${currentFontSize}`);
  }, [currentFontSize]);

  const configurator = useVideoTemplateConfigurator();
  const isConfiguratorSetup = useIsConfiguratorSetup();

  // FONT SIZE
  const changeFontSize = useThrottle((rawNewFontSize: number) => {
    if (!isConfiguratorSetup || !configurator) {
      return;
    }

    // Ensure we don't go below 0
    const newFontSize = Math.max(0, rawNewFontSize);

    setDisplayFontSize(`${newFontSize}`);

    // Calculate a new line height to retain our ratio relative to the new font size
    const newLineHeight = newFontSize * (currentLineHeight / currentFontSize);

    for (const layerUuid of layerUuids) {
      // TODO: We are using the _applyChange here because the renderer currently uses JSDoc aliases
      // which TypeScript doesn't recognize. Solve this by converting WaymarkAuthorWebRenderer.js to TypeScript.
      configurator.renderer._applyChange('FONT_PROPERTY', {
        layer: layerUuid,
        fontSize: newFontSize,
        lineHeight: newLineHeight,
        resizingStrategy: 'default',
      });
    }
  }, 300);

  // FONT COLOR
  const changeFontColor = useThrottle((newFillColor: string) => {
    if (!configurator || !isConfiguratorSetup) {
      return;
    }

    for (const layerUuid of layerUuids) {
      if (editableLayerKeys.includes('fillColor')) {
        configurator.renderer._applyChange('TEXT_FILL_COLOR', {
          layer: layerUuid,
          color: Number(newFillColor.replace('#', '0x')),
          isImportant: true,
        });
      }

      if (editableLayerKeys.includes('fillEffect')) {
        configurator.renderer._applyChange('EFFECT_FILL_COLOR', {
          layer: layerUuid,
          color: Number(newFillColor.replace('#', '0x')),
          isImportant: true,
        });
      }

      if (editableLayerKeys.includes('strokeColor')) {
        configurator.renderer._applyChange('TEXT_STROKE_COLOR', {
          layer: layerUuid,
          color: Number(newFillColor.replace('#', '0x')),
          isImportant: true,
        });
      }
    }
  }, 300);

  const { appliedBusinessDetails } = useEditorState();
  // Finding all of the color libraries for the business, if one is applied
  const { businessColorLibraries } = useColorLibrariesForBusiness(
    appliedBusinessDetails?.guid ?? null,
  );

  // Finding all of the text fill, text stroke, and solid fill colors used in the template
  const templateColors = useAllTemplateColors();

  // Colors we temporarily track as a user adds them. They will only persist on reload if a user ends up applying them to an element in the video.
  const [userAddedColors, setUserAddedColors] = useState<string[]>([]);

  // Effect on mount to load the list of the last 4 manually added colors from local storage
  useEffect(() => {
    const recentColorsString = safeLocalStorage.getItem('recentColors');

    const recentColors: string[] = recentColorsString
      ? JSON.parse(recentColorsString).slice(-4)
      : [];
    if (recentColors) {
      setUserAddedColors(recentColors);

      safeLocalStorage.setItem('recentColors', JSON.stringify(recentColors));
    }
  }, []);

  // Assembling the list of available colors for the text color picker
  const availableColors: Color[] = useMemo(() => {
    // Add the business's color libraries to the list of temporary colors, and update their updatedAt property for sorting later
    let temporaryColors: Color[] = businessColorLibraries
      .flatMap((library) => library.assets)
      .map((asset) => {
        return new Color({
          hexCode: asset.hexCode,
          displayName: asset.displayName,
          order: asset.order,
          updatedAt: new Date().toUTCString(),
        });
      });

    // Collecting the template colors as well as the user added colors, sorting them together as a group, and adding them to the list of available colors
    const userAddedAndTemplateColors: string[] = [];

    if (templateColors.size > 0) {
      Array.from(templateColors)
        .sort()
        .forEach((color) => {
          userAddedAndTemplateColors.push(color);
        });
    }

    if (userAddedColors.length) {
      userAddedAndTemplateColors.push(...userAddedColors);
    }

    temporaryColors = [
      ...temporaryColors,
      ...userAddedAndTemplateColors.sort().map(
        (hexCode: string) =>
          new Color({
            hexCode: `${hexCode[0] === '#' ? '' : '#'}${hexCode}`,
            displayName: `${hexCode[0] === '#' ? '' : '#'}${hexCode}`,
            order: 0,
            updatedAt: new Date().toUTCString(),
          }),
      ),
    ];

    // Finally, we add black and white to the beginning of the list
    temporaryColors = [
      new Color({
        hexCode: '#000000',
        displayName: 'Black',
        order: 0,
        updatedAt: new Date().toUTCString(),
      }),
      new Color({
        hexCode: '#FFFFFF',
        displayName: 'White',
        order: 1,
        updatedAt: new Date().toUTCString(),
      }),
      ...temporaryColors,
    ];

    // Making sure the final list of colors is unique only via the hexCode property- all other properties can be different.
    const uniqueColors: Color[] = [];
    const uniqueHexCodes: string[] = [];
    for (const color of temporaryColors) {
      if (!uniqueHexCodes.includes(color.hexCode.toUpperCase())) {
        uniqueColors.push(color);
        uniqueHexCodes.push(color.hexCode.toUpperCase());
      }
    }

    return uniqueColors;
  }, [businessColorLibraries, templateColors, userAddedColors]);

  return (
    <div className={styles.TextStyleEditingSection}>
      {/* FONT SIZE */}
      <div className={styles.FontSizeControls}>
        <WaymarkButton
          title="Decrease Font Size"
          onClick={() => {
            changeFontSize(parseInt(displayFontSize, 10) - 10);
          }}
          className={styles.FontSizeStepperButton}
          colorTheme="Secondary"
        >
          <SubtractIcon />
        </WaymarkButton>
        <input
          aria-label="Font Size"
          type="number"
          value={displayFontSize}
          onChange={(event) => {
            if (event.currentTarget.value) {
              changeFontSize(parseInt(event.currentTarget.value, 10));
            } else {
              setDisplayFontSize(event.currentTarget.value);
            }
          }}
          className={styles.FontSizeInput}
        />
        <WaymarkButton
          title="Increase Font Size"
          onClick={() => {
            changeFontSize(parseInt(displayFontSize, 10) + 10);
          }}
          className={styles.FontSizeStepperButton}
          colorTheme="Secondary"
        >
          <AddIcon />
        </WaymarkButton>
      </div>
      {/* TEXT COLOR */}
      {isTextColorEditable && (
        <div className={styles.TextColorSection}>
          <div className={styles.ColorLibrary}>
            {availableColors.map((color) => {
              const { hexCode } = color;

              return (
                <div className={styles.ColorListItem} key={hexCode}>
                  <ColorLibraryListItem
                    hexCode={hexCode}
                    displayName={color.displayName || hexCode}
                    onSelectLibraryColor={(hexCode) => {
                      changeFontColor(hexCode);
                    }}
                    isSelected={currentFillColor?.toUpperCase() === hexCode.toUpperCase()}
                  />
                </div>
              );
            })}
            <AddColorToColorLibraryButton
              className={styles.AddColorButton}
              onSelectLibraryColor={(hexCode) => {
                changeFontColor(hexCode);
                setUserAddedColors((currentUserAddedColors) => [
                  ...currentUserAddedColors,
                  hexCode,
                ]);

                const recentColorsString = safeLocalStorage.getItem('recentColors');

                // Add this color to local storage
                const recentColors = recentColorsString ? JSON.parse(recentColorsString) : [];
                recentColors.push(hexCode);
                safeLocalStorage.setItem('recentColors', JSON.stringify(recentColors));
              }}
              defaultHexCode={currentFillColor}
            />
          </div>
        </div>
      )}
    </div>
  );
};
