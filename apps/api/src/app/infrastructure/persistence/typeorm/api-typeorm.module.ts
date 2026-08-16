import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { apiConfig } from '../../config/api.config';
import { ApiConfigModule } from '../../config/api-config.module';
import { LocationEntity } from './entities/location.entity';
import { TypeOrmLocationRepository } from './repositories/typeorm-location.repository';
import { LocationPort } from '../../../application/ports/location.port';
import { LocationImportPort } from '../../../application/ports/location-import.port';
import { TypeOrmLocationImportRepository } from './repositories/typeorm-location-import.repository';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ApiConfigModule],
            inject: [apiConfig.KEY],
            useFactory: (config: ConfigType<typeof apiConfig>) => {
                const { name, host, port, username, password } = config.database;

                return {
                    type: 'postgres',
                    host,
                    port,
                    username,
                    password,
                    database: name,
                    synchronize: false,
                    logging: false,
                    autoLoadEntities: true,
                };
            },
        }),
        TypeOrmModule.forFeature([LocationEntity]),
    ],
    providers: [
        {
            provide: LocationPort,
            useClass: TypeOrmLocationRepository,
        },
        {
            provide: LocationImportPort,
            useClass: TypeOrmLocationImportRepository,
        },
    ],
    exports: [LocationPort, LocationImportPort],
})
export class ApiTypeormModule {}
