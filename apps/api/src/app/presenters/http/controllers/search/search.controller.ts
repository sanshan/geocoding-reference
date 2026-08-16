import { Controller, Get, Query } from '@nestjs/common';
import { SearchLocationsUseCase } from '../../../../application/use-cases/search-locations/search-locations.use-case';
import { ZodValidationPipe } from '../../validation/zod-validation.pipe';
import type { LocationResultDto } from '../../dto/location-result.dto';
import { LocationResultMapper } from '../../mappers/location-result.mapper';
import { type SearchQueryDto, SearchQuerySchema } from './search-query.schema';

@Controller('geocoding')
export class SearchController {
    constructor(private readonly searchLocationsUseCase: SearchLocationsUseCase) {}

    @Get('search')
    async search(
        @Query(new ZodValidationPipe(SearchQuerySchema))
        query: SearchQueryDto,
    ): Promise<LocationResultDto[]> {
        const locations = await this.searchLocationsUseCase.execute(query.q);

        return LocationResultMapper.toDtoArray(locations);
    }
}
