// Vendor
import { useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

// Editor
import { errorColor } from 'styles/themes/waymark/colors.js';
import EditorControlPanel from 'editor/components/EditorControlPanel';
import { useEditorFormDescriptionContext } from 'editor/providers/EditorFormDescriptionProvider.js';

// Shared
import { RotatingLoader } from '@libs/shared-ui-components';
import ErrorBoundary from 'shared/components/ErrorBoundary';

/* WAYMARK APP DEPENDENCIES */
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
import useWindowEvent from 'app/hooks/windowEvent.js';
import { CloseIcon } from 'app/icons/BasicIcons';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './EditorControls.css';

interface EditorControlsProps {
  videoSectionHeight: number;
  isMobile: boolean;
}

/**
 * Control panel component manages displaying the current editor mode's controls
 *
 * @param {number}  videoSectionHeight    Height of the edit page's video section in px - this is only relevant on mobile
 *                                          so that we can have enough space above the control panel to make the video section fully visible when the page is scrolled
 *                                          all the way up
 * @param {bool}    isMobile              Whether we should show the mobile or desktop version of the editor UI
 */
const EditorControls = ({ videoSectionHeight, isMobile }: EditorControlsProps) => {
  // Refs for control panel elements
  const scrolledModalBackgroundRef = useRef<HTMLDivElement>(null);

  const { isFormDescriptionLoading, formDescriptionError } = useEditorFormDescriptionContext();

  // Scrolls back to the top of the page so that the video is fully in focus and the editor modal is "collapsed"
  const scrollToTopOfPage = useCallback(() => {
    window.scroll({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isMobile) {
      // If a mobile user taps outside of the control panel on the editor video section, collapse the modal
      const videoSection = document.getElementById('wm-editor-video-section');

      if (!videoSection) {
        return undefined;
      }

      videoSection.addEventListener('click', scrollToTopOfPage);

      return () => videoSection.removeEventListener('click', scrollToTopOfPage);
    }

    return undefined;
  }, [isMobile, scrollToTopOfPage]);

  // Keep track of stuff related to how we display the editor control modal on mobile devices as the user scrolls
  const onWindowScroll = useCallback(() => {
    const scrolledModalBackground = scrolledModalBackgroundRef.current;
    if (isMobile && scrolledModalBackground) {
      // Update the opacity of the background on mobile based on how far the modal is scrolled
      scrolledModalBackground.style.opacity = `${
        videoSectionHeight > 0 ? Math.min(window.pageYOffset / videoSectionHeight, 1) : 0
      }`;
    }
  }, [videoSectionHeight, isMobile]);

  useWindowEvent('scroll', onWindowScroll, { passive: true });

  useEffect(() => {
    // When the editor finishes setting up, make sure we're properly scrolled to the top of the page on mobile
    scrollToTopOfPage();
  }, [scrollToTopOfPage]);

  return (
    <>
      <FadeSwitchTransition
        // Trigger a fade transition when the editor finishes setting up
        transitionKey={isFormDescriptionLoading ? 'loading' : 'setup'}
        className={styles.EditorControls}
        style={{
          // Set top margin of controls equal to the video section's height so that
          // there is empty space above the panel for the video to be seen
          marginTop: isMobile ? videoSectionHeight : undefined,
        }}
        id="wm-editor-controls"
      >
        {/* If the editor hasn't been set up yet, show a loading spinner */}
        {isFormDescriptionLoading ? (
          <div className={styles.LoadingSpinnerWrapper}>
            <RotatingLoader className={styles.LoadingSpinner} />
          </div>
        ) : (
          <>
            {formDescriptionError ? (
              <div className={styles.FormDescriptionErrorMessage}>
                An error occurred while loading this template.
                <CloseIcon color={errorColor} className={styles.ErrorIcon} />
              </div>
            ) : null}
            {!formDescriptionError ? (
              <ErrorBoundary containerClass={styles.ErrorBoundaryContainer}>
                <EditorControlPanel isMobile={isMobile} scrollToTopOfPage={scrollToTopOfPage} />
              </ErrorBoundary>
            ) : null}
          </>
        )}
      </FadeSwitchTransition>
      {/* Modal background overlay fades in as the user scrolls the mobile modal panel farther up */}
      {isMobile && (
        <div ref={scrolledModalBackgroundRef} className={styles.MobileScrolledModalBackground} />
      )}
    </>
  );
};

EditorControls.propTypes = {
  videoSectionHeight: PropTypes.number.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

export default EditorControls;
