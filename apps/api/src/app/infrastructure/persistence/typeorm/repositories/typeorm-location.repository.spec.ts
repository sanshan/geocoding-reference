import type { QueryRunner, Repository } from 'typeorm';

import { AppDataSource } from '../data-source';
import { LocationEntity } from '../entities/location.entity';
import { TypeOrmLocationRepository } from './typeorm-location.repository';

describe('TypeOrmLocationRepository', () => {
    let queryRunner: QueryRunner;
    let entityRepository: Repository<LocationEntity>;
    let repository: TypeOrmLocationRepository;

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        queryRunner = AppDataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        entityRepository = queryRunner.manager.getRepository(LocationEntity);
        repository = new TypeOrmLocationRepository(entityRepository);

        await entityRepository.save([
            createLocation({
                zipCode: '99101',
                city: 'Zz Search City',
            }),
            createLocation({
                zipCode: '99102',
                city: 'Zz Search City',
            }),
            createLocation({
                zipCode: '99103',
                city: 'Zz Search City Extra',
            }),
            createLocation({
                zipCode: '99201',
                city: 'Other Integration City',
            }),

            createLocation({
                zipCode: '99301',
                city: 'Nearest New York',
                longitude: -73.9857,
                latitude: 40.7484,
            }),
            createLocation({
                zipCode: '99302',
                city: 'Nearest Los Angeles',
                longitude: -118.2437,
                latitude: 34.0522,
            }),
            createLocation({
                zipCode: '99303',
                city: 'Nearest Chicago',
                longitude: -87.6298,
                latitude: 41.8781,
            }),

            ...Array.from({ length: 12 }, (_, index) =>
                createLocation({
                    zipCode: `98${String(index).padStart(3, '0')}`,
                    city: `Limit Test City ${String(index).padStart(2, '0')}`,
                }),
            ),
        ]);
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

    describe('search', () => {
        it('finds an exact ZIP code', async () => {
            const result = await repository.search('99101');

            expect(result.map((location) => location.zipCode)).toContain('99101');
        });

        it('finds ZIP codes by prefix', async () => {
            const result = await repository.search('991');

            expect(result.length).toBeGreaterThan(0);
            expect(result.every((location) => location.zipCode.startsWith('991'))).toBe(true);
        });

        it('finds an exact city', async () => {
            const result = await repository.search('Zz Search City');

            expect(result.some((location) => location.city === 'Zz Search City')).toBe(true);
        });

        it('finds a city by prefix', async () => {
            const result = await repository.search('Zz Search');

            expect(result.some((location) => location.city === 'Zz Search City')).toBe(true);
        });

        it('searches city names case-insensitively', async () => {
            const result = await repository.search('zz search city');

            expect(result.some((location) => location.city === 'Zz Search City')).toBe(true);
        });

        it('searches uppercase city prefixes case-insensitively', async () => {
            const result = await repository.search('ZZ SEARCH');

            expect(result.some((location) => location.city === 'Zz Search City')).toBe(true);
        });

        it('does not perform substring city search', async () => {
            const result = await repository.search('Search City');

            expect(result.some((location) => location.city === 'Zz Search City')).toBe(false);
        });

        it('returns an empty array when nothing matches', async () => {
            const result = await repository.search('Definitely Missing Location');

            expect(result).toEqual([]);
        });

        it('returns no more than 10 results', async () => {
            const result = await repository.search('98');

            expect(result).toHaveLength(10);
        });

        it('ranks an exact ZIP match before weaker ZIP prefix matches', async () => {
            const result = await repository.search('99101');

            expect(result[0]?.zipCode).toBe('99101');
        });

        it('ranks an exact city match before weaker city prefix matches', async () => {
            const result = await repository.search('Zz Search City');

            expect(result[0]?.city).toBe('Zz Search City');
        });

        it('orders equal-strength city matches by city and ZIP code', async () => {
            const result = await repository.search('Zz Search City');

            const matchingZipCodes = result
                .filter((location) => location.city === 'Zz Search City')
                .map((location) => location.zipCode);

            expect(matchingZipCodes).toEqual(['99101', '99102']);
        });

        it('maps persisted entities to domain locations', async () => {
            const result = await repository.search('99302');

            expect(result[0]).toMatchObject({
                zipCode: '99302',
                city: 'Nearest Los Angeles',
                stateCode: 'NY',
                stateName: 'New York',
            });

            expect(result[0]?.coordinates.latitude).toBeCloseTo(34.0522);
            expect(result[0]?.coordinates.longitude).toBeCloseTo(-118.2437);
        });
    });

    describe('findNearest', () => {
        it('returns the location at the exact requested coordinates', async () => {
            const result = await repository.findNearest(34.0522, -118.2437);

            expect(result).not.toBeNull();
            expect(result?.zipCode).toBe('99302');
            expect(result?.city).toBe('Nearest Los Angeles');
        });

        it('returns the closest location when coordinates are near a stored point', async () => {
            const result = await repository.findNearest(41.88, -87.63);

            expect(result).not.toBeNull();
            expect(result?.zipCode).toBe('99303');
            expect(result?.city).toBe('Nearest Chicago');
        });

        it('uses longitude and latitude in the correct coordinate order', async () => {
            const result = await repository.findNearest(34.0522, -118.2437);

            expect(result?.zipCode).toBe('99302');
        });

        it('returns the geographically closest location instead of the first persisted row', async () => {
            const result = await repository.findNearest(41.8781, -87.6298);

            expect(result?.zipCode).toBe('99303');
            expect(result?.zipCode).not.toBe('99101');
        });

        it('maps the nearest entity to the domain model', async () => {
            const result = await repository.findNearest(34.0522, -118.2437);

            expect(result).not.toBeNull();

            expect(result).toMatchObject({
                zipCode: '99302',
                city: 'Nearest Los Angeles',
                stateCode: 'NY',
                stateName: 'New York',
            });

            expect(result?.coordinates.latitude).toBeCloseTo(34.0522);
            expect(result?.coordinates.longitude).toBeCloseTo(-118.2437);
        });

        it('returns a location even when the requested coordinates are far away', async () => {
            const result = await repository.findNearest(0, 0);

            expect(result).not.toBeNull();
        });
    });
});

function createLocation({
    zipCode,
    city,
    longitude = -73.9857,
    latitude = 40.7484,
}: {
    zipCode: string;
    city: string;
    longitude?: number;
    latitude?: number;
}): Omit<LocationEntity, 'id'> {
    return {
        zipCode,
        city,
        stateCode: 'NY',
        stateName: 'New York',
        county: null,
        location: {
            type: 'Point',
            coordinates: [longitude, latitude],
        },
        accuracy: 4,
    };
}
