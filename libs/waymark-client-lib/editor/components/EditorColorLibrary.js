// Vendor
import {
    useEffect
} from 'react';
import PropTypes from 'prop-types';

// Editor
import {
    basicColorLibrary
} from 'editor/constants/EditorColors.js';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import ColorLibrarySection from 'editor/components/ColorLibrarySection.js';
import {
    useEditorState
} from 'editor/providers/EditorStateProvider.js';

/**
 * Renders a library of all of the colors accessible to the user in the video editing experience
 *
 * @param {func}    onSelectLibraryColor    Selects a given hex code to use in the video for the currently selected color field
 * @param {string}  currentlySelectedColor  Hex code string for the current value of the currently selected color field
 */
const EditorColorLibrary = ({
    onSelectLibraryColor,
    currentlySelectedColor
}) => {
    const {
        appliedBusinessDetails
    } = useEditorState();

    // Get color media libraries for the current user
    const {
        color: {
            accountColorLibraries,
            accountGroupColorLibraries,
            appliedBusinessColorLibraries,
            setShouldLoadColorLibraries,
        },
    } = useEditorMediaLibraries();

    useEffect(() => {
        setShouldLoadColorLibraries(true);
    }, [setShouldLoadColorLibraries]);

    // For now, we'll just treat the first color libraries as the "defaults" for accounts and businesses;
    // we don't currently have a mechanism by which an account or business can have more than one library
    // so this will work fine for the semi-foreseeable future
    const [defaultAccountColorLibrary] = accountColorLibraries;
    const [defaultBusinessColorLibrary] = appliedBusinessColorLibraries;

    return ( <
        > {
            defaultBusinessColorLibrary ? ( <
                ColorLibrarySection sectionDisplayName = {
                    `${appliedBusinessDetails?.businessName || 'Brand'} Colors`
                }
                colorLibrary = {
                    defaultBusinessColorLibrary
                }
                onSelectLibraryColor = {
                    onSelectLibraryColor
                }
                currentlySelectedColor = {
                    currentlySelectedColor
                }
                />
            ) : null
        } {
            defaultAccountColorLibrary && ( <
                ColorLibrarySection sectionDisplayName = "My Colors"
                colorLibrary = {
                    defaultAccountColorLibrary
                }
                onSelectLibraryColor = {
                    onSelectLibraryColor
                }
                currentlySelectedColor = {
                    currentlySelectedColor
                }
                />
            )
        } {
            accountGroupColorLibraries ? .map((colorLibrary) => ( <
                ColorLibrarySection key = {
                    colorLibrary.key
                }
                sectionDisplayName = {
                    colorLibrary.displayName
                }
                colorLibrary = {
                    colorLibrary
                }
                onSelectLibraryColor = {
                    onSelectLibraryColor
                }
                currentlySelectedColor = {
                    currentlySelectedColor
                }
                />
            ))
        } <
        ColorLibrarySection sectionDisplayName = {
            basicColorLibrary.displayName
        }
        colorLibrary = {
            basicColorLibrary
        }
        onSelectLibraryColor = {
            onSelectLibraryColor
        }
        currentlySelectedColor = {
            currentlySelectedColor
        }
        /> <
        />
    );
};
EditorColorLibrary.propTypes = {
    onSelectLibraryColor: PropTypes.func.isRequired,
    currentlySelectedColor: PropTypes.string,
};
EditorColorLibrary.defaultProps = {
    currentlySelectedColor: null,
};

export default EditorColorLibrary;