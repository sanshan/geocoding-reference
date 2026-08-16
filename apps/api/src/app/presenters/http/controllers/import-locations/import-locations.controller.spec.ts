import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ImportLocationsUseCase } from '../../../../application/use-cases/import-locations/import-locations.use-case';
import { ImportLocationsController } from './import-locations.controller';

describe('ImportLocationsController', () => {
    let app: INestApplication;
    let importLocationsUseCase: jest.Mocked<ImportLocationsUseCase>;

    beforeAll(async () => {
        const importLocationsUseCaseMock = {
            execute: jest.fn(),
        };

        const moduleRef: TestingModule = await Test.createTestingModule({
            controllers: [ImportLocationsController],
            providers: [
                {
                    provide: ImportLocationsUseCase,
                    useValue: importLocationsUseCaseMock,
                },
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();

        importLocationsUseCase =
            moduleRef.get<jest.Mocked<ImportLocationsUseCase>>(ImportLocationsUseCase);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should start import and return 202 Accepted', async () => {
        importLocationsUseCase.execute.mockResolvedValue({
            processed: 1000,
            inserted: 900,
            skipped: 100,
        });

        const response = await request(app.getHttpServer())
            .post('/api/geocoding/import')
            .expect(202);

        expect(response.body).toEqual({
            id: expect.any(String),
            status: 'running',
        });

        expect(importLocationsUseCase.execute).toHaveBeenCalledTimes(1);
        expect(importLocationsUseCase.execute).toHaveBeenCalledWith(response.body.id);
    });

    it('should return a valid UUID as import id', async () => {
        importLocationsUseCase.execute.mockResolvedValue({
            processed: 0,
            inserted: 0,
            skipped: 0,
        });

        const response = await request(app.getHttpServer())
            .post('/api/geocoding/import')
            .expect(202);

        expect(response.body.id).toEqual(expect.any(String));
        expect(response.body.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
    });

    it('should return immediately without waiting for import completion', async () => {
        importLocationsUseCase.execute.mockReturnValue(new Promise(() => undefined));

        const response = await request(app.getHttpServer())
            .post('/api/geocoding/import')
            .expect(202);

        expect(response.body).toEqual({
            id: expect.any(String),
            status: 'running',
        });

        expect(importLocationsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should use the same import id in the response and use case call', async () => {
        importLocationsUseCase.execute.mockResolvedValue({
            processed: 0,
            inserted: 0,
            skipped: 0,
        });

        const response = await request(app.getHttpServer())
            .post('/api/geocoding/import')
            .expect(202);

        const [importId] = importLocationsUseCase.execute.mock.calls[0] ?? [];

        expect(importId).toBe(response.body.id);
    });

    it('should still return 202 when the import fails after it has started', async () => {
        importLocationsUseCase.execute.mockRejectedValue(new Error('Import failed'));

        const response = await request(app.getHttpServer())
            .post('/api/geocoding/import')
            .expect(202);

        expect(response.body).toEqual({
            id: expect.any(String),
            status: 'running',
        });

        expect(importLocationsUseCase.execute).toHaveBeenCalledTimes(1);

        await new Promise<void>((resolve) => {
            setImmediate(resolve);
        });
    });
});
