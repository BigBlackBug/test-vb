// Vendor
import _ from 'lodash';
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

// Local
import {
  editorPanelKeys,
  EditorPanelKey,
  scrollableControlsWrapperID,
} from 'editor/constants/Editor';

/* WAYMARK APP DEPENDENCIES */
import { useIsWindowMobile } from 'app/hooks/windowBreakpoint.js';
import { makeIntersectionObserver } from 'app/hooks/element';
/* END WAYMARK APP DEPENDENCIES */

enum EditorPanelActions {
  OpenPanel,
  UpdateLocalPanelContext,
  ClosePanel,
}

export interface PanelContext extends Record<string, unknown> {
  /**
   * If present, indicates the scroll position which the panel was at when the user opened a new panel.
   * This will be used to restore that scroll position when the user navigates back and returns to this panel again.
   */
  scrollPosition?: number;
}

/**
 * @typedef {Object}  Panel
 *
 * @property  {string}  panelKey  Key identifying the panel; this should map to an existing panel registered
 *                                  in `editor/constants/EditorControlPanels`
 * @property  {Panel}  [previousPanel]   Reference to the previous panel which this panel was opened from.
 *                                              When this panel is closed, the state will return to that previous panel.
 * @property  {Object}  [localContext]    Object containing context data specific to this panel which should be retained and restored
 *                                          if the user navigates away and then returns to this panel (ie, scroll position, selected tab)
 * @property  {Object}  [sharedContext]   Object containing context data which should be passed down to any further panels which
 *                                          are opened from this one. For instance, when opening the image control panel, we store the
 *                                          key identifying the image field being edited on the shared context. Any deeper panels, such as the unsplash
 *                                          panel, will then receive this context and continue to access and edit the selected image field without
 *                                          any additional work needing to be done.
 */
class Panel {
  panelKey: EditorPanelKey;
  previousPanel: Panel | null;
  localContext: PanelContext | null;
  sharedContext: PanelContext | null;

  constructor(
    panelKey: EditorPanelKey,
    previousPanel: Panel | null = null,
    localContext: PanelContext | null = null,
    sharedContext: PanelContext | null = null,
  ) {
    this.panelKey = panelKey;
    this.previousPanel = previousPanel;
    this.localContext = _.clone(localContext);
    this.sharedContext = _.clone(sharedContext);
  }

  /**
   * Updates the state's local panel context object
   * @param {Object}  newLocalContext     Object with new values to store on the local panel context
   * @param {boolean} shouldMerge         Whether we should merge the given context object with any existing
   *                                        context values, or fully replace the old context
   */
  updateLocalContext(newLocalContext: PanelContext, shouldMerge: boolean) {
    if (shouldMerge) {
      this.localContext = {
        ...this.localContext,
        ...newLocalContext,
      };
    } else {
      this.localContext = _.clone(newLocalContext);
    }
  }
}

// Base default "main" panel at the root of panel navigation
const defaultMainPanel = new Panel(editorPanelKeys.main);

// Find a specific panel in the panel stack
const findPanelInStack = (panelKey: EditorPanelKey, currentPanel: Panel): Panel => {
  // If the panel at the top of the stack matches the provided key, we're done
  if (currentPanel.panelKey === panelKey) {
    return currentPanel;
  }

  if (!currentPanel.previousPanel) {
    // If we hit the root of the panel stack and didn't find the panel,
    // create a new panel for our target key
    return new Panel(panelKey, currentPanel, null, currentPanel.sharedContext);
  }

  // Keep looking for the correct panel
  return findPanelInStack(panelKey, currentPanel.previousPanel);
};

interface EditorPanelState {
  currentPanel: Panel;
  isNavigatingBack: boolean;
  isInitialPanel: boolean;
}

type EditorPanelActionObject =
  | {
      type: EditorPanelActions.OpenPanel;
      newPanelKey: EditorPanelKey;
      localPanelContext?: PanelContext | null;
      sharedPanelContext?: PanelContext | null;
      previousControlsScrollPosition?: number;
    }
  | {
      type: EditorPanelActions.ClosePanel;
      targetPanelKey?: EditorPanelKey | null;
    }
  | {
      type: EditorPanelActions.UpdateLocalPanelContext;
      localPanelContext: PanelContext;
      shouldMerge: boolean;
    };

