import { randomUUID } from 'node:crypto';

import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ImportLocationsUseCase } from '../../../../application/use-cases/import-locations/import-locations.use-case';
import { StartImportResponseDto } from '../../dto/start-import-response.dto';

@Controller('geocoding')
export class ImportLocationsController {
    constructor(private readonly importLocationsUseCase: ImportLocationsUseCase) {}

    @Post('import')
    @HttpCode(HttpStatus.ACCEPTED)
    startImport(): StartImportResponseDto {
        const importId = randomUUID();

        void this.importLocationsUseCase.execute(importId).catch(() => {
            // failure event/logging will be added with EventBus in the next step
        });

        return {
            id: importId,
            status: 'running',
        };
    }
}
