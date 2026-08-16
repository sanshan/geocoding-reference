import type { ConfigType } from '@nestjs/config';
import { PassThrough } from 'node:stream';
import * as unzipper from 'unzipper';

import type { apiConfig } from '../../config/api.config';
import { GeoNamesLocationDatasetProvider } from './geonames-location-dataset.provider';

jest.mock('unzipper', () => ({
    ParseOne: jest.fn(),
}));

describe('GeoNamesLocationDatasetProvider', () => {
    const datasetUrl = 'https://example.test/US.zip';

    let provider: GeoNamesLocationDatasetProvider;

    beforeEach(() => {
        jest.resetAllMocks();

        const config = {
            dataset: {
                url: datasetUrl,
            },
        } as ConfigType<typeof apiConfig>;

        provider = new GeoNamesLocationDatasetProvider(config);

        jest.mocked(unzipper.ParseOne).mockImplementation(() => {
            return new PassThrough() as ReturnType<typeof unzipper.ParseOne>;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('stream', () => {
        it('should stream and normalize GeoNames records', async () => {
            mockFetch([
                geonamesRow({
                    zipCode: '90210',
                    city: 'Beverly Hills',
                    stateName: 'California',
                    stateCode: 'CA',
                    county: 'Los Angeles',
                    latitude: '34.0901',
                    longitude: '-118.4065',
                    accuracy: '4',
                }),
                geonamesRow({
                    zipCode: '10001',
                    city: 'New York City',
                    stateName: 'New York',
                    stateCode: 'NY',
                    county: 'New York',
                    latitude: '40.7484',
                    longitude: '-73.9967',
                    accuracy: '4',
                }),
            ]);

            const records = await collect(provider.stream());

            expect(fetch).toHaveBeenCalledWith(datasetUrl);

            expect(records).toEqual([
                {
                    zipCode: '90210',
                    city: 'Beverly Hills',
                    stateCode: 'CA',
                    stateName: 'California',
                    county: 'Los Angeles',
                    latitude: 34.0901,
                    longitude: -118.4065,
                    accuracy: 4,
                },
                {
                    zipCode: '10001',
                    city: 'New York City',
                    stateCode: 'NY',
                    stateName: 'New York',
                    county: 'New York',
                    latitude: 40.7484,
                    longitude: -73.9967,
                    accuracy: 4,
                },
            ]);
        });

        it('should normalize empty county and accuracy to null', async () => {
            mockFetch([
                geonamesRow({
                    county: '',
                    accuracy: '',
                }),
            ]);

            const records = await collect(provider.stream());

            expect(records).toEqual([
                expect.objectContaining({
                    county: null,
                    accuracy: null,
                }),
            ]);
        });

        it('should skip malformed rows and continue streaming', async () => {
            mockFetch([
                geonamesRow({
                    zipCode: '90210',
                }),
                geonamesRow({
                    zipCode: '',
                }),
                geonamesRow({
                    zipCode: '10001',
                }),
            ]);

            const records = await collect(provider.stream());

            expect(records).toHaveLength(2);
            expect(records.map((record) => record.zipCode)).toEqual(['90210', '10001']);
        });

        it('should skip rows with invalid coordinates', async () => {
            mockFetch([
                geonamesRow({
                    zipCode: '11111',
                    latitude: 'invalid',
                }),
                geonamesRow({
                    zipCode: '22222',
                    longitude: 'invalid',
                }),
                geonamesRow({
                    zipCode: '33333',
                }),
            ]);

            const records = await collect(provider.stream());

            expect(records).toHaveLength(1);
            expect(records[0]?.zipCode).toBe('33333');
        });

        it('should skip rows with invalid accuracy', async () => {
            mockFetch([
                geonamesRow({
                    zipCode: '11111',
                    accuracy: 'invalid',
                }),
                geonamesRow({
                    zipCode: '22222',
                    accuracy: '4',
                }),
            ]);

            const records = await collect(provider.stream());

            expect(records).toHaveLength(1);
            expect(records[0]?.zipCode).toBe('22222');
            expect(records[0]?.accuracy).toBe(4);
        });

        it('should correctly handle lines split across stream chunks', async () => {
            const first = geonamesRow({
                zipCode: '90210',
                city: 'Beverly Hills',
            });

            const second = geonamesRow({
                zipCode: '10001',
                city: 'New York City',
            });

            const content = `${first}\n${second}\n`;

            mockFetchChunks([
                content.slice(0, 17),
                content.slice(17, 43),
                content.slice(43, 79),
                content.slice(79),
            ]);

            const records = await collect(provider.stream());

            expect(records).toHaveLength(2);

            expect(records.map((record) => record.zipCode)).toEqual(['90210', '10001']);
        });

        it('should correctly handle multiple lines in one stream chunk', async () => {
            mockFetchChunks([
                [
                    geonamesRow({ zipCode: '90210' }),
                    geonamesRow({ zipCode: '10001' }),
                    geonamesRow({ zipCode: '33109' }),
                ].join('\n'),
            ]);

            const records = await collect(provider.stream());

            expect(records).toHaveLength(3);

            expect(records.map((record) => record.zipCode)).toEqual(['90210', '10001', '33109']);
        });

        it('should throw when GeoNames responds with non-success status', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable',
                body: null,
            } as Response);

            await expect(collect(provider.stream())).rejects.toThrow(
                'Failed to download GeoNames dataset: 503 Service Unavailable',
            );
        });

        it('should throw when GeoNames response has no body', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                body: null,
            } as Response);

            await expect(collect(provider.stream())).rejects.toThrow(
                'GeoNames dataset response body is empty',
            );
        });
    });

    function mockFetch(lines: string[]): void {
        mockFetchChunks([`${lines.join('\n')}\n`]);
    }

    function mockFetchChunks(chunks: string[]): void {
        const encoder = new TextEncoder();

        const body = new ReadableStream<Uint8Array>({
            start(controller) {
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(chunk));
                }

                controller.close();
            },
        });

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            body,
        } as Response);
    }

    function geonamesRow(
        overrides: Partial<{
            countryCode: string;
            zipCode: string;
            city: string;
            stateName: string;
            stateCode: string;
            county: string;
            adminCode2: string;
            adminName3: string;
            adminCode3: string;
            latitude: string;
            longitude: string;
            accuracy: string;
        }> = {},
    ): string {
        const row = {
            countryCode: 'US',
            zipCode: '90210',
            city: 'Beverly Hills',
            stateName: 'California',
            stateCode: 'CA',
            county: 'Los Angeles',
            adminCode2: '037',
            adminName3: '',
            adminCode3: '',
            latitude: '34.0901',
            longitude: '-118.4065',
            accuracy: '4',
            ...overrides,
        };

        return [
            row.countryCode,
            row.zipCode,
            row.city,
            row.stateName,
            row.stateCode,
            row.county,
            row.adminCode2,
            row.adminName3,
            row.adminCode3,
            row.latitude,
            row.longitude,
            row.accuracy,
        ].join('\t');
    }

    async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
        const result: T[] = [];

        for await (const item of iterable) {
            result.push(item);
        }

        return result;
    }
});
