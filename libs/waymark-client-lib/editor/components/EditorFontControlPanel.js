// Vendor
import {
    useEffect,
    useState,
    useMemo
} from 'react';

// Editor
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import HeaderButtonRow from 'editor/components/EditorControlPanelHeaderButtonRow.js';
import EditorResetConfirmationModal from 'editor/components/EditorResetConfirmationModal';
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';
import {
    EditorControlPanelHeading
} from 'editor/components/EditorControlHeadings';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import {
    useEditorFieldsOfType
} from 'editor/providers/EditorFormDescriptionProvider.js';
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import FontLibraryFontList from 'editor/components/FontLibraryFontList';
import FontLibrarySectionHeading from 'editor/components/FontLibrarySectionHeading';
import {
    useEditorState
} from 'editor/providers/EditorStateProvider.js';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';

// Local
import {
    RotatingLoader
} from '@libs/shared-ui-components';
import * as styles from './EditorFontControlPanel.css';

/**
 * Header component for the EditorFontPanel.
 */
const EditorFontHeader = () => {
    // Destructuring hook before using so that we can take advantage of eslint rules of hooks
    const {
        useResetToDefaultConfigurationValue
    } = useEditorFieldsOfType(
        VideoEditingFieldTypes.font,
    );
    const resetFontField = useResetToDefaultConfigurationValue();

    const [isModalVisible, setIsModalVisible] = useState(false);

    return ( <
        HeaderButtonRow >
        <
        BaseHeaderBackButton / >
        <
        WaymarkButton colorTheme = "BlackText"
        hasFill = {
            false
        }
        isSmall onClick = {
            () => setIsModalVisible(true)
        } >
        Use Default <
        /WaymarkButton> <
        EditorResetConfirmationModal bodyText = "This will revert to the original fonts in this template."
        editingAttribute = "Font"
        isOpen = {
            isModalVisible
        }
        onClose = {
            () => setIsModalVisible(false)
        }
        onClickReset = {
            () => resetFontField()
        }
        /> <
        /HeaderButtonRow>
    );
};

/**
 * Provides an interface for the user to select a new font family to apply
 * to a Waymark Studio template.
 */
const EditorFontControls = () => {
    const fontField = useEditorFieldsOfType(VideoEditingFieldTypes.font);

    // Destructuring hooks before using so that we can take advantage of eslint rules of hooks
    const {
        useUpdateConfigurationValue,
        useCurrentConfigurationValue
    } = fontField;

    const updateFontField = useUpdateConfigurationValue();
    const currentTypography = useCurrentConfigurationValue();

    const {
        appliedBusinessDetails
    } = useEditorState();

    const {
        font: {
            setShouldLoadFontLibraries,
            appliedBusinessFontLibraries,
            accountGroupFontLibraries,
            globalFontLibraries,
            isLoadingFonts,
        },
    } = useEditorMediaLibraries();

    useEffect(() => {
        setShouldLoadFontLibraries(true);
    }, [setShouldLoadFontLibraries]);

    const hasBusinessFonts = useMemo(
        () => Boolean(appliedBusinessFontLibraries.find(({
            assets
        }) => assets.length > 0)), [appliedBusinessFontLibraries],
    );

    return ( <
        div >
        <
        EditorControlPanelHeading heading = "Fonts"
        subheading = "Choose a font below to match your brand and reflect your commercial’s mood." /
        > {
            isLoadingFonts ? ( <
                RotatingLoader className = {
                    styles.LoadingSpinner
                }
                />
            ) : ( <
                > {
                    hasBusinessFonts ? ( <
                        >
                        <
                        FontLibrarySectionHeading headingText = {
                            `${appliedBusinessDetails?.businessName || 'Brand'} fonts`
                        }
                        /> {
                            appliedBusinessFontLibraries.map(({
                                guid,
                                displayName,
                                assets
                            }) => ( <
                                FontLibraryFontList className = {
                                    styles.FontLibraryFontList
                                }
                                key = {
                                    guid
                                }
                                fonts = {
                                    assets
                                }
                                currentTypography = {
                                    currentTypography
                                }
                                onSelectFont = {
                                    updateFontField
                                }
                                isSelectable fontLibraryName = {
                                    displayName
                                }
                                />
                            ))
                        } {
                            /* Only show the "All fonts" heading if we have brand fonts and therefore
                                              need to distinguish between the two sections */
                        } <
                        FontLibrarySectionHeading headingText = "All fonts" / >
                        <
                        />
                    ) : null
                } {
                    [...accountGroupFontLibraries, ...globalFontLibraries].map(
                        ({
                            guid,
                            displayName,
                            assets
                        }) => ( <
                            FontLibraryFontList key = {
                                guid
                            }
                            fonts = {
                                assets
                            }
                            currentTypography = {
                                currentTypography
                            }
                            onSelectFont = {
                                updateFontField
                            }
                            isSelectable fontLibraryName = {
                                displayName
                            }
                            />
                        ),
                    )
                } <
                />
            )
        } <
        /div>
    );
};

export default makeEditorControlPanel(EditorFontHeader, EditorFontControls);