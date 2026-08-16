import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationImportUniqueness1786862624126 implements MigrationInterface {
    name = 'AddLocationImportUniqueness1786862624126';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX "UQ_LOCATION_ZIP_CODE_CITY" ON "locations"  ("zipCode", "city") `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_LOCATION_ZIP_CODE_CITY"`);
    }
}
