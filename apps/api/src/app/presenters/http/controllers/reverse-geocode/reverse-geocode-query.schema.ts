import { z } from 'zod';

export const ReverseGeocodeQuerySchema = z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
});

export type ReverseGeocodeQueryDto = z.infer<typeof ReverseGeocodeQuerySchema>;
