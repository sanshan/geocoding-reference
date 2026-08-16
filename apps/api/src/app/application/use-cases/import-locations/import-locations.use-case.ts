import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import type { NewLocation } from '../../../domain/new-location.vo';
import { LocationDatasetProvider } from '../../ports/location-dataset.provider';
import { LocationImportPort } from '../../ports/location-import.port';
import { ImportLocationsCompletedEvent } from './events/import-locations-completed.event';
import { ImportLocationsFailedEvent } from './events/import-locations-failed.event';
import { ImportLocationsProgressedEvent } from './events/import-locations-progressed.event';
import { ImportLocationsStatusStore } from '../../ports/location-import-status-store.port';

export interface ImportLocationsResult {
    processed: number;
    inserted: number;
    skipped: number;
}

@Injectable()
export class ImportLocationsUseCase {
    private static readonly BATCH_SIZE = 1000;

    constructor(
        private readonly datasetProvider: LocationDatasetProvider,
        private readonly locationImportRepository: LocationImportPort,
        private readonly eventBus: EventBus,
        private readonly statusStore: ImportLocationsStatusStore,
    ) {}

    async execute(importId: string): Promise<ImportLocationsResult> {
        const result: ImportLocationsResult = {
            processed: 0,
            inserted: 0,
            skipped: 0,
        };

        await this.statusStore.setRunning(importId);

        try {
            let batch: NewLocation[] = [];

            for await (const record of this.datasetProvider.stream()) {
                batch.push({
                    zipCode: record.zipCode,
                    city: record.city,
                    stateCode: record.stateCode,
                    stateName: record.stateName,
                    county: record.county,
                    coordinates: {
                        latitude: record.latitude,
                        longitude: record.longitude,
                    },
                    accuracy: record.accuracy,
                });

                if (batch.length >= ImportLocationsUseCase.BATCH_SIZE) {
                    await this.persistBatch(importId, batch, result);
                    batch = [];
                }
            }

            if (batch.length > 0) {
                await this.persistBatch(importId, batch, result);
            }

            await this.statusStore.setCompleted(importId, result);

            this.eventBus.publish(
                new ImportLocationsCompletedEvent(
                    importId,
                    result.processed,
                    result.inserted,
                    result.skipped,
                ),
            );

            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown import error';

            await this.statusStore.setFailed(importId, message);

            this.eventBus.publish(new ImportLocationsFailedEvent(importId, message));

            throw error;
        }
    }

    private async persistBatch(
        importId: string,
        batch: NewLocation[],
        result: ImportLocationsResult,
    ): Promise<void> {
        const insertResult = await this.locationImportRepository.insertMany(batch);

        result.processed += batch.length;
        result.inserted += insertResult.inserted;
        result.skipped += batch.length - insertResult.inserted;

        await this.statusStore.setProgress(importId, result);

        this.eventBus.publish(
            new ImportLocationsProgressedEvent(
                importId,
                result.processed,
                result.inserted,
                result.skipped,
            ),
        );
    }
}
