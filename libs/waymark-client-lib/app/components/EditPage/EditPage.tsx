// Vendor
import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

// Local
import Editor from 'editor/components/Editor.js';
import PageNotFoundPage from 'app/components/PageNotFoundPage.js';
import { RotatingLoader } from '@libs/shared-ui-components';
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
import { useIsWindowMobile } from 'app/hooks/windowBreakpoint.js';
import { useElementBoundingClientRect } from 'app/hooks/element';
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';
import { formatVariantForEditor, formatUserVideoForEditor } from 'editor/utils/editorVideo';
import {
  UnformattedUserVideoWithVideoDescriptor,
  UnformattedVideoTemplateVariant,
} from 'shared/api/types.js';
import { showAIVOOnboardingTour } from 'editor/utils/productTours';
import elementIDs from 'app/constants/elementIDs.js';
import { useTrackPageAnalytics } from 'app/hooks/analytics.js';

import { operations as userVideoOperations } from 'app/state/ducks/userVideos/index.js';
import { operations as variantOperations } from 'app/state/ducks/variants/index.js';
import { operations as shopOperations } from 'app/state/ducks/shop/index.js';
import * as selectors from 'app/state/selectors/index.js';

import { appURLs } from 'app/constants/urls.js';
import { goToInternalURL } from 'app/utils/urls.js';

import { useHideChat } from 'app/hooks/chat.js';
import { useSelectedBusinessGUID } from 'app/state/brandSelectionStore';

// Shared
import { VideoDescriptor } from '@libs/shared-types';
import { getBusinessDetailsByGUID } from 'shared/api/graphql/businesses/queries';

// Editor
import { AutomatedVoiceOverConfig, EditorUserVideo } from 'editor/types/userVideo';
import { EditorVariant } from 'editor/types/videoTemplateVariant';

// Providers
import EditorBusinessDetailProvider, {
  useEditorBusinessDetailContext,
} from './providers/BusinessDetailProvider.js';
import EditorColorLibraryProvider, {
  useEditorColorLibraryContext,
} from './providers/ColorLibraryProvider.js';
import EditorFontLibraryProvider, {
  useEditorFontLibraryContext,
} from './providers/FontLibraryProvider.js';
import EditorGlobalAudioLibraryProvider, {
  useGlobalAudioLibraryContext,
} from './providers/GlobalAudioLibraryProvider.js';
import EditorImageLibraryProvider, {
  useEditorImageLibraryContext,
} from './providers/ImageLibraryProvider.js';
import EditorVideoAssetLibraryProvider, {
  useEditorVideoAssetLibraryContext,
} from './providers/VideoAssetLibraryProvider.js';

import * as styles from './EditPage.css';

interface EditPageProps {
  previousVariantGroupSlug?: string | null;
}

