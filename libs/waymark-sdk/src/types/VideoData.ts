import { z } from 'zod';

export const VideoRenderStatusZodEnum = z.enum([
  'initial',
  'in_progress',
  'succeeded',
  'failed',
  'aborted',
]);
export type VideoRenderStatus = z.infer<typeof VideoRenderStatusZodEnum>;

export const VideoDataZod = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isPurchased: z.boolean(),
  name: z.string(),
  templateID: z.string(),
  renders: z.array(
    z.object({
      renderedAt: z.string().nullish(),
      format: z.enum(['broadcast_quality', 'email']),
      url: z.string(),
      status: VideoRenderStatusZodEnum,
    }),
  ),
});

export type VideoData = z.infer<typeof VideoDataZod>;
