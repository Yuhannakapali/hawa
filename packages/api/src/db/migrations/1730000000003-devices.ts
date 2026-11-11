import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Devices1730000000003 implements MigrationInterface {
  name = 'Devices1730000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "devices" (
        "id" uuid PRIMARY KEY,
        "platform" text NOT NULL CHECK ("platform" IN ('web', 'android', 'ios')),
        "token" text NOT NULL UNIQUE,
        "level" text NOT NULL,
        "alert_time" text NOT NULL,
        "alert_site_ids" jsonb NOT NULL DEFAULT '[]',
        "last_alert_date" date,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "devices"`);
  }
}
