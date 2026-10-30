import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1730000000000 implements MigrationInterface {
  name = 'Init1730000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sites" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL UNIQUE,
        "lat" double precision NOT NULL,
        "lon" double precision NOT NULL,
        "launch_alt_m" integer NOT NULL,
        "landing_alt_m" integer NOT NULL,
        "wind_sectors" jsonb NOT NULL,
        "min_level" text NOT NULL CHECK ("min_level" IN ('student', 'pilot')),
        "notes" text NOT NULL DEFAULT '',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "forecast_hours" (
        "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
        "time_utc" timestamptz NOT NULL,
        "model" text NOT NULL,
        "wind_10m_kmh" double precision NOT NULL,
        "gust_kmh" double precision NOT NULL,
        "dir_deg" double precision NOT NULL,
        "wind_1000m_kmh" double precision NOT NULL,
        "wind_1000m_dir_deg" double precision NOT NULL,
        "wind_2000m_kmh" double precision NOT NULL,
        "wind_2000m_dir_deg" double precision NOT NULL,
        "wind_3000m_kmh" double precision NOT NULL,
        "wind_3000m_dir_deg" double precision NOT NULL,
        "cape_jkg" double precision NOT NULL,
        "cloud_base_m" double precision NOT NULL,
        "rain_mm" double precision NOT NULL,
        "score_student" text NOT NULL,
        "score_pilot" text NOT NULL,
        "reason_student" text,
        "reason_pilot" text,
        "notes" jsonb NOT NULL,
        "fetched_at" timestamptz NOT NULL,
        PRIMARY KEY ("site_id", "time_utc", "model")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "forecast_hours_time_utc_idx" ON "forecast_hours" ("time_utc")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "forecast_hours"`);
    await queryRunner.query(`DROP TABLE "sites"`);
  }
}
