import { Module } from '@nestjs/common';
import { ImportLocationsStatusStore } from '../../application/ports/location-import-status-store.port';
import { CacheImportLocationsStatusStore } from './import-locations-status/in-memory-cache-import-locations-status.store';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        CacheModule.register({
            ttl: 60_000,
        }),
    ],
    providers: [
        {
            provide: ImportLocationsStatusStore,
            useClass: CacheImportLocationsStatusStore,
        },
    ],
    exports: [ImportLocationsStatusStore],
})
export class GeocodingCacheModule {}
