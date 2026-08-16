import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationSearchIndexes1786817238232 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_LOCATION_ZIP_CODE_PREFIX"
            ON "locations" ("zipCode" varchar_pattern_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_LOCATION_CITY_PREFIX"
            ON "locations" (LOWER("city") varchar_pattern_ops)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_LOCATION_CITY_PREFIX"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_LOCATION_ZIP_CODE_PREFIX"
        `);
    }
}
