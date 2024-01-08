// Vendor
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

// Local
import { coolGrayColor } from 'styles/themes/waymark/colors.js';
import EditorControlPanelComponents from 'editor/constants/EditorControlPanels';
import {
  EditorPanelKey,
  editorPanelKeys,
  scrollableControlsWrapperID,
} from 'editor/constants/Editor';
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import { useEditorPanelState, PanelContext } from 'editor/providers/EditorPanelProvider';

// Shared
import Portal from 'shared/components/Portal.js';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import ErrorBoundary from 'shared/components/ErrorBoundary';

// WAYMARK APP DEPENDENCIES
import { UpArrowIcon } from 'app/icons/BasicIcons';
import SlideFadeSwitchTransition from 'app/components/SlideFadeSwitchTransition';

import * as styles from './EditorControlPanel.css';

interface HeaderScrollArrowProps {
  /**
   * Whether the page is currently scrolled - this determines whether the arrow should collapse or expand the control panel
   */
  isPageScrolled: boolean;
  /**
   * Scrolls the page to the top, "collapsing" the controls modal
   */
  scrollToTopOfPage: () => void;
  /**
   * Scrolls the page so the controls modal is at the top, "expanding" the modal
   */
  scrollEditorPanelToTop: () => void;
}

/**
 * Arrow in the control panel's header which allows the user to quickly collapse/expand the controls to
 * reveal or hide the video player
 */
const HeaderScrollArrow = ({
  isPageScrolled,
  scrollToTopOfPage,
  scrollEditorPanelToTop,
}: HeaderScrollArrowProps) => (
  <WaymarkButton
    onClick={isPageScrolled ? scrollToTopOfPage : scrollEditorPanelToTop}
    className={styles.HeaderScrollArrow}
    hasFill={false}
    {...styles.dataIsHeaderArrowFlipped(isPageScrolled)}
  >
    <UpArrowIcon preserveAspectRatio="none" color={coolGrayColor} />
  </WaymarkButton>
);

interface EditorControlPanelProps {
  /**
   * Key identifying which panel component we should render
   */
  panelKey: EditorPanelKey;
  /**
   * Local context values for this panel (see the EditorPanelProvider component).
   * This can include the scroll position that we should initially set the panel at.
   */
  localPanelContext?: PanelContext | null;
  /**
   * Shared context values for this panel (see the EditorPanelProvider component).
   * This can include things like the id of a field which the panel has been opened to edit.
   */
  sharedPanelContext?: PanelContext | null;
  /**
   * Whether this is the very first panel being displayed in the editor, meaning we should not mess with its scroll position
   */
  isInitialPanel: boolean;
  /**
   * Scrolls the window to the top of the page - useful on mobile to "collapse" the editor so that the video player is visible
   */
  scrollToTopOfPage: () => void;
  /**
   * Whether we should use the mobile or desktop editor UI
   */
  isMobile: boolean;
}

/**
 * Renders a control panel for an editor panel mode
 */