const editorPanelReducer = (state: EditorPanelState, action: EditorPanelActionObject) => {
  switch (action.type) {
    case EditorPanelActions.OpenPanel: {
      const previousPanel = state.currentPanel;
      // Store the current scroll position for the panel we're navigating
      // away from so we can restore that position when navigating back
      previousPanel.updateLocalContext(
        {
          scrollPosition: action.previousControlsScrollPosition || 0,
        },
        true,
      );

      // Combine any shared context from the previous panel with any new shared context from the action
      const combinedSharedContext: PanelContext = {
        ...previousPanel.sharedContext,
        ...action.sharedPanelContext,
      };

      return {
        currentPanel: new Panel(
          action.newPanelKey,
          previousPanel,
          action.localPanelContext,
          combinedSharedContext,
        ),
        isNavigatingBack: false,
        isInitialPanel: false,
      };
    }
    case EditorPanelActions.ClosePanel: {
      // If we don't have any previous panel to go back to, we're likely at the very base
      // of the navigation tree and therefore don't have anything to close, so do nothing
      if (!state.currentPanel.previousPanel) {
        return state;
      }

      let newCurrentPanel;

      // If a target panel was provided, we need to find that panel and treat it
      // as the most current panel in our navigation stack
      if (action.targetPanelKey) {
        newCurrentPanel = findPanelInStack(action.targetPanelKey, state.currentPanel);
      } else {
        newCurrentPanel = state.currentPanel.previousPanel;
      }

      return {
        currentPanel: newCurrentPanel,
        // If we're closing the initial panel, animate the transition forward
        // Otherwise, animate it backward
        isNavigatingBack: !state.isInitialPanel,
        isInitialPanel: false,
      };
    }
    case EditorPanelActions.UpdateLocalPanelContext: {
      state.currentPanel.updateLocalContext(action.localPanelContext, action.shouldMerge);

      // Spread the whole state to create a new object to reflect that there was a state change
      return {
        ...state,
      };
    }
    default:
      return state;
  }
};

type PanelStateContextValue = EditorPanelState;
export const EditorPanelStateContext = createContext<PanelStateContextValue>(
  {} as PanelStateContextValue,
);

interface PanelDispatchContextValue {
  openControlPanel: (
    panelKey: EditorPanelKey,
    sharedPanelContext?: PanelContext | null,
    localPanelContext?: PanelContext | null,
  ) => void;
  closeControlPanel: (options?: { targetPanelKey?: EditorPanelKey | null }) => void;
  updateControlPanelLocalContext: (localPanelContext: PanelContext, shouldMerge?: boolean) => void;
}
export const EditorPanelDispatchContext = createContext<PanelDispatchContextValue>(
  {} as PanelDispatchContextValue,
);

type PanelInstersectionObserverContextValue = IntersectionObserver | null;
export const EditorPanelIntersectionObserverContext =
  createContext<PanelInstersectionObserverContextValue>(null);

interface EditorPanelProviderProps {
  children: React.ReactNode;
}

/**
 * Provider gives wrapped components access to panel mode contexts
 * This provider should wrap the EditorControls component.
 *
 * There are two contexts:
 *  EditorPanelStateContext provides access to the state values
 *    which describes what control panel should be rendered in the editor and how to transition
 *    between control panels
 * EditorPanelDispatchContext provides access to functions which will
 *  modify the editor panel mode state, ie opening or closing a panel
 */
