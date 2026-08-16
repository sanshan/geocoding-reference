import { Column, Entity, Index, type Point, PrimaryGeneratedColumn } from 'typeorm';

@Index('UQ_LOCATION_ZIP_CODE_CITY', ['zipCode', 'city'], {
    unique: true,
})
@Entity('locations')
export class LocationEntity {
    @PrimaryGeneratedColumn('identity')
    id!: number;

    @Index('IDX_LOCATION_ZIP_CODE_PREFIX', {
        synchronize: false,
    })
    @Column({
        type: 'varchar',
        length: 5,
        nullable: false,
    })
    zipCode!: string;

    @Column({
        type: 'varchar',
        length: 180,
        nullable: false,
    })
    city!: string;

    @Column({
        type: 'varchar',
        length: 2,
        nullable: false,
    })
    stateCode!: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false,
    })
    stateName!: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    county!: string | null;

    @Index('IDX_LOCATION_POINT', { spatial: true })
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: false,
    })
    location!: Point;

    @Column({
        type: 'smallint',
        nullable: true,
    })
    accuracy!: number | null;
}
