import { z } from 'zod';

const ConfirmationModalConfigOptions = z
  .object({
    shouldShow: z.boolean(),
    title: z.string(),
    body: z.string(),
    confirmButton: z.string(),
    cancelButton: z.string(),
  })
  .partial()
  .strict();

const LabelOptions = z
  .object({
    exitEditor: z.string(),
    completeVideo: z.string(),
    unsavedChangesConfirmation: ConfirmationModalConfigOptions,
    completeVideoConfirmation: ConfirmationModalConfigOptions,
  })
  .partial()
  .strict();

export const EditorOptionsZod = z
  .object({
    orientation: z.enum(['left', 'right']),
    labels: LabelOptions,
    // TODO: this option is deprecated but must remain
    // for now until Spectrum is updated to use the new API
    personalization: z
      .object({
        isDefault: z.boolean(),
      })
      .partial()
      .strict(),
    hideSaveButton: z.boolean(),
    panelButtons: z
      .object({
        shouldUseAdvancedDropdown: z.boolean(),
      })
      .partial()
      .strict(),
    backgroundColor: z.string(),
  })
  .partial()
  .strict();

export type EditorOptions = z.infer<typeof EditorOptionsZod>;
