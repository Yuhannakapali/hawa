import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SiteRegion1730000000001 implements MigrationInterface {
  name = 'SiteRegion1730000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" ADD COLUMN "region" text NOT NULL DEFAULT ''`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "region"`);
  }
}
