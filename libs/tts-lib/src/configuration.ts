import { z } from 'zod';

/**
 * The common configuration is just a map of language code to preview text scripts.
 */
export const ProviderConfigurationSchema = z.object({
  previewText: z.record(z.string(), z.string()),
});

export type ProviderConfiguration = z.infer<typeof ProviderConfigurationSchema>;
