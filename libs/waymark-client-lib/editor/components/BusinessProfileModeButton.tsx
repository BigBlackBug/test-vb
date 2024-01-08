// Vendor
import classNames from 'classnames';

// Editor
import EditorModeButton from 'editor/components/EditorModeButton';
import BusinessProfileInfoCard from 'editor/components/BusinessProfileInfoCard';
import RemoveBusinessProfileButton from 'editor/components/RemoveBusinessProfileButton';
import { useEditorLongPressModal } from 'editor/providers/EditorLongPressModalProvider.js';
import { removeBusinessProfileModalCopy } from 'editor/constants/modalCopy.js';
import { useEditorDispatch } from 'editor/providers/EditorStateProvider';

// Waymark app dependencies
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';
import { useMissingBusinessFields } from 'app/hooks/businesses';
import {
  dataIsHighlighted,
  dataIsMissingLogo,
  dataShouldShowRemoveButton,
  modeButton,
  profileCard,
  profileModeButtonWrapper,
  removeButton,
} from './BusinessProfileModeButton.css';
import { WaymarkButtonProps } from 'shared/components/WaymarkButton';
import { EditPencilIcon } from 'app/icons/ToolsAndActionsIcons';

interface BusinessProfileModeButtonProps {
  /** Details of the business to display */
  businessDetails: CoreBusinessDetails | null;
  /**
   * Whether to show a loading state while business details are loading
   *
   * @default false
   */
  isLoading?: boolean;
  /**
   * Whether this button should be highlighted to indicate this is the currently selected business
   *
   * @default false
   */
  isHighlighted?: boolean;
  /**
   * Whether to show a REMOVE button when the user hovers over the button
   *
   * @default false
   */
  shouldShowRemoveButton?: boolean;
  /**
   * Custom override color theme to apply to the button
   *
   * @default 'Secondary'
   */
  buttonColorTheme?: WaymarkButtonProps['colorTheme'];
  /**
   * Class name to apply additional custom styles to the button
   *
   * @default null
   */
  buttonClassName?: string | null;
  /**
   * Callback to run when the button is clicked
   *
   * @default null
   */
  onClick?: (() => void) | null;
}

/**
 * Display business detail summary and thumbnail in an EditorModeButton.
 * Navigates to the business detail view.
 */
export default function BusinessProfileModeButton({
  businessDetails,
  isLoading = false,
  isHighlighted = false,
  shouldShowRemoveButton = false,
  buttonColorTheme = 'Secondary',
  buttonClassName = null,
  onClick = null,
}: BusinessProfileModeButtonProps) {
  const { unapplyBusiness } = useEditorDispatch();

  const { onItemTouchStart, onItemTouchEnd } = useEditorLongPressModal();

  const missingBusinessDetails = useMissingBusinessFields(businessDetails);

  return (
    <div
      {...dataShouldShowRemoveButton(shouldShowRemoveButton)}
      {...dataIsHighlighted(isHighlighted)}
      className={profileModeButtonWrapper}
    >
      <EditorModeButton
        colorTheme={buttonColorTheme}
        icon={<EditPencilIcon />}
        primaryText={
          <BusinessProfileInfoCard
            {...dataIsMissingLogo(missingBusinessDetails.isMissingLogo)}
            isMissingBusinessInfo={missingBusinessDetails.isInvalid}
            businessDetails={businessDetails}
            isLoading={isLoading}
            isHighlighted={isHighlighted}
            className={profileCard}
          />
        }
        onClick={onClick || undefined}
        onTouchStart={(event) => {
          onItemTouchStart(event, {
            title: removeBusinessProfileModalCopy.title,
            subText: removeBusinessProfileModalCopy.subText,
            actions: [
              {
                actionName: 'Remove',
                action: () => unapplyBusiness(),
                buttonProps: {
                  // Make the button red to indicate it is a dangerous delete action
                  colorTheme: 'Negative',
                },
              },
            ],
          });
        }}
        onTouchEnd={onItemTouchEnd}
        className={classNames(modeButton, buttonClassName)}
      />

      {/* When applicable, layer a REMOVE button on top of the mode button. This has to be done here to avoid button-nesting. */}
      {shouldShowRemoveButton ? <RemoveBusinessProfileButton className={removeButton} /> : null}
    </div>
  );
}
