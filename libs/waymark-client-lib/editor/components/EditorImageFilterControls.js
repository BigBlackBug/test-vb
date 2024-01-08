// Vendor
import _ from 'lodash';
import {
    useState
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import {
    ImageModifications,
    ImageModificationKeys,
    imageFilters,
} from 'editor/constants/EditorImage.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    EditorControlSectionHeading
} from 'editor/components/EditorControlHeadings';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';
import {
    RotatingLoader
} from '@libs/shared-ui-components';
import AspectRatioWrapper from 'shared/components/AspectRatioWrapper';
import ProgressiveImage from 'shared/components/ProgressiveImage';

// Styles
import {
    useTypography
} from 'styles/hooks/typography.js';
import {
    themeVars
} from '@libs/shared-ui-styles';
import {
    lightGrayColor
} from 'styles/themes/waymark/colors.js';

const getImageFilterURL = (imageURL, adjustments) => {
    // Constrain the image to a 1x1 aspect ratio.
    const adjustmentQueryParams = {
        fit: 'crop',
        crop: 'faces',
        w: 500,
        h: 500
    };

    // Add adjustments to create filter effect.
    Object.keys(adjustments).forEach((adjustmentKey) => {
        const modification = ImageModifications[adjustmentKey];
        adjustmentQueryParams[modification.queryParam] = adjustments[adjustmentKey];
    });

    return addQueryParametersToURL(imageURL, adjustmentQueryParams);
};

/**
 * Renders a button which will select a filter to apply to the image being edited
 *
 * @param {string}  label           Label name for the filter
 * @param {func}    onSelectFilter  Selects this filter to apply to the image field
 * @param {bool}    isSelected      Whether this filter is currently selected for the image field
 * @param {string}  filterImageURL  URL for an image with this filter's adjustments applied to preview how it would look
 */
const ImageFilterOptionButton = ({
    label,
    onSelectFilter,
    isSelected,
    filterImageURL
}) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const [caption3TextStyle] = useTypography(['caption3']);

    return ( <
        div >
        <
        WaymarkButton className = {
            css `
          border: 3px solid ${isSelected ? themeVars.color.brand.default : 'transparent'};
          border-radius: 12px !important;
          padding: 4px !important;
          background-color: ${lightGrayColor};
          width: 100%;
          overflow: hidden;
          transform: translate3d(0, 0, 0);
        `
        }
        id = {
            label
        }
        onClick = {
            onSelectFilter
        } >
        <
        AspectRatioWrapper aspectRatio = "1:1" >
        <
        ProgressiveImage alt = "Configuration value or user selection"
        src = {
            filterImageURL
        }
        onLoad = {
            () => setIsLoaded(true)
        }
        className = {
            css `
              /* Using !important to ensure we properly override the default position: relative style */
              position: absolute !important;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
            `
        }
        overlay = {!isLoaded && ( <
                RotatingLoader className = {
                    css `
                    width: 64px;
                    height: 64px;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                  `
                }
                />
            )
        }
        /> <
        /AspectRatioWrapper> <
        /WaymarkButton> <
        span className = {
            css `
          ${caption3TextStyle}
          color: ${isSelected ? themeVars.color.brand.default : 'inherit'};
          text-align: left;
          display: block;
          padding-left: 3px;
          margin-top: 3px;
        `
        } >
        {
            label
        } <
        /span> <
        /div>
    );
};
ImageFilterOptionButton.propTypes = {
    label: PropTypes.string.isRequired,
    onSelectFilter: PropTypes.func.isRequired,
    isSelected: PropTypes.bool.isRequired,
    filterImageURL: PropTypes.string.isRequired,
};

/**
 * Displays a set of images with various filters applied to them and allows users to apply
 * the same filters to images in templates.
 */
const EditorImageFilterControls = ({
    currentlyEditingImageField,
    baseImageFieldURL
}) => {
    const {
        useCurrentImageModificationsValue,
        useUpdateImageModifications
    } =
    currentlyEditingImageField;
    const updateImageModifications = useUpdateImageModifications();

    const currentAdjustments = useCurrentImageModificationsValue(ImageModificationKeys.adjustments);

    const [selectedFilter, setSelectedFilter] = useState(() => {
        const imgixAdjustmentValues = {};
        if (currentAdjustments) {
            Object.keys(currentAdjustments).forEach((adjustmentKey) => {
                const modification = ImageModifications[adjustmentKey];
                imgixAdjustmentValues[adjustmentKey] = modification.toImgixValue(
                    currentAdjustments[adjustmentKey],
                );
            });
        }

        return _.find(imageFilters, (filter) => _.isEqual(filter.adjustments, imgixAdjustmentValues));
    });

    const onSelectNewFilter = (filter) => {
        setSelectedFilter(filter);

        if (_.isEmpty(filter.adjustments)) {
            // If we're applying the "Normal" filter, we want to nullify adjustments
            // in the configuration value.
            updateImageModifications(
                (currentModifications) => _.omit(currentModifications, ImageModificationKeys.adjustments),
                ImageModificationKeys.all,
            );
        } else {
            const normalizedAdjustments = {};

            Object.keys(filter.adjustments).forEach((adjustmentKey) => {
                const modification = ImageModifications[adjustmentKey];
                normalizedAdjustments[adjustmentKey] = modification.toWaymarkValue(
                    filter.adjustments[adjustmentKey],
                );
            });

            updateImageModifications(normalizedAdjustments, ImageModificationKeys.adjustments);
        }
    };

    return ( <
        >
        <
        EditorControlSectionHeading heading = "Filters"
        className = {
            css `
          margin-bottom: 12px;
        `
        }
        /> <
        div className = {
            css `
          /* Filter previews are displayed in a two-column grid */
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-gap: 6px;
        `
        } >
        {
            imageFilters.map((filter) => ( <
                ImageFilterOptionButton key = {
                    filter.label
                }
                adjustments = {
                    filter.adjustments
                }
                label = {
                    filter.label
                }
                onSelectFilter = {
                    () => onSelectNewFilter(filter)
                }
                isSelected = {
                    filter.label === selectedFilter.label
                }
                filterImageURL = {
                    getImageFilterURL(baseImageFieldURL, filter.adjustments)
                }
                />
            ))
        } <
        /div> <
        />
    );
};
EditorImageFilterControls.propTypes = {
    currentlyEditingImageField: editorPropTypes.editorImageField.isRequired,
    baseImageFieldURL: PropTypes.string.isRequired,
};

export default EditorImageFilterControls;