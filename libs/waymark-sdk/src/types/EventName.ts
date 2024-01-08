import { z } from 'zod';

export const WaymarkEventNameZod = z.enum([
  'waymarkOpened',
  'waymarkOpenFailed',
  'editorExited',
  'editorOpened',
  'editorOpenFailed',
  'videoCompleted',
  'videoCreated',
  'videoRendered',
  'videoSaved',
  'error',
]);

export type WaymarkEventName = z.infer<typeof WaymarkEventNameZod>;
