import type { MigrationInterface, QueryRunner } from 'typeorm';

export class WindGrid1730000000002 implements MigrationInterface {
  name = 'WindGrid1730000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wind_grid_frames" (
        "time_utc" timestamptz NOT NULL,
        "height_m" integer NOT NULL,
        "model" text NOT NULL,
        "u" real[] NOT NULL,
        "v" real[] NOT NULL,
        "fetched_at" timestamptz NOT NULL,
        PRIMARY KEY ("time_utc", "height_m", "model")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wind_grid_frames"`);
  }
}
