// Editor
import { EditorControlPanelHeading } from 'editor/components/EditorControlHeadings';

// Shared
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';

// Local
import { EditorPanelTabButtons, useCurrentTab } from './audioControlPanelTabs';

// Styles
import * as styles from './PanelControls.css';

export default function AudioPanelControls() {
  const { component: TabComponent, name: tabName } = useCurrentTab();

  return (
    <>
      <EditorControlPanelHeading className={styles.PanelControlsHeading} heading="Audio Control" />
      <EditorPanelTabButtons />
      <FadeSwitchTransition transitionKey={tabName}>
        <TabComponent />
      </FadeSwitchTransition>
    </>
  );
}
