import { registerAs } from '@nestjs/config';
import { ApiEnvSchema } from './zpi.env.schema';

export const CONFIG_API_TOKEN = 'api';

export const apiConfig = registerAs(CONFIG_API_TOKEN, () => {
    const env = ApiEnvSchema.parse(process.env);

    return {
        database: {
            host: env.DB_HOST,
            port: env.DB_PORT,
            username: env.DB_USERNAME,
            password: env.DB_PASSWORD,
            name: env.DB_NAME,
        },
        dataset: {
            url: env.DATASET_URL,
        },
    };
});
