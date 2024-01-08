import { useState } from 'react';
import { isEmpty } from 'lodash';

import { StockImageView } from 'app/components/StockImageView/StockImageView';
import { EditorControlPanelHeading } from 'editor/components/EditorControlHeadings';
import { useEditorMediaLibraries } from 'editor/providers/EditorMediaLibrariesProvider';
import { useSelectedEditorImageField } from 'editor/hooks/editorImageField';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { ShutterstockTermsModal } from 'app/components/ShutterstockTermsModal';

import * as styles from './PanelControls.css';

export default function StockImageSearchPanelControls() {
  const {
    image: { appliedBusinessImageLibraries, accountImageLibraries },
  } = useEditorMediaLibraries();

  const selectedImageLibrary = !isEmpty(appliedBusinessImageLibraries)
    ? appliedBusinessImageLibraries[0]
    : accountImageLibraries[0];

  const currentlyEditingImageField = useSelectedEditorImageField();
  const { useSetImageURL } = currentlyEditingImageField;
  const setImageURL = useSetImageURL();

  const [shouldShowShutterstockTermsModal, setShouldShowShutterstockTermsModal] = useState(false);

  return (
    <>
      <EditorControlPanelHeading
        heading="Search Shutterstock"
        subheading={
          <>
            <strong>Type in a word to search for images on Shutterstock</strong>. Read the{' '}
            <WaymarkButton
              onClick={() => setShouldShowShutterstockTermsModal(true)}
              hasFill={false}
              isUppercase={false}
              colorTheme="PrimaryText"
              typography="inherit"
              className={styles.shutterstockTermsButton}
            >
              Terms of Use
            </WaymarkButton>{' '}
            before getting started.
          </>
        }
      />
      <StockImageView
        imageLibrary={selectedImageLibrary}
        onAddToLibrary={(createdImageLibraryImage) => {
          if (createdImageLibraryImage) {
            setImageURL(createdImageLibraryImage.baseUrl);
          }
        }}
      />
      <ShutterstockTermsModal
        isVisible={shouldShowShutterstockTermsModal}
        onCloseModal={() => setShouldShowShutterstockTermsModal(false)}
        modalSize="large"
        cancelInterface="button"
        cancelButtonText="Okay"
      />
    </>
  );
}
