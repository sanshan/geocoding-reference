import { z } from 'zod';

export const SearchQuerySchema = z.object({
    q: z.string().trim().min(1).max(100),
});

export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;
