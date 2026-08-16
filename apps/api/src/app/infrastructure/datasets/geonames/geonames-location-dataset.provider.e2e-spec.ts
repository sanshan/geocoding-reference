import { Test } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';

import { apiConfig } from '../../config/api.config';
import { ApiConfigModule } from '../../config/api-config.module';
import { GeoNamesLocationDatasetProvider } from './geonames-location-dataset.provider';

describe('GeoNamesLocationDatasetProvider e2e', () => {
    jest.setTimeout(30_000);

    it('should stream real records from GeoNames', async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ApiConfigModule],
            providers: [GeoNamesLocationDatasetProvider],
        }).compile();

        const config = moduleRef.get<ConfigType<typeof apiConfig>>(apiConfig.KEY);

        const provider = moduleRef.get(GeoNamesLocationDatasetProvider);

        expect(config.dataset.url).toBeTruthy();

        let count = 0;
        let firstRecord = null;

        for await (const record of provider.stream()) {
            firstRecord ??= record;
            count += 1;
        }

        expect(count).toBeGreaterThan(10_000);

        expect(firstRecord).toEqual(
            expect.objectContaining({
                zipCode: expect.any(String),
                city: expect.any(String),
                stateCode: expect.any(String),
                stateName: expect.any(String),
                latitude: expect.any(Number),
                longitude: expect.any(Number),
            }),
        );
    });
});
