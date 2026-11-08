import type { MigrationInterface, QueryRunner } from 'typeorm';

export class WindGrid1730000000002 implements MigrationInterface {
  name = 'WindGrid1730000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wind_tile_frames" (
        "tile_key" text NOT NULL,
        "time_utc" timestamptz NOT NULL,
        "height_m" integer NOT NULL,
        "model" text NOT NULL,
        "u" real[] NOT NULL,
        "v" real[] NOT NULL,
        "fetched_at" timestamptz NOT NULL,
        PRIMARY KEY ("tile_key", "time_utc", "height_m", "model")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wind_tile_fetches" (
        "id" bigserial PRIMARY KEY,
        "tile_key" text NOT NULL,
        "model" text NOT NULL,
        "calls" real NOT NULL,
        "fetched_at" timestamptz NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "wind_tile_fetches_fetched_at_idx" ON "wind_tile_fetches" ("fetched_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wind_tile_fetches"`);
    await queryRunner.query(`DROP TABLE "wind_tile_frames"`);
  }
}
