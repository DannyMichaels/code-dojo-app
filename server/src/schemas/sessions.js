import { z } from 'zod';

export const createSessionSchema = z.object({
  type: z.enum(['training', 'assessment', 'onboarding', 'kata']).default('training'),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(50000),
});
