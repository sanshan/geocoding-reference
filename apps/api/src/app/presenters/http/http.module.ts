import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SearchController } from './controllers/search/search.controller';
import { ReverseGeocodeController } from './controllers/reverse-geocode/reverse-geocode.controller';
import { ApplicationModule } from '../../application/application.module';
import { ImportLocationsController } from './controllers/import-locations/import-locations.controller';
import { ImportLocationsEventsController } from './controllers/import-locations/import-locations-events.controller';
import { HealthController } from './controllers/health.controller';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';

@Module({
    imports: [ApplicationModule, CqrsModule, InfrastructureModule],
    controllers: [
        HealthController,
        SearchController,
        ReverseGeocodeController,
        ImportLocationsController,
        ImportLocationsEventsController,
    ],
    providers: [],
})
export class HttpModule {}
