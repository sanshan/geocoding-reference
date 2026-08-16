import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { LocationPort } from '../../../../application/ports/location.port';
import type { Location } from '../../../../domain/location.aggregate';
import { LocationEntity } from '../entities/location.entity';
import { LocationMapper } from '../mappers/location.mapper';

@Injectable()
export class TypeOrmLocationRepository implements LocationPort {
    constructor(
        @InjectRepository(LocationEntity)
        private readonly repository: Repository<LocationEntity>,
    ) {}

    async search(query: string): Promise<Location[]> {
        const normalizedQuery = query.toLowerCase();

        const entities = await this.repository
            .createQueryBuilder('location')
            .where('location."zipCode" LIKE :zipPrefix', {
                zipPrefix: `${query}%`,
            })
            .orWhere('LOWER(location.city) LIKE :cityPrefix', {
                cityPrefix: `${normalizedQuery}%`,
            })
            .orderBy(
                `
                CASE
                    WHEN location."zipCode" = :query THEN 0
                    WHEN LOWER(location.city) = :normalizedQuery THEN 1
                    ELSE 2
                END
                `,
                'ASC',
            )
            .addOrderBy('location.city', 'ASC')
            .addOrderBy('location."zipCode"', 'ASC')
            .setParameters({
                query,
                normalizedQuery,
            })
            .take(10)
            .getMany();

        return LocationMapper.toDomainArray(entities);
    }

    async findNearest(latitude: number, longitude: number): Promise<Location | null> {
        const entity = await this.repository
            .createQueryBuilder('location')
            .orderBy(
                `
            location.location <->
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
            `,
                'ASC',
            )
            .setParameters({
                latitude,
                longitude,
            })
            .take(1)
            .getOne();

        return entity ? LocationMapper.toDomain(entity) : null;
    }
}
