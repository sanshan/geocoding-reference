import { Module } from '@nestjs/common';
import { GeoNamesDatasetModule } from './geonames/geonames-dataset.module';

@Module({
  imports: [GeoNamesDatasetModule],
  exports: [GeoNamesDatasetModule],
})
export class DatasetsModule {}