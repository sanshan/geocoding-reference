import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { SearchLocationsUseCase } from '../../../../application/use-cases/search-locations/search-locations.use-case';
import { SearchController } from './search.controller';

describe('SearchController', () => {
    let app: INestApplication;
    let searchLocationsUseCase: jest.Mocked<SearchLocationsUseCase>;

    beforeAll(async () => {
        const searchLocationsUseCaseMock = {
            execute: jest.fn().mockResolvedValue([]),
        };

        const moduleRef: TestingModule = await Test.createTestingModule({
            controllers: [SearchController],
            providers: [
                {
                    provide: SearchLocationsUseCase,
                    useValue: searchLocationsUseCaseMock,
                },
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();

        searchLocationsUseCase =
            moduleRef.get<jest.Mocked<SearchLocationsUseCase>>(SearchLocationsUseCase);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('search', () => {
        it('should accept a city query', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/search')
                .query({ q: 'New York' })
                .expect(200);

            expect(searchLocationsUseCase.execute).toHaveBeenCalledTimes(1);
            expect(searchLocationsUseCase.execute).toHaveBeenCalledWith('New York');
        });

        it('should trim the query', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/search')
                .query({ q: '  New York  ' })
                .expect(200);

            expect(searchLocationsUseCase.execute).toHaveBeenCalledTimes(1);
            expect(searchLocationsUseCase.execute).toHaveBeenCalledWith('New York');
        });

        it('should accept a ZIP code query', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/search')
                .query({ q: '10001' })
                .expect(200);

            expect(searchLocationsUseCase.execute).toHaveBeenCalledTimes(1);
            expect(searchLocationsUseCase.execute).toHaveBeenCalledWith('10001');
        });

        it('should return 400 when q is empty', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/search')
                .query({ q: '' })
                .expect(400);

            expect(searchLocationsUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when q is missing', async () => {
            await request(app.getHttpServer()).get('/api/geocoding/search').expect(400);

            expect(searchLocationsUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when q contains only whitespace', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/search')
                .query({ q: '   ' })
                .expect(400);

            expect(searchLocationsUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when q is longer than 100 characters', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/search')
                .query({ q: 'a'.repeat(101) })
                .expect(400);

            expect(searchLocationsUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when q is not a string', async () => {
            await request(app.getHttpServer()).get('/api/geocoding/search?q=foo&q=bar').expect(400);

            expect(searchLocationsUseCase.execute).not.toHaveBeenCalled();
        });
    });
});
