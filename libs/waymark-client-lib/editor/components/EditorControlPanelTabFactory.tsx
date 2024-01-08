// Vendor
import { useCallback } from 'react';

import { css } from '@emotion/css';

// Editor
import { useEditorPanelDispatch, useEditorPanelState } from 'editor/providers/EditorPanelProvider';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';

// libs
import { themeVars, dropShadows } from '@libs/shared-ui-styles';

export interface PanelTabMode<TTabName extends string> {
  /**
   * Display name for the tab
   */
  name: TTabName;
  /**
   * React component to render in the panel when the tab is selected
   */
  component: (props: any) => React.ReactElement;
}

/**
 * Component factory takes an array of PanelTabMode objects and returns components for the provider
 * and row of buttons to display in the control panel
 *
 * @param {PanelTabMode[]} panelTabModes
 */
export default function makeEditorControlPanelTabs<TTabName extends string>(
  panelTabModes: PanelTabMode<TTabName>[],
) {
  /**
   * Hook returns the currently selected tab set in the panel context
   *
   * @returns {PanelTabMode}
   */
  const useCurrentTab = (): PanelTabMode<TTabName> => {
    const {
      currentPanel: { localContext },
    } = useEditorPanelState();

    // If there's no tab set in the panel context, just return the first tab
    return (localContext?.tab as PanelTabMode<TTabName>) || panelTabModes[0];
  };

  /**
   * Hook returns a function which takes a PanelTabMode and updates the panel context
   * to have that tab selected
   *
   * @returns {function}
   */
  const useSetCurrentTab = () => {
    const { updateControlPanelLocalContext } = useEditorPanelDispatch();

    const setCurrentTab = useCallback(
      (newTab: PanelTabMode<TTabName>) => updateControlPanelLocalContext({ tab: newTab }),
      [updateControlPanelLocalContext],
    );

    return setCurrentTab;
  };

  /**
   * Renders a row of buttons for each panel tab which the user can click to change the currently selected tab
   */
  const EditorPanelTabButtons = () => {
    const { name: currentTabName } = useCurrentTab();
    const setCurrentTab = useSetCurrentTab();

    return (
      <div
        className={css`
          display: flex;
          width: 100%;
          background-color: ${themeVars.color.surface._16};
          padding: 4px;
          border-radius: 12px;
        `}
      >
        {panelTabModes.map((tabMode) => {
          const isSelected = currentTabName === tabMode.name;

          return (
            <WaymarkButton
              typography="button"
              className={css`
                /* Override default Button styles */
                padding: 8px !important;
                border-radius: 12px !important;
                margin-left: 4px;
                flex: 1;
                height: 48px;

                &:first-child {
                  margin-left: 0;
                }

                &[data-isselected='true'] {
                  box-shadow: ${dropShadows.medium};
                }
              `}
              key={tabMode.name}
              colorTheme={isSelected ? 'SelectedTab' : 'UnselectedTab'}
              onClick={() => setCurrentTab(tabMode)}
              data-isselected={isSelected}
            >
              {tabMode.name}
            </WaymarkButton>
          );
        })}
      </div>
    );
  };

  return {
    EditorPanelTabButtons,
    useCurrentTab,
    useSetCurrentTab,
  };
}
