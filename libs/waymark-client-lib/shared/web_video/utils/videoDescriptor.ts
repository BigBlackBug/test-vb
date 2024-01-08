import {
  AutofillVideoDescriptorHydrated,
  AutofillVideoDescriptorThin,
  VideoDescriptor,
  VideoConfiguration,
} from '@libs/shared-types';

import WaymarkAuthorBundleManager from './WaymarkAuthorBundleManager';

interface UnformattedVideoSpec {
  variant_slug: string;
  configuration: VideoConfiguration | VideoDescriptor;
}

interface FormattedVideoSpec {
  variantSlug: string;
  // Video specs may have an old-style configuration or a new-style video descriptor
  configuration: VideoConfiguration | VideoDescriptor;
}

const isVideoDescriptor = (obj: unknown): obj is VideoDescriptor =>
  typeof obj === 'object' &&
  obj !== null &&
  '__templateSlug' in obj &&
  '__activeConfiguration' in obj &&
  'projectManifest' in obj &&
  'templateManifest' in obj;

/**
 * Takes a video spec or video descriptor in any of the various formats that they can sometimes be found in
 * and returns a fully formatted, sanitized VideoDescriptor object which we can pass around safely in the UI.
 */
export const getSanitizedVideoDescriptor = async (
  videoSpecOrVideoDescriptor:
    | UnformattedVideoSpec
    | FormattedVideoSpec
    | AutofillVideoDescriptorThin
    | AutofillVideoDescriptorHydrated
    | VideoDescriptor,
): Promise<VideoDescriptor> => {
  // If the object we received is already a good video descriptor, just return it
  if (isVideoDescriptor(videoSpecOrVideoDescriptor)) {
    return videoSpecOrVideoDescriptor;
  }

  // If we got a video spec object where the configuration is already a video descriptor, we can just return it
  if (
    'configuration' in videoSpecOrVideoDescriptor &&
    isVideoDescriptor(videoSpecOrVideoDescriptor.configuration)
  ) {
    return videoSpecOrVideoDescriptor.configuration;
  }

  if ('projectManifest' && 'templateManifest' in videoSpecOrVideoDescriptor) {
    return {
      __templateSlug: videoSpecOrVideoDescriptor.templateSlug,
      __activeConfiguration: videoSpecOrVideoDescriptor.__activeConfiguration,
      projectManifest: videoSpecOrVideoDescriptor.projectManifest,
      templateManifest: videoSpecOrVideoDescriptor.templateManifest,
    };
  }

  // At this point, we probably have either a video spec with an old-style configuration OR a thin autofill video descriptor,
  // so we'll need to fetch the template bundle to fill in the missing template manifest and project manifest
  let __templateSlug: string;
  let __activeConfiguration: VideoConfiguration;

  if ('templateSlug' in videoSpecOrVideoDescriptor) {
    __templateSlug = videoSpecOrVideoDescriptor.templateSlug;
  } else {
    __templateSlug = (
      'variant_slug' in videoSpecOrVideoDescriptor
        ? videoSpecOrVideoDescriptor.variant_slug
        : videoSpecOrVideoDescriptor.variantSlug
    ).split('.')[0];
  }

  if ('__activeConfiguration' in videoSpecOrVideoDescriptor) {
    __activeConfiguration = videoSpecOrVideoDescriptor.__activeConfiguration;
  } else {
    __activeConfiguration = videoSpecOrVideoDescriptor.configuration as VideoConfiguration;
  }

  const templateBundle = await WaymarkAuthorBundleManager.getBundleData(__templateSlug);
  const projectManifest = templateBundle.projectManifest;
  const templateManifest = templateBundle.templateManifest;

  return {
    __templateSlug,
    __activeConfiguration,
    projectManifest,
    templateManifest,
  };
};
