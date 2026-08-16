import { Module } from '@nestjs/common';
import { ApiTypeormModule } from './persistence/typeorm/api-typeorm.module';
import { ApiConfigModule } from './config/api-config.module';
import { DatasetsModule } from './datasets/datasets.module';
import { GeocodingCacheModule } from './cache/cache.module';

@Module({
    imports: [ApiConfigModule, ApiTypeormModule, DatasetsModule, GeocodingCacheModule],
    exports: [ApiConfigModule, ApiTypeormModule, DatasetsModule, GeocodingCacheModule],
})
export class InfrastructureModule {}
