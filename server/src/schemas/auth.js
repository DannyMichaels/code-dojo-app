import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores'),
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferences: z.object({
    sessionLength: z.enum(['short', 'medium', 'long']).optional(),
    difficultyPreference: z.enum(['comfortable', 'challenging', 'intense']).optional(),
    feedbackStyle: z.enum(['encouraging', 'direct', 'minimal']).optional(),
  }).optional(),
});