const EditorControlPanel = ({
  panelKey,
  localPanelContext = null,
  sharedPanelContext = null,
  isInitialPanel,
  scrollToTopOfPage,
  isMobile,
}: EditorControlPanelProps) => {
  // Keep track of whether the window is currently scrolled on mobile so that we can keep the
  // header's collapse/expand arrow looking and functioning correctly
  const [isPageScrolled, setIsPageScrolled] = useState(window.pageYOffset > 0);
  // Keep track of whether the user has scrolled past the main header so that a sticky header modal
  // should be shown at the top of the page
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);

  const mainHeaderRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Get the components to render for the current panel mode
  const {
    Header,
    Controls,
    // If the control panel doesn't have a provider, just fall back to a fragment
    Provider = Fragment,
  } = EditorControlPanelComponents[panelKey];

  const initialPanelScrollPosition = localPanelContext?.scrollPosition;
  const hasSetInitialScrollPositionRef = useRef(false);

  // Effect sets the control panel's initial scroll position so we can restore previous scroll positions
  // when the user returns to a panel
  useEffect(() => {
    // If we've already set the initial scroll position, bail out of this effect without doing anything
    if (hasSetInitialScrollPositionRef.current) {
      return;
    }

    hasSetInitialScrollPositionRef.current = true;

    if (isMobile) {
      // On mobile, if an initial scroll position is set, scroll the window to that position
      if (initialPanelScrollPosition != null) {
        window.scroll({
          top: initialPanelScrollPosition,
          behavior: 'smooth',
        });
      } else if (!isInitialPanel) {
        // If no initial scroll position is set, meaning we're opening a new panel,
        // scroll the panel all the way to the top unless this is the initial
        // panel after the editor just finished loading
        mainHeaderRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (initialPanelScrollPosition != null) {
      // On desktop, if there's an initial scroll position to set,
      // just set it on the scrollable div wrapping the controls
      if (controlsRef.current) {
        controlsRef.current.scrollTop = initialPanelScrollPosition;
      }
    }
  }, [panelKey, initialPanelScrollPosition, isInitialPanel, isMobile]);

  // Effect adds scroll event listeners on mobile to manage whether the header is sticky or not
  useEffect(() => {
    if (!isMobile) {
      return undefined;
    }

    // If on mobile, check if the page is scrolled and if the sticky modal should be shown
    const onWindowScroll = () => {
      setIsPageScrolled(window.pageYOffset > 0);
      setIsHeaderSticky((mainHeaderRef.current?.getBoundingClientRect().y ?? 0) < 0);
    };

    // Run an initial check for the current scroll position
    onWindowScroll();

    window.addEventListener('scroll', onWindowScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onWindowScroll);
    };
  }, [isMobile]);

  // Scrolls the editor panel to the top
  const scrollEditorPanelToTop = useCallback(() => {
    if (isMobile) {
      // On mobile, scroll the page so that the top of the control panel is at the top of the screen
      mainHeaderRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // On desktop, this simply means scroll the control contents to the top
      controlsRef.current?.scroll({ top: 0, behavior: 'smooth' });
    }
  }, [isMobile]);

  return (
    <Provider>
      {isMobile && (
        // Use a portal to attach the sticky header to the top level of the dom so we can position it
        // separately and display it as an overlay on top of everything else
        <Portal>
          <div
            className={styles.StickyHeaderWrapper}
            {...styles.dataIsHeaderSticky(isHeaderSticky)}
          >
            <Header localPanelContext={localPanelContext} sharedPanelContext={sharedPanelContext} />
            <HeaderScrollArrow
              isPageScrolled={isPageScrolled}
              scrollToTopOfPage={scrollToTopOfPage}
              scrollEditorPanelToTop={scrollEditorPanelToTop}
            />
          </div>
        </Portal>
      )}
      <ErrorBoundary
        headerComponent={
          <div className={styles.HeaderWrapper} ref={mainHeaderRef}>
            {/* If this panel failed to render and it's not the main panel, show a back button in the header
                to return to the previous panel */}
            {panelKey !== editorPanelKeys.main ? <BaseHeaderBackButton /> : null}
          </div>
        }
        containerClass={styles.ErrorBoundaryContainer}
      >
        <div className={styles.HeaderWrapper} ref={mainHeaderRef}>
          <Header localPanelContext={localPanelContext} sharedPanelContext={sharedPanelContext} />
          {/* If on mobile, add an arrow button which can scroll to expand/collapse the controls */}
          {isMobile && (
            <HeaderScrollArrow
              isPageScrolled={isPageScrolled}
              scrollToTopOfPage={scrollToTopOfPage}
              scrollEditorPanelToTop={scrollEditorPanelToTop}
            />
          )}
        </div>
        <div className={styles.ControlsWrapper} id={scrollableControlsWrapperID} ref={controlsRef}>
          <Controls
            scrollEditorPanelToTop={scrollEditorPanelToTop}
            // Passing our panel contexts down through to the controls component so the component can access these values
            // safely without having to worry about content flashes that can occur during panel transitions
            // when the panel returned from useEditorPanelState changes
            localPanelContext={localPanelContext}
            sharedPanelContext={sharedPanelContext}
          />
        </div>
      </ErrorBoundary>
    </Provider>
  );
};

/**
 * Wraps the EditorControlPanel component with a SlideFadeSwitchTransition
 * to handle animating transitions between panels in the editor.
 *
 * All props are passed through to the EditorControlPanel component.
 */
export default function EditorControlPanelTransitionWrapper(
  props: Pick<EditorControlPanelProps, 'isMobile' | 'scrollToTopOfPage'>,
) {
  const { currentPanel, isNavigatingBack, isInitialPanel } = useEditorPanelState();

  const {
    panelKey,
    localContext: localPanelContext,
    sharedContext: sharedPanelContext,
  } = currentPanel;

  return (
    <SlideFadeSwitchTransition
      // Trigger a transition animation every time the panel changes
      transitionKey={panelKey}
      // Change the animation slide direction based on whether the user is going forward or backward in the editor form
      direction={isNavigatingBack ? 'right' : 'left'}
      className={styles.ControlPanelTransitionWrapper}
      transitionElementClassName={styles.ControlPanel}
      duration={150}
    >
      <EditorControlPanel
        key={panelKey}
        panelKey={panelKey}
        localPanelContext={localPanelContext}
        sharedPanelContext={sharedPanelContext}
        isInitialPanel={isInitialPanel}
        // Pass through any other props to the EditorControlPanel components
        {...props}
      />
    </SlideFadeSwitchTransition>
  );
}
