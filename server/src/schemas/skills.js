import { z } from 'zod';

export const searchCatalogSchema = z.object({
  query: z.string().min(1, 'Query is required').max(100),
});

export const startSkillSchema = z.object({
  slug: z.string().min(1).max(100).optional(),
  query: z.string().min(1).max(100).optional(),
}).refine(data => data.slug || data.query, {
  message: 'Either slug or query is required',
});

export const updatePrivacySchema = z.object({
  isPublic: z.boolean(),
});
