import { resolve } from 'node:path';

import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { ApiEnvSchema } from '../../config/zpi.env.schema';
import { LocationEntity } from './entities/location.entity';

config({
    path: resolve(__dirname, '../../../../../../../.env'),
    quiet: true,
});

console.log('DATA SOURCE LOADED');

const validatedEnv = ApiEnvSchema.parse(process.env);

console.log('ENV VALIDATED', {
    host: validatedEnv.DB_HOST,
    port: validatedEnv.DB_PORT,
    database: validatedEnv.DB_NAME,
});

export const AppDataSource = new DataSource({
    type: 'postgres',

    host: validatedEnv.DB_HOST,
    port: validatedEnv.DB_PORT,
    username: validatedEnv.DB_USERNAME,
    password: validatedEnv.DB_PASSWORD,
    database: validatedEnv.DB_NAME,

    synchronize: false,
    logging: true,

    entities: [LocationEntity],

    migrations: [`${__dirname}/migrations/*{.ts,.js}`],

    migrationsRun: false,
});
