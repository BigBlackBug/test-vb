// Vendor
import {
    createContext,
    useContext
} from 'react';

// Editor
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    EditorVariant
} from 'editor/types/videoTemplateVariant';
import {
    EditorUserVideo
} from 'editor/types/userVideo';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';
import WaymarkAuthorBundleManager from 'shared/web_video/utils/WaymarkAuthorBundleManager.js';

const DEFAULT_EDITOR_VIDEO_CONTEXT = {
    editorVariant: null,
    editorUserVideo: null,
    isEditableTemplate: false,
};

const EditorVideoContext = createContext(DEFAULT_EDITOR_VIDEO_CONTEXT);

/**
 * @typedef {Object} EditorVideoContextValue
 *
 * @property {EditorVariant} editorVariant
 * @property {EditorUserVideo} editorUserVideo
 * @property {boolean} isEditableTemplate
 */

/**
 * @returns {EditorVideoContextValue}
 */
export const useEditorVideoContext = () => useContext(EditorVideoContext);

/**
 * Provides the editor with easy access to the current video's variant and user video (if applicable)
 *
 * @param {Object} props
 * @param {EditorVariant} props.editorVariant
 * @param {EditorUserVideo} props.editorUserVideo
 * @param {React.ReactNode} props.children
 */
export default function EditorVideoProvider({
    editorVariant,
    editorUserVideo,
    children
}) {
    const isWaymarkAuthorTemplate = WaymarkAuthorBundleManager.isWaymarkAuthorTemplate(
        editorVariant.videoTemplateSlug,
    );

    return ( <
        EditorVideoContext.Provider value = {
            {
                editorVariant,
                editorUserVideo,
                isEditableTemplate: isWaymarkAuthorTemplate
            }
        } >
        {
            children
        } <
        /EditorVideoContext.Provider>
    );
}
EditorVideoProvider.propTypes = {
    editorVariant: editorPropTypes.editorVariant.isRequired,
    editorUserVideo: editorPropTypes.editorUserVideo,
    children: sharedPropTypes.children.isRequired,
};
EditorVideoProvider.defaultProps = {
    editorUserVideo: null,
};