function EditPage({ previousVariantGroupSlug = null }: EditPageProps) {
  useTrackPageAnalytics();

  const isMobile = useIsWindowMobile();

  // Keep chat widget disabled on this page for mobile users - will be restored when the page unmounts
  useHideChat(isMobile);

  // If a banner element is present on the page (ie, an account management override banner),
  // we need to provide its height to the editor so we can apply the correct padding to make sure the banner
  // doesn't cover any important contents
  const bannerElementClientRect = useElementBoundingClientRect(() =>
    document.getElementById(elementIDs.activeBanner),
  );
  const bannerElementHeight = bannerElementClientRect?.height ?? 0;

  const { userVideoGUID: userVideoGUIDParam, variantSlug: variantSlugParam } = useParams<{
    userVideoGUID?: string;
    variantSlug?: string;
  }>();

  const hasEditorLoadedRef = useRef(false);

  const [didEditorFailToLoad, setDidEditorFailToLoad] = useState(false);

  const [editorUserVideo, setEditorUserVideo] = useState<EditorUserVideo | null>(null);
  const [editorVariant, setEditorVariant] = useState<EditorVariant | null>(null);

  const [draftArchivedBusinessGUID, setDraftArchivedBusinessGUID] = useState<string | null>(null);

  const dispatch = useDispatch();

  const { accountName, isUserLoggedIn } = useSelector(
    (state) => ({
      accountName: selectors.getAccountName(state),
      isUserLoggedIn: selectors.isLoggedIn(state),
    }),
    _.isEqual,
  );

  const {
    allBusinessesForAccount,
    isLoadingAllBusinesses,
    refetchBusinessesForAccount,
    appliedBusinessGUID,
    setAppliedBusinessGUID,
    appliedBusinessDetails,
    isAppliedBusinessLoading,
    editingBusinessGUID,
    setEditingBusinessGUID,
    editingBusinessDetails,
    isEditingBusinessLoading,
  } = useEditorBusinessDetailContext();

  const colorLibraryContext = useEditorColorLibraryContext();
  const fontLibraryContext = useEditorFontLibraryContext();
  const globalAudioLibraryContext = useGlobalAudioLibraryContext();
  const imageLibraryContext = useEditorImageLibraryContext();
  const videoAssetLibraryContext = useEditorVideoAssetLibraryContext();

  const [, setSelectedBusinessGUID] = useSelectedBusinessGUID();

  useEffect(() => {
    // If the user has the AI VO feature enabled, show them an onboarding intercom tour
    // when they first load the editor (we store that it's been shown in localStorage
    // so it won't be shown on repeat visits)
    showAIVOOnboardingTour();
  }, []);

  // Load the opened UserVideo if necessary
  useEffect(() => {
    // Skip loading the video if...
    // 1. We already have a loaded editorUserVideo
    // 2. We don't have a user video GUID to load
    if (editorUserVideo || !userVideoGUIDParam) {
      return;
    }

    (async () => {
      try {
        const userVideo = await dispatch(userVideoOperations.loadUserVideo(userVideoGUIDParam));

        // We want to preserve archived businesses if the user doesn't select a new brand,
        // but it shouldn't appear in the UI anywhere
        const videoBusinessDetailsResponse = await getBusinessDetailsByGUID(userVideo.business);

        const wasBusinessPermissionDenied = Boolean(
          videoBusinessDetailsResponse?.error?.graphQLErrors?.[0]?.extensions?.permissionDenied,
        );
        const isBusinessVisible =
          videoBusinessDetailsResponse?.data?.businessByGuid?.isVisible ?? false;

        const businessIsArchived = wasBusinessPermissionDenied || !isBusinessVisible;

        setDraftArchivedBusinessGUID(businessIsArchived ? userVideo.business : null);

        const formattedUserVideo = formatUserVideoForEditor(userVideo, businessIsArchived);
        setEditorUserVideo(formattedUserVideo);

        const personalizedBusinessGUID = formattedUserVideo?.personalizedBusinessGUID ?? null;
        // When the draft is initially loaded, update our state to reflect the personalized business
        // applied to the video, if applicable
        setAppliedBusinessGUID(personalizedBusinessGUID);
        setSelectedBusinessGUID(personalizedBusinessGUID);

        editorEventEmitter.emit('loadedEditorUserVideo', formattedUserVideo);
      } catch (err) {
        console.error(err);
        // Emit an event to notify the SDK if the editor failed to open
        editorEventEmitter.emit('editorOpenFailed', err);
        setDidEditorFailToLoad(true);
      }
    })();
  }, [
    dispatch,
    editorUserVideo,
    userVideoGUIDParam,
    setAppliedBusinessGUID,
    setSelectedBusinessGUID,
  ]);

  // Get the slug for the variant that we need to load, either from the url or the user video
  const variantSlug = variantSlugParam || editorUserVideo?.variantSlug;

  // Get a stable reference to the editor user video so we can use it in our useEffect dependencies
  const stableEditorUserVideoRef = useRef<typeof editorUserVideo>();
  stableEditorUserVideoRef.current = editorUserVideo;

  // Load our base editor variant for the video
  useEffect(() => {
    if (!variantSlug) {
      return;
    }

    (async () => {
      // Pass `null` as the optional business GUID to ensure that new variants
      // are loaded without a business
      const variant: UnformattedVideoTemplateVariant = await dispatch(
        variantOperations.loadVariant(variantSlug, null),
      );
      const formattedVariant = await formatVariantForEditor(variant);
      setEditorVariant(formattedVariant);

      editorEventEmitter.emit('loadedEditorVariant', formattedVariant);

      // Emit `editorOpened` event to indicate that we've successfully loaded all
      // necessary data for the video and can now display the editor
      // NOTE: the SDK depends on this event being fired to know the editor is done loading
      editorEventEmitter.emit('editorOpened', stableEditorUserVideoRef.current);
    })();
  }, [dispatch, variantSlug]);

  /**
   * Creates a saved draft and user video record for this video if we don't have them or updates the existing user video record
   * with the given video spec and title
   * Memoizing this function with useCallback because it is used as a dependency of other react hooks in the EditorStateProvider
   */
  const createOrUpdateSavedDraft = useCallback(
    async ({
      videoDescriptor,
      videoTitle,
      businessGUID,
      automatedVoiceOverConfig,
      stockVideoAssetKeys,
      isFinalSaveBeforeClosing,
    }: {
      videoDescriptor: VideoDescriptor;
      videoTitle: string;
      businessGUID: string | null;
      automatedVoiceOverConfig: AutomatedVoiceOverConfig;
      stockVideoAssetKeys: string[];
      isFinalSaveBeforeClosing: boolean;
    }) => {
      if (!editorVariant) {
        throw new Error('Cannot create or update a saved draft without a loaded editor variant');
      }

      let createdOrUpdatedUserVideo: UnformattedUserVideoWithVideoDescriptor | null = null;
      let wasCreated = false;

      const userVideo = stableEditorUserVideoRef.current;

      if (userVideo) {
        let savedDraftBusinessGUID = businessGUID;

        if (!businessGUID && draftArchivedBusinessGUID) {
          // If there is no selected business but the draft was opened with an
          // archived business, preserve the archived business.
          //
          // NOTE: This isn't a perfect system. It's possible the user selected a different
          // brand and then deselected it (which probably means they intended to save it
          // without a brand selected), but since the selected business doesn't affect the
          // configuration on its own and the user would have to contact customer success
          // to restore the business, it's an edge case we're willing to live with.
          savedDraftBusinessGUID = draftArchivedBusinessGUID;
        }
        // If we already have a user video, just update it
        createdOrUpdatedUserVideo = await dispatch(
          userVideoOperations.saveVideoEdits({
            userVideoGUID: userVideo.guid,
            variantSlug: editorVariant.slug,
            videoDescriptor,
            businessGUID: savedDraftBusinessGUID,
            videoTitle,
            automatedVoiceOverConfig,
            stockVideoAssetKeys,
            isFinalSaveBeforeClosing,
          }),
        );
      } else {
        // If we don't have a user video, make a new one
        const { userVideo: createdUserVideo } = await dispatch(
          shopOperations.addVideoSpecToSavedDrafts({
            videoDescriptor,
            variantSlug: editorVariant.slug,
            businessGUID,
            videoTitle,
            automatedVoiceOverConfig,
            variantGroupSlug: previousVariantGroupSlug,
            stockVideoAssetKeys,
          }),
        );

        createdOrUpdatedUserVideo = createdUserVideo;
        wasCreated = true;
      }

      if (!createdOrUpdatedUserVideo) {
        throw new Error('Failed to create or update user video');
      }

      const formattedUserVideo = formatUserVideoForEditor(createdOrUpdatedUserVideo);
      setEditorUserVideo(formattedUserVideo);

      return {
        userVideo: formattedUserVideo,
        wasCreated,
      };
    },
    [editorVariant, draftArchivedBusinessGUID, dispatch, previousVariantGroupSlug],
  );

  // Navigates to the editor page for the given user video
  // Memoizing this function with useCallback because it is used as a dependency of other react hooks in the EditorStateProvider
  const openUserVideoInEditor = useCallback((userVideoGUIDToOpen) => {
    goToInternalURL(appURLs.editYourVideo(userVideoGUIDToOpen), true);
  }, []);

  if (didEditorFailToLoad) {
    return <PageNotFoundPage />;
  }

  if (!hasEditorLoadedRef.current) {
    // If this is the first time we're loading the editor and there are account businesses to load,
    // make sure we wait for those to finish before we display the editor
    // so we can initialize the editor with the correct panel if the personalization.isDefault
    // SDK option is set to true
    const isLoadingAccountBusinesses = isLoadingAllBusinesses && _.isEmpty(allBusinessesForAccount);

    hasEditorLoadedRef.current = !isLoadingAccountBusinesses;
  }

  const shouldShowLoadingState = !editorVariant || !hasEditorLoadedRef.current;

  return (
    <FadeSwitchTransition
      // Trigger a fade transition when the variant finishes loading so we can display the video player and editor panel
      transitionKey={shouldShowLoadingState ? 'loading' : 'loaded'}
      shouldFadeInOnMount
      className={styles.editPageTransitionWrapper}
      data-testid="editPage"
      data-current-variant-guid={`${_.get(editorVariant, 'guid')}`}
    >
      {shouldShowLoadingState ? (
        // If an error hasn't occurred but we don't have a variant yet, show a loading state
        <main className={styles.loadingSpinnerWrapper}>
          <RotatingLoader className={styles.loadingSpinner} />
        </main>
      ) : (
        <Editor
          key={editorVariant.slug}
          editorMediaLibraries={{
            audio: {
              globalAudio: globalAudioLibraryContext,
            },
            color: colorLibraryContext,
            font: fontLibraryContext,
            image: imageLibraryContext,
            video: videoAssetLibraryContext,
          }}
          editorVariant={editorVariant}
          // @ts-expect-error - TODO: convert Editor component to typescript
          editorUserVideo={editorUserVideo}
          accountName={accountName}
          allBusinessesForAccount={allBusinessesForAccount}
          isLoadingAllBusinesses={isLoadingAllBusinesses}
          refetchBusinessesForAccount={refetchBusinessesForAccount}
          appliedBusinessGUID={appliedBusinessGUID}
          setAppliedBusinessGUID={setAppliedBusinessGUID}
          appliedBusinessDetails={appliedBusinessDetails}
          isAppliedBusinessLoading={isAppliedBusinessLoading}
          editingBusinessGUID={editingBusinessGUID}
          setEditingBusinessGUID={setEditingBusinessGUID}
          editingBusinessDetails={editingBusinessDetails}
          isEditingBusinessLoading={isEditingBusinessLoading}
          isUserLoggedIn={isUserLoggedIn}
          createOrUpdateSavedDraft={createOrUpdateSavedDraft}
          openUserVideoInEditor={openUserVideoInEditor}
          bannerElementHeight={bannerElementHeight}
          isMobile={isMobile}
        />
      )}
    </FadeSwitchTransition>
  );
}

export default function EditPageWithProviders(props: EditPageProps) {
  return (
    <EditorBusinessDetailProvider>
      <EditorColorLibraryProvider>
        <EditorFontLibraryProvider>
          <EditorImageLibraryProvider>
            <EditorGlobalAudioLibraryProvider>
              <EditorVideoAssetLibraryProvider>
                <EditPage {...props} />
              </EditorVideoAssetLibraryProvider>
            </EditorGlobalAudioLibraryProvider>
          </EditorImageLibraryProvider>
        </EditorFontLibraryProvider>
      </EditorColorLibraryProvider>
    </EditorBusinessDetailProvider>
  );
}
