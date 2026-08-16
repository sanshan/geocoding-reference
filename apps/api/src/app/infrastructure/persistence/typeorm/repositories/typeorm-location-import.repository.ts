import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import {
    type InsertLocationsResult,
    LocationImportPort,
} from '../../../../application/ports/location-import.port';
import type { NewLocation } from '../../../../domain/new-location.vo';
import { LocationEntity } from '../entities/location.entity';
import { LocationMapper } from '../mappers/location.mapper';

@Injectable()
export class TypeOrmLocationImportRepository implements LocationImportPort {
    constructor(
        @InjectRepository(LocationEntity)
        private readonly repository: Repository<LocationEntity>,
    ) {}

    async insertMany(locations: NewLocation[]): Promise<InsertLocationsResult> {
        if (locations.length === 0) {
            return { inserted: 0 };
        }

        const result = await this.repository
            .createQueryBuilder()
            .insert()
            .into(LocationEntity)
            .values(LocationMapper.toPersistenceArray(locations))
            .orIgnore()
            .returning(['id'])
            .execute();

        return {
            inserted: result.raw.length,
        };
    }
}