export default function EditorPanelProvider({ children }: EditorPanelProviderProps) {
  /**
   * @typedef   {Object}  EditorControlPanelState
   *
   * @property  {Panel}   currentPanel      The current selected panel which should be displayed in the UI
   * @property  {bool}    isNavigatingBack  Whether the current panel was navigated to by closing a panel or not.
   *                                          This informs how the transition from the last panel to this one should be animated.
   * @property  {bool}    isInitialPanel    Whether this is the very first initial panel displayed in the editor.
   *                                          This informs how panel transitions should be animated and whether the panel should
   *                                          be scrolled all the way to the top on mobile when opened.
   */
  const [editorControlPanelState, dispatchEditorControlPanelState] = useReducer(
    editorPanelReducer,
    // Determine our initial panel mode which will be passed to the lazy init function
    defaultMainPanel,
    // Lazily initialize the reducer state with the initial panel mode
    (initialPanelState) => ({
      currentPanel: initialPanelState,
      isNavigatingBack: false,
      // Whether this is the first panel being displayed after the editor loads -- this will get set to false
      // as soon as the user navigates to a new panel
      isInitialPanel: true,
    }),
  );

  const isMobile = useIsWindowMobile();

  // Create an IntersectionObserver which will be able to detect the visibility of the editor panel's contents.
  // This can be used to help lazy-load panel contents (ie, large numbers of images).
  // It's recommended that this be used with the useIsElementInViewport hook.
  const [panelContentIntersectionObserver, setPanelContentIntersectionObserver] =
    useState<IntersectionObserver | null>(null);

  useEffect(() => {
    // Creating the IntersectionObserver in an effect so we can make sure the controls wrapper element has been rendered
    setPanelContentIntersectionObserver(
      makeIntersectionObserver({
        // If on mobile, editor control scrolling is done relative to the whole page so
        // set the root to null to check intersection relative to the whole viewport.
        // However on desktop, only the control panel on the side is scrollable, so we should
        // observe intersection relative to the control panel element instead.
        root: isMobile ? null : document.getElementById(scrollableControlsWrapperID),
        rootMargin: '20%',
      }),
    );
  }, [isMobile]);

  /**
   * @typedef {Object}  EditorControlDispatchFunctions
   *
   * @property  {function}  openControlPanel                Updates state to opens a new panel by key
   * @property  {function}  updateControlPanelLocalContext  Updates the current control panel's local context
   * @property  {function}  closeControlPanel               Closes the current main panel and returns to the main panel
   */
  const dispatchFunctions: PanelDispatchContextValue = useMemo(
    () => ({
      /**
       * Updates state to opens a new panel by key
       *
       * @param {string} newPanelKey  Key identifying the panel to open
       * @param {Object}  [sharedPanelContext]  Object with any context values which should be shared with all subsequent panels opened after this one
       *                                          (ie, the selected image field key in the base image panel should be carried through for any image subpanels)
       * @param {Object}  [localPanelContext]   Object with any context values which should only be accessible for this panel and not carried through to others
       *                                          (ie, which tab is currently open in the image panel)
       */
      openControlPanel: (newPanelKey, sharedPanelContext = null, localPanelContext = null) => {
        // Get the scroll position of the current panel that we'll want to restore when the new panel
        // being opened is closed
        // On mobile, we just want the scroll position of the window
        const previousControlsScrollPosition = isMobile
          ? window.scrollY
          : // On desktop, get the scroll position of the controls' wrapper element
            document.getElementById(scrollableControlsWrapperID)?.scrollTop;

        return dispatchEditorControlPanelState({
          type: EditorPanelActions.OpenPanel,
          newPanelKey,
          sharedPanelContext,
          localPanelContext,
          previousControlsScrollPosition,
        });
      },
      /**
       * Updates the current control panel's local context
       *
       * @param {Object}  localPanelContext   Object with values to update the local context with
       * @param {boolean} [shouldMerge=true]  Whether we should merge the provided context values with any existing context values or fully overwrite them
       */
      updateControlPanelLocalContext: (localPanelContext, shouldMerge = true) =>
        dispatchEditorControlPanelState({
          type: EditorPanelActions.UpdateLocalPanelContext,
          localPanelContext,
          shouldMerge,
        }),
      /**
       * Closes the current panel and returns to the previous panel.
       * If the current panel has no previous panel, we will do nothing.
       *
       * @param {object} options
       * @param {string} options.targetPanelKey  Optional key of panel to return to if not navigating
       *                                         directly back in the navigation stack
       */
      closeControlPanel: ({ targetPanelKey } = {}) =>
        dispatchEditorControlPanelState({
          type: EditorPanelActions.ClosePanel,
          targetPanelKey,
        }),
    }),
    [isMobile],
  );

  return (
    <EditorPanelDispatchContext.Provider value={dispatchFunctions}>
      <EditorPanelStateContext.Provider value={editorControlPanelState}>
        <EditorPanelIntersectionObserverContext.Provider value={panelContentIntersectionObserver}>
          {children}
        </EditorPanelIntersectionObserverContext.Provider>
      </EditorPanelStateContext.Provider>
    </EditorPanelDispatchContext.Provider>
  );
}
EditorPanelProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook returns the current editor control panel state
 *
 * @returns {EditorControlPanelState}
 */
export const useEditorPanelState = () => useContext(EditorPanelStateContext);

/**
 * Hook returns dispatch functions to update the editor control panel state
 *
 * @returns {EditorControlDispatchFunctions}
 */
export const useEditorPanelDispatch = () => useContext(EditorPanelDispatchContext);

/**
 * Hook returns an IntersectionObserver which can be used to detect the visibility of the editor panel's contents.
 *
 * @returns {IntersectionObserver}
 */
export const useEditorPanelContentIntersectionObserver = () =>
  useContext(EditorPanelIntersectionObserverContext);
