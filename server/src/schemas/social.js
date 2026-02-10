import { z } from 'zod';

export const followSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const avatarSchema = z.object({
  avatar: z.string()
    .max(1_500_000, 'Avatar data too large')
    .regex(/^data:image\/(jpeg|png|gif|webp);base64,/, 'Invalid image data URI'),
});
