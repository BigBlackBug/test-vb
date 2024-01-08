import { Fragment } from 'react';

export interface PanelContextProps {
  localPanelContext: Record<string, unknown> | null;
  sharedPanelContext: Record<string, unknown> | null;
}

export interface ControlsComponentProps extends PanelContextProps {
  scrollEditorPanelToTop: () => void;
}

/**
 * Constructs an object with as standardized set of components for an editor control panel which can be registered at `editor/constants/EditorControlPanels.ts`.
 * These components are rendered in the `editor/components/EditorControlPanel.tsx` component.
 *
 * @param {React.ComponentType} Header - A react component which renders the header contents at the top of the control panel
 * @param {React.ComponentType} Controls - A react component which renders the main contents of the control panel
 * @param {React.ComponentType} [Provider] - An optional provider component which wraps the Header and Controls components to provide panel-specific shared context
 */
export default function makeEditorControlPanel(
  Header: React.ComponentType<PanelContextProps>,
  Controls: React.ComponentType<ControlsComponentProps>,
  Provider: React.ComponentType = Fragment,
) {
  if (!Header || !Controls) {
    console.error('A Header and Controls component are required for all editor control panels');
  }

  return {
    Header,
    Controls,
    Provider,
  };
}

/**
 * Type for a set of components for an editor control panel which can be registered at `editor/constants/EditorControlPanels.ts`
 */
export type EditorControlPanelComponents = ReturnType<typeof makeEditorControlPanel>;
