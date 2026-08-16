import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SearchLocationsUseCase } from './use-cases/search-locations/search-locations.use-case';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ReverseGeocodeUseCase } from './use-cases/reverse-geocode/reverse-geocode.use-case';
import { ImportLocationsUseCase } from './use-cases/import-locations/import-locations.use-case';

@Module({
    imports: [InfrastructureModule, CqrsModule],
    providers: [SearchLocationsUseCase, ReverseGeocodeUseCase, ImportLocationsUseCase],
    exports: [SearchLocationsUseCase, ReverseGeocodeUseCase, ImportLocationsUseCase],
})
export class ApplicationModule {}
