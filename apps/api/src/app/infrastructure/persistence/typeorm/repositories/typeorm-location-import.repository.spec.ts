import type { QueryRunner, Repository } from 'typeorm';

import type { NewLocation } from '../../../../domain/new-location.vo';
import { AppDataSource } from '../data-source';
import { LocationEntity } from '../entities/location.entity';
import { TypeOrmLocationImportRepository } from './typeorm-location-import.repository';

describe('TypeOrmLocationImportRepository', () => {
    let queryRunner: QueryRunner;
    let entityRepository: Repository<LocationEntity>;
    let repository: TypeOrmLocationImportRepository;

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        queryRunner = AppDataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        entityRepository = queryRunner.manager.getRepository(LocationEntity);
        repository = new TypeOrmLocationImportRepository(entityRepository);
    });

    afterAll(async () => {
        if (queryRunner?.isTransactionActive) {
            await queryRunner.rollbackTransaction();
        }

        await queryRunner?.release();

        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    it('inserts multiple locations and returns inserted count', async () => {
        const result = await repository.insertMany([
            createLocation({
                zipCode: '97101',
                city: 'Import City One',
            }),
            createLocation({
                zipCode: '97102',
                city: 'Import City Two',
            }),
        ]);

        expect(result).toEqual({
            inserted: 2,
        });

        const persisted = await entityRepository.find({
            where: [{ zipCode: '97101' }, { zipCode: '97102' }],
            order: {
                zipCode: 'ASC',
            },
        });

        expect(persisted).toHaveLength(2);
        expect(persisted.map((location) => location.zipCode)).toEqual(['97101', '97102']);
    });

    it('ignores a location with duplicate ZIP and city', async () => {
        await repository.insertMany([
            createLocation({
                zipCode: '97201',
                city: 'Existing Import City',
            }),
        ]);

        const result = await repository.insertMany([
            createLocation({
                zipCode: '97201',
                city: 'Existing Import City',
            }),
            createLocation({
                zipCode: '97202',
                city: 'New Import City',
            }),
        ]);

        expect(result).toEqual({
            inserted: 1,
        });

        const persisted = await entityRepository.find({
            where: [{ zipCode: '97201' }, { zipCode: '97202' }],
            order: {
                zipCode: 'ASC',
            },
        });

        expect(persisted).toHaveLength(2);

        expect(persisted[0]).toMatchObject({
            zipCode: '97201',
            city: 'Existing Import City',
        });

        expect(persisted[1]).toMatchObject({
            zipCode: '97202',
            city: 'New Import City',
        });
    });

    it('returns zero when every ZIP and city pair already exists', async () => {
        await repository.insertMany([
            createLocation({
                zipCode: '97301',
                city: 'Existing City One',
            }),
            createLocation({
                zipCode: '97302',
                city: 'Existing City Two',
            }),
        ]);

        const result = await repository.insertMany([
            createLocation({
                zipCode: '97301',
                city: 'Existing City One',
            }),
            createLocation({
                zipCode: '97302',
                city: 'Existing City Two',
            }),
        ]);

        expect(result).toEqual({
            inserted: 0,
        });
    });

    it('allows the same ZIP code for different cities', async () => {
        const result = await repository.insertMany([
            createLocation({
                zipCode: '96860',
                city: 'Jbphh',
            }),
            createLocation({
                zipCode: '96860',
                city: 'FPO AA',
            }),
        ]);

        expect(result).toEqual({
            inserted: 2,
        });

        const persisted = await entityRepository.find({
            where: {
                zipCode: '96860',
            },
            order: {
                city: 'ASC',
            },
        });

        expect(persisted).toHaveLength(2);
        expect(persisted.map((location) => location.city)).toEqual(['FPO AA', 'Jbphh']);
    });

    it('does not update an existing location on conflict', async () => {
        await repository.insertMany([
            createLocation({
                zipCode: '97601',
                city: 'Stable City',
                county: 'Original County',
            }),
        ]);

        const result = await repository.insertMany([
            createLocation({
                zipCode: '97601',
                city: 'Stable City',
                county: 'Changed County',
            }),
        ]);

        expect(result).toEqual({
            inserted: 0,
        });

        const persisted = await entityRepository.findOneByOrFail({
            zipCode: '97601',
            city: 'Stable City',
        });

        expect(persisted.county).toBe('Original County');
    });

    it('persists coordinates in longitude-latitude order', async () => {
        await repository.insertMany([
            createLocation({
                zipCode: '97401',
                city: 'Coordinate Import City',
                latitude: 34.0522,
                longitude: -118.2437,
            }),
        ]);

        const persisted = await entityRepository.findOneByOrFail({
            zipCode: '97401',
            city: 'Coordinate Import City',
        });

        expect(persisted.location.coordinates[0]).toBeCloseTo(-118.2437);
        expect(persisted.location.coordinates[1]).toBeCloseTo(34.0522);
    });

    it('persists nullable county and accuracy values', async () => {
        await repository.insertMany([
            createLocation({
                zipCode: '97501',
                city: 'Nullable Import City',
                county: null,
                accuracy: null,
            }),
        ]);

        const persisted = await entityRepository.findOneByOrFail({
            zipCode: '97501',
            city: 'Nullable Import City',
        });

        expect(persisted.county).toBeNull();
        expect(persisted.accuracy).toBeNull();
    });

    it('returns zero for an empty batch', async () => {
        const result = await repository.insertMany([]);

        expect(result).toEqual({
            inserted: 0,
        });
    });
});

function createLocation({
    zipCode,
    city,
    stateCode = 'CA',
    stateName = 'California',
    county = 'Los Angeles',
    latitude = 34.0522,
    longitude = -118.2437,
    accuracy = 4,
}: {
    zipCode: string;
    city: string;
    stateCode?: string;
    stateName?: string;
    county?: string | null;
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
}): NewLocation {
    return {
        zipCode,
        city,
        stateCode,
        stateName,
        county,
        coordinates: {
            latitude,
            longitude,
        },
        accuracy,
    };
}
