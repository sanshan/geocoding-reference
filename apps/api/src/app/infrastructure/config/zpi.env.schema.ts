import { z } from 'zod';

export const ApiEnvSchema = z.object({
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().int().min(1).max(65535),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    DATASET_URL: z.url(),
});
