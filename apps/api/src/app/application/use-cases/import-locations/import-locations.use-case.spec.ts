import type { EventBus } from '@nestjs/cqrs';

import type {
    LocationDatasetProvider,
    LocationDatasetRecord,
} from '../../ports/location-dataset.provider';
import type { LocationImportPort } from '../../ports/location-import.port';
import type { ImportLocationsStatusStore } from '../../ports/location-import-status-store.port';
import { ImportLocationsCompletedEvent } from './events/import-locations-completed.event';
import { ImportLocationsFailedEvent } from './events/import-locations-failed.event';
import { ImportLocationsProgressedEvent } from './events/import-locations-progressed.event';
import { ImportLocationsUseCase } from './import-locations.use-case';

describe('ImportLocationsUseCase', () => {
    const importId = 'import-123';

    let datasetProvider: jest.Mocked<LocationDatasetProvider>;
    let locationImportRepository: jest.Mocked<LocationImportPort>;
    let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;
    let statusStore: jest.Mocked<ImportLocationsStatusStore>;
    let useCase: ImportLocationsUseCase;

    beforeEach(() => {
        datasetProvider = {
            stream: jest.fn(),
        };

        locationImportRepository = {
            insertMany: jest.fn(),
        };

        eventBus = {
            publish: jest.fn(),
        };

        statusStore = {
            get: jest.fn(),
            setRunning: jest.fn(),
            setProgress: jest.fn(),
            setCompleted: jest.fn(),
            setFailed: jest.fn(),
        };

        useCase = new ImportLocationsUseCase(
            datasetProvider,
            locationImportRepository,
            eventBus as unknown as EventBus,
            statusStore,
        );
    });

    it('should return zero counters and publish completed event when dataset is empty', async () => {
        datasetProvider.stream.mockReturnValue(streamRecords([]));

        const result = await useCase.execute(importId);

        expect(locationImportRepository.insertMany).not.toHaveBeenCalled();

        expect(result).toEqual({
            processed: 0,
            inserted: 0,
            skipped: 0,
        });

        expect(eventBus.publish).toHaveBeenCalledTimes(1);
        expect(eventBus.publish).toHaveBeenCalledWith(
            new ImportLocationsCompletedEvent(importId, 0, 0, 0),
        );
    });

    it('should insert a partial batch and publish progress before completed', async () => {
        datasetProvider.stream.mockReturnValue(
            streamRecords([
                createRecord({
                    zipCode: '10001',
                    city: 'City One',
                }),
                createRecord({
                    zipCode: '10002',
                    city: 'City Two',
                }),
            ]),
        );

        locationImportRepository.insertMany.mockResolvedValue({
            inserted: 2,
        });

        const result = await useCase.execute(importId);

        expect(locationImportRepository.insertMany).toHaveBeenCalledTimes(1);

        expect(locationImportRepository.insertMany).toHaveBeenCalledWith([
            {
                zipCode: '10001',
                city: 'City One',
                stateCode: 'NY',
                stateName: 'New York',
                county: 'New York',
                coordinates: {
                    latitude: 40.7484,
                    longitude: -73.9967,
                },
                accuracy: 4,
            },
            {
                zipCode: '10002',
                city: 'City Two',
                stateCode: 'NY',
                stateName: 'New York',
                county: 'New York',
                coordinates: {
                    latitude: 40.7484,
                    longitude: -73.9967,
                },
                accuracy: 4,
            },
        ]);

        expect(result).toEqual({
            processed: 2,
            inserted: 2,
            skipped: 0,
        });

        expect(eventBus.publish).toHaveBeenCalledTimes(2);

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            1,
            new ImportLocationsProgressedEvent(importId, 2, 2, 0),
        );

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            2,
            new ImportLocationsCompletedEvent(importId, 2, 2, 0),
        );
    });

    it('should persist exactly one full batch of 1000 locations', async () => {
        const records = Array.from({ length: 1000 }, (_, index) =>
            createRecord({
                zipCode: String(index).padStart(5, '0'),
                city: `City ${index}`,
            }),
        );

        datasetProvider.stream.mockReturnValue(streamRecords(records));

        locationImportRepository.insertMany.mockResolvedValue({
            inserted: 1000,
        });

        const result = await useCase.execute(importId);

        expect(locationImportRepository.insertMany).toHaveBeenCalledTimes(1);
        expect(locationImportRepository.insertMany.mock.calls[0]?.[0]).toHaveLength(1000);

        expect(result).toEqual({
            processed: 1000,
            inserted: 1000,
            skipped: 0,
        });

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            1,
            new ImportLocationsProgressedEvent(importId, 1000, 1000, 0),
        );

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            2,
            new ImportLocationsCompletedEvent(importId, 1000, 1000, 0),
        );
    });

    it('should publish cumulative progress for multiple batches and the remaining partial batch', async () => {
        const records = Array.from({ length: 2500 }, (_, index) =>
            createRecord({
                zipCode: String(index).padStart(5, '0'),
                city: `City ${index}`,
            }),
        );

        datasetProvider.stream.mockReturnValue(streamRecords(records));

        locationImportRepository.insertMany
            .mockResolvedValueOnce({
                inserted: 900,
            })
            .mockResolvedValueOnce({
                inserted: 800,
            })
            .mockResolvedValueOnce({
                inserted: 400,
            });

        const result = await useCase.execute(importId);

        expect(locationImportRepository.insertMany).toHaveBeenCalledTimes(3);

        expect(locationImportRepository.insertMany.mock.calls[0]?.[0]).toHaveLength(1000);
        expect(locationImportRepository.insertMany.mock.calls[1]?.[0]).toHaveLength(1000);
        expect(locationImportRepository.insertMany.mock.calls[2]?.[0]).toHaveLength(500);

        expect(result).toEqual({
            processed: 2500,
            inserted: 2100,
            skipped: 400,
        });

        expect(eventBus.publish).toHaveBeenCalledTimes(4);

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            1,
            new ImportLocationsProgressedEvent(importId, 1000, 900, 100),
        );

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            2,
            new ImportLocationsProgressedEvent(importId, 2000, 1700, 300),
        );

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            3,
            new ImportLocationsProgressedEvent(importId, 2500, 2100, 400),
        );

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            4,
            new ImportLocationsCompletedEvent(importId, 2500, 2100, 400),
        );
    });

    it('should publish failed event and reject when repository insertion fails', async () => {
        const records = Array.from({ length: 1500 }, (_, index) =>
            createRecord({
                zipCode: String(index).padStart(5, '0'),
                city: `City ${index}`,
            }),
        );

        datasetProvider.stream.mockReturnValue(streamRecords(records));

        locationImportRepository.insertMany.mockRejectedValueOnce(
            new Error('Database insert failed'),
        );

        await expect(useCase.execute(importId)).rejects.toThrow('Database insert failed');

        expect(locationImportRepository.insertMany).toHaveBeenCalledTimes(1);
        expect(locationImportRepository.insertMany.mock.calls[0]?.[0]).toHaveLength(1000);

        expect(eventBus.publish).toHaveBeenCalledTimes(1);
        expect(eventBus.publish).toHaveBeenCalledWith(
            new ImportLocationsFailedEvent(importId, 'Database insert failed'),
        );
    });

    it('should preserve already persisted progress and publish failed event when provider fails later', async () => {
        datasetProvider.stream.mockReturnValue(
            (async function* () {
                for (let index = 0; index < 1000; index += 1) {
                    yield createRecord({
                        zipCode: String(index).padStart(5, '0'),
                        city: `City ${index}`,
                    });
                }

                throw new Error('Dataset failed');
            })(),
        );

        locationImportRepository.insertMany.mockResolvedValue({
            inserted: 900,
        });

        await expect(useCase.execute(importId)).rejects.toThrow('Dataset failed');

        expect(locationImportRepository.insertMany).toHaveBeenCalledTimes(1);
        expect(locationImportRepository.insertMany.mock.calls[0]?.[0]).toHaveLength(1000);

        expect(eventBus.publish).toHaveBeenCalledTimes(2);

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            1,
            new ImportLocationsProgressedEvent(importId, 1000, 900, 100),
        );

        expect(eventBus.publish).toHaveBeenNthCalledWith(
            2,
            new ImportLocationsFailedEvent(importId, 'Dataset failed'),
        );
    });

    it('should publish unknown error message for non-Error failures', async () => {
        datasetProvider.stream.mockReturnValue({
            [Symbol.asyncIterator]() {
                return {
                    next: async () => {
                        throw 'unexpected failure';
                    },
                };
            },
        });

        await expect(useCase.execute(importId)).rejects.toBe('unexpected failure');

        expect(eventBus.publish).toHaveBeenCalledTimes(1);
        expect(eventBus.publish).toHaveBeenCalledWith(
            new ImportLocationsFailedEvent(importId, 'Unknown import error'),
        );
    });
});

function createRecord(overrides: Partial<LocationDatasetRecord> = {}): LocationDatasetRecord {
    return {
        zipCode: '10001',
        city: 'New York',
        stateCode: 'NY',
        stateName: 'New York',
        county: 'New York',
        latitude: 40.7484,
        longitude: -73.9967,
        accuracy: 4,
        ...overrides,
    };
}

async function* streamRecords(
    records: LocationDatasetRecord[],
): AsyncIterable<LocationDatasetRecord> {
    for (const record of records) {
        yield record;
    }
}
