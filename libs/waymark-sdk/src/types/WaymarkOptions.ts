import { z } from 'zod';
import { EditorOptionsZod } from './EditorOptions';
import { WaymarkCallbacksZod } from './WaymarkCallbacks';

const EnvironmentPresetsZod = z.enum(['demo', 'prod', 'local']);
export type EnvironmentPresets = z.infer<typeof EnvironmentPresetsZod>;

const AuthModeZod = z.enum(['uncontrolled', 'jwt']);
export type AuthMode = z.infer<typeof AuthModeZod>;

export const WaymarkOptionsZod = z.object({
  authMode: AuthModeZod.optional(),
  callbacks: WaymarkCallbacksZod.partial().optional(),
  domElement: z.instanceof(HTMLElement).optional(),
  environment: z
    .union([
      z.object({
        host: z.string(),
      }),
      EnvironmentPresetsZod,
    ])
    .optional(),
  editor: EditorOptionsZod.optional(),
  isDebug: z.boolean().optional(),
});

export type WaymarkOptions = z.infer<typeof WaymarkOptionsZod>;
