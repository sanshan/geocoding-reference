import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import * as unzipper from 'unzipper';

import {
    LocationDatasetProvider,
    type LocationDatasetRecord,
} from '../../../application/ports/location-dataset.provider';
import { apiConfig } from '../../config/api.config';

@Injectable()
export class GeoNamesLocationDatasetProvider extends LocationDatasetProvider {
    constructor(
        @Inject(apiConfig.KEY)
        private readonly config: ConfigType<typeof apiConfig>,
    ) {
        super();
    }

    async *stream(): AsyncIterable<LocationDatasetRecord> {
        const response = await fetch(this.config.dataset.url);

        if (!response.ok) {
            throw new Error(
                `Failed to download GeoNames dataset: ${response.status} ${response.statusText}`,
            );
        }

        if (!response.body) {
            throw new Error('GeoNames dataset response body is empty');
        }

        const archiveStream = Readable.fromWeb(response.body);

        const datasetStream = archiveStream.pipe(unzipper.ParseOne(/US\.txt$/));

        const lines = createInterface({
            input: datasetStream,
            crlfDelay: Infinity,
        });

        for await (const line of lines) {
            const record = this.parseLine(line);

            if (record) {
                yield record;
            }
        }
    }

    private parseLine(line: string): LocationDatasetRecord | null {
        const [
            ,
            zipCode,
            city,
            stateName,
            stateCode,
            county,
            ,
            ,
            ,
            latitudeValue,
            longitudeValue,
            accuracyValue,
        ] = line.split('\t');

        if (
            !zipCode?.trim() ||
            !city?.trim() ||
            !stateCode?.trim() ||
            !stateName?.trim() ||
            !latitudeValue?.trim() ||
            !longitudeValue?.trim()
        ) {
            return null;
        }

        const latitude = Number(latitudeValue);
        const longitude = Number(longitudeValue);
        const accuracy = accuracyValue?.trim() ? Number(accuracyValue) : null;

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            (accuracy !== null && !Number.isFinite(accuracy))
        ) {
            return null;
        }

        return {
            zipCode: zipCode.trim(),
            city: city.trim(),
            stateCode: stateCode.trim(),
            stateName: stateName.trim(),
            county: county?.trim() || null,
            latitude,
            longitude,
            accuracy,
        };
    }
}
