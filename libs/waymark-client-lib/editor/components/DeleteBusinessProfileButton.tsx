// Vendor
import React, { useState } from 'react';
import { css } from '@emotion/css';

// Editor
import { useEditorDispatch, useEditorState } from 'editor/providers/EditorStateProvider.js';

// App
import SlideFadeSwitchTransition from 'app/components/SlideFadeSwitchTransition';
import { getSelectedBusinessGUID } from 'app/state/brandSelectionStore';
import { BrandModalSteps, setCurrentBrandModalStep } from 'app/components/BrandsModal/state/flow';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { deleteBusiness } from 'shared/api/graphql/businesses/mutations';
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';

// Styles
import { useTypography } from 'styles/hooks/typography.js';
import { themeVars, typographyStyleVariants } from '@libs/shared-ui-styles';
import * as styles from './DeleteBusinessProfileButton.css';

/**
 * Renders contents of a confirmation button for deleting a business.
 *
 * @param {Object}  businessDetails   Object with details for the business to delete
 * @param {func}    onCloseModal      Function closes the modal
 * @param {func}    onDelete          Function called when the business is successfully deleted
 * @param {func}    onError           Function called when an error occurs
 * @param {bool}    isEditor          Whether or not the button is being used in the editor
 */
interface DeleteBusinessConfirmationProps {
  businessDetails: CoreBusinessDetails;
  isEditor?: boolean;
  onDelete?: () => void;
  onCancelDelete?: () => void;
  onError?: (error: Error) => void;
}

/** A confirmation button used only in the editor. This allows us to interact with editor state without causing issues. */
function ConfirmDeleteButtonEditor({
  businessDetails,
  onDelete,
  onError,
}: DeleteBusinessConfirmationProps) {
  const { unapplyBusiness } = useEditorDispatch();
  const { appliedBusinessGUID } = useEditorState();

  const onClickConfirmDelete = async () => {
    try {
      if (!businessDetails.guid) {
        throw new Error('No business GUID provided');
      }

      // Nullify the appliedBusinessGUID if it's being deleted and deselect
      // This does not affect the configuration
      if (appliedBusinessGUID === businessDetails.guid) {
        unapplyBusiness();
      }

      await deleteBusiness(businessDetails.guid);
      // Close the control panel and modal upon successfully deleting the business
      onDelete?.();
      setCurrentBrandModalStep(BrandModalSteps.SELECT_BRAND);
    } catch (error) {
      console.error(error);
      onError?.(error as Error);
    }
  };

  return (
    <WaymarkButton
      onClick={onClickConfirmDelete}
      colorTheme="Negative"
      className={css`
        width: 100%;
      `}
    >
      Yes
    </WaymarkButton>
  );
}

/** A confirmation button used outside of the editor. This allows us to bypass the editor state. */
function ConfirmDeleteButton({
  businessDetails,
  onDelete,
  onError,
}: DeleteBusinessConfirmationProps) {
  const onClickConfirmDelete = async () => {
    try {
      if (!businessDetails.guid) {
        throw new Error('No business GUID provided');
      }

      await deleteBusiness(businessDetails.guid);
      // Close the control panel and modal upon successfully deleting the business
      onDelete?.();
      setCurrentBrandModalStep(BrandModalSteps.SELECT_BRAND);
    } catch (error) {
      console.error(error);
      onError?.(error as Error);
    }
  };

  return (
    <WaymarkButton
      onClick={onClickConfirmDelete}
      colorTheme="Negative"
      className={css`
        width: 100%;
      `}
    >
      Yes
    </WaymarkButton>
  );
}

function DeleteBusinessConfirmationSection({
  businessDetails,
  onDelete,
  onCancelDelete,
  isEditor = false,
}: DeleteBusinessConfirmationProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [bodySmallTextStyle] = useTypography(['bodySmall']);

  return (
    <div className={styles.DeleteConfirmationContainer}>
      <p className={typographyStyleVariants.bodyRegular}>{`Delete ${
        businessDetails.businessName || 'your business'
      }?`}</p>
      <p className={typographyStyleVariants.bodySmall}>
        You will lose any assets tied to this business.
      </p>
      <div className={styles.DeleteConfirmationButtons}>
        {isEditor ? (
          <ConfirmDeleteButtonEditor
            businessDetails={businessDetails}
            onDelete={() => {
              onDelete?.();
            }}
            onError={(error) => {
              setErrorMessage(error.message);
            }}
          />
        ) : (
          <ConfirmDeleteButton
            businessDetails={businessDetails}
            onDelete={() => {
              onDelete?.();
            }}
            onError={(error) => {
              setErrorMessage(error.message);
            }}
          />
        )}
        <WaymarkButton
          onClick={onCancelDelete}
          colorTheme="Secondary"
          className={css`
            width: 100%;
          `}
        >
          Cancel
        </WaymarkButton>
      </div>
      {errorMessage ? (
        <p
          className={css`
            ${bodySmallTextStyle}
            color: ${themeVars.color.negative.default};
            margin: 8px 0;
          `}
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Renders a button that deletes a business shows a confirmation to delete the business.
 *
 * @param {Object}  businessDetails   Object with details for the business to delete
 * @param {bool}    isEditor          Whether or not the button is being used in the editor
 */
interface DeleteBusinessProfileButtonProps {
  businessDetails: CoreBusinessDetails;
  isEditor: boolean;
}

export default function DeleteBusinessProfileButton({
  businessDetails,
  isEditor = false,
}: DeleteBusinessProfileButtonProps) {
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  // This is used to not allow the user to delete the business they're currently editing (outside of the editor only)
  const selectedBusinessGUID = getSelectedBusinessGUID();

  return (
    <>
      <SlideFadeSwitchTransition transitionKey={String(isConfirmationVisible)}>
        {isConfirmationVisible ? (
          <>
            <DeleteBusinessConfirmationSection
              isEditor={isEditor}
              businessDetails={businessDetails}
              onCancelDelete={() => setIsConfirmationVisible(false)}
              onDelete={() => setIsConfirmationVisible(false)}
            />
          </>
        ) : (
          <WaymarkButton
            onClick={() => setIsConfirmationVisible(true)}
            colorTheme="Negative"
            isDisabled={selectedBusinessGUID === businessDetails.guid && !isEditor}
            className={css`
              display: block;
              margin: 32px auto;
            `}
          >
            Delete brand
          </WaymarkButton>
        )}
      </SlideFadeSwitchTransition>
      {selectedBusinessGUID === businessDetails.guid && !isEditor ? (
        <p className={styles.CannotDeleteBusinessMessage}>
          You cannot delete the business you are currently editing.
        </p>
      ) : null}
    </>
  );
}
