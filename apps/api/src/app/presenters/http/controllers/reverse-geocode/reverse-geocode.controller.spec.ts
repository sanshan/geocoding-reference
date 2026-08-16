import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ReverseGeocodeUseCase } from '../../../../application/use-cases/reverse-geocode/reverse-geocode.use-case';
import { ReverseGeocodeController } from './reverse-geocode.controller';

describe('ReverseGeocodeController', () => {
    let app: INestApplication;
    let reverseGeocodeUseCase: jest.Mocked<ReverseGeocodeUseCase>;

    beforeAll(async () => {
        const reverseGeocodeUseCaseMock = {
            execute: jest.fn().mockResolvedValue(null),
        };

        const moduleRef: TestingModule = await Test.createTestingModule({
            controllers: [ReverseGeocodeController],
            providers: [
                {
                    provide: ReverseGeocodeUseCase,
                    useValue: reverseGeocodeUseCaseMock,
                },
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();

        reverseGeocodeUseCase =
            moduleRef.get<jest.Mocked<ReverseGeocodeUseCase>>(ReverseGeocodeUseCase);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('reverse', () => {
        it('should accept valid coordinates', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '40.7128',
                    longitude: '-74.006',
                })
                .expect(200);

            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledTimes(1);
            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledWith({
                latitude: 40.7128,
                longitude: -74.006,
            });
        });

        it('should return 400 when latitude is missing', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    longitude: '-74.006',
                })
                .expect(400);

            expect(reverseGeocodeUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when longitude is missing', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '40.7128',
                })
                .expect(400);

            expect(reverseGeocodeUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when latitude is below -90', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '-90.1',
                    longitude: '0',
                })
                .expect(400);

            expect(reverseGeocodeUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when latitude is above 90', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '90.1',
                    longitude: '0',
                })
                .expect(400);

            expect(reverseGeocodeUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when longitude is below -180', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '0',
                    longitude: '-180.1',
                })
                .expect(400);

            expect(reverseGeocodeUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when longitude is above 180', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '0',
                    longitude: '180.1',
                })
                .expect(400);

            expect(reverseGeocodeUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when latitude is not a number', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: 'foo',
                    longitude: '-74.006',
                })
                .expect(400);

            expect(reverseGeocodeUseCase.execute).not.toHaveBeenCalled();
        });

        it('should return 400 when longitude is not a number', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '40.7128',
                    longitude: 'bar',
                })
                .expect(400);

            expect(reverseGeocodeUseCase.execute).not.toHaveBeenCalled();
        });

        it('should accept latitude at the minimum boundary', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '-90',
                    longitude: '0',
                })
                .expect(200);

            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledTimes(1);
            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledWith({
                latitude: -90,
                longitude: 0,
            });
        });

        it('should accept latitude at the maximum boundary', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '90',
                    longitude: '0',
                })
                .expect(200);

            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledTimes(1);
            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledWith({
                latitude: 90,
                longitude: 0,
            });
        });

        it('should accept longitude at the minimum boundary', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '0',
                    longitude: '-180',
                })
                .expect(200);

            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledTimes(1);
            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledWith({
                latitude: 0,
                longitude: -180,
            });
        });

        it('should accept longitude at the maximum boundary', async () => {
            await request(app.getHttpServer())
                .get('/api/geocoding/reverse')
                .query({
                    latitude: '0',
                    longitude: '180',
                })
                .expect(200);

            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledTimes(1);
            expect(reverseGeocodeUseCase.execute).toHaveBeenCalledWith({
                latitude: 0,
                longitude: 180,
            });
        });
    });
});
