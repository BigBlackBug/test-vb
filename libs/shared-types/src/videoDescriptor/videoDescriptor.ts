import { z } from 'zod';

import { VideoConfiguration } from './videoConfiguration';
import { EditingForm } from './editingForm';
import { ProjectManifest } from './projectManifest';
import { TemplateManifest } from './templateManifest';

/**
 * TODO: Replace usage of DeprecatedVideoDescriptor in the autofill service with more specific AutofillVideoDescriptorThin/AutofillVideoDescriptorHydrated types
 *
 * DeprecatedVideoDescriptor is a subset of a template bundle combined with a variant configuration. The
 * bundle data can be populated lazily as needed, using the slug.
 */
export interface DeprecatedVideoDescriptor {
  templateSlug: string;

  // The variant configuration
  __activeConfiguration: VideoConfiguration;

  // Template bundle properties
  __cachedEditingForm?: EditingForm;

  projectManifest?: ProjectManifest;

  templateManifest?: TemplateManifest;
}

const activeConfiguration = z.instanceof(Object).transform((obj) => obj as VideoConfiguration);
const projectManifest = z.instanceof(Object).transform((obj) => obj as ProjectManifest);
const templateManifest = z.instanceof(Object).transform((obj) => obj as TemplateManifest);
const cachedEditingForm = z.instanceof(Object).transform((obj) => obj as EditingForm);

export const AutofillVideoDescriptorThinSchema = z.object({
  templateSlug: z.string(),
  __activeConfiguration: activeConfiguration,
});

/**
 * A thin video descriptor object which the autofill service may pass around which only includes
 * the template slug and the active configuration.
 *
 * Note that this will likely need to be expanded in the future to include more data as we start allowing
 * the autofill service to modify things outside of the active configuration.
 */
export type AutofillVideoDescriptorThin = z.infer<typeof AutofillVideoDescriptorThinSchema>;

export const AutofillVideoDescriptorHydratedSchema = AutofillVideoDescriptorThinSchema.extend({
  templateManifest,
  projectManifest,
  __cachedEditingForm: cachedEditingForm,
});

/**
 * A fully hydrated object with all available video descriptor data for use in the autofill service
 */
export type AutofillVideoDescriptorHydrated = z.infer<typeof AutofillVideoDescriptorHydratedSchema>;

export const VideoDescriptorSchema = z.object({
  __templateSlug: z.string(),
  // Use transforms to cast values to their proper types since we don't have these types defined with Zod
  __activeConfiguration: activeConfiguration,
  templateManifest: templateManifest,
  projectManifest: projectManifest,
});

/**
 * Core type with all essential video descriptor values.
 *
 * __templateSlug and __activeConfiguration are marked with dunderscores because they should be considered semi-temporary,
 * as we will are aiming to eventually reach a world where everything can be entirely dictated by the template and project manifests.
 */
export type VideoDescriptor = z.infer<typeof VideoDescriptorSchema>;
