import { Module } from '@nestjs/common';
import { ApiConfigModule } from '../../config/api-config.module';
import { GeoNamesLocationDatasetProvider } from './geonames-location-dataset.provider';
import { LocationDatasetProvider } from '../../../application/ports/location-dataset.provider';

@Module({
  imports: [ApiConfigModule],
  providers: [
    {
      provide: LocationDatasetProvider,
      useClass: GeoNamesLocationDatasetProvider,
    },
  ],
  exports: [LocationDatasetProvider],
})
export class GeoNamesDatasetModule {}