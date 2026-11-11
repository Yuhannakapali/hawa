import type { AlertTime, DevicePlatform, PilotLevel } from '@hawa/contracts';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('devices')
export class Device {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  platform!: DevicePlatform;

  @Column({ type: 'text', unique: true })
  token!: string;

  @Column({ type: 'text' })
  level!: PilotLevel;

  @Column({ name: 'alert_time', type: 'text' })
  alertTime!: AlertTime;

  @Column({ name: 'alert_site_ids', type: 'jsonb' })
  alertSiteIds!: string[];

  @Column({ name: 'last_alert_date', type: 'date', nullable: true })
  lastAlertDate!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
