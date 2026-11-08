import type { CheckId, Rating, ScoreNote } from '@hawa/scoring';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Site } from './site.entity.js';

@Entity('forecast_hours')
export class ForecastHour {
  @PrimaryColumn({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @PrimaryColumn({ name: 'time_utc', type: 'timestamptz' })
  timeUtc!: Date;

  @PrimaryColumn({ type: 'text' })
  model!: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site?: Site;

  @Column({ name: 'wind_10m_kmh', type: 'double precision' })
  windKmh!: number;

  @Column({ name: 'gust_kmh', type: 'double precision' })
  gustKmh!: number;

  @Column({ name: 'dir_deg', type: 'double precision' })
  dirDeg!: number;

  @Column({ name: 'wind_1000m_kmh', type: 'double precision' })
  wind1000mKmh!: number;

  @Column({ name: 'wind_1000m_dir_deg', type: 'double precision' })
  wind1000mDirDeg!: number;

  @Column({ name: 'wind_2000m_kmh', type: 'double precision' })
  wind2000mKmh!: number;

  @Column({ name: 'wind_2000m_dir_deg', type: 'double precision' })
  wind2000mDirDeg!: number;

  @Column({ name: 'wind_3000m_kmh', type: 'double precision' })
  wind3000mKmh!: number;

  @Column({ name: 'wind_3000m_dir_deg', type: 'double precision' })
  wind3000mDirDeg!: number;

  @Column({ name: 'cape_jkg', type: 'double precision' })
  capeJkg!: number;

  @Column({ name: 'cloud_base_m', type: 'double precision' })
  cloudBaseM!: number;

  @Column({ name: 'rain_mm', type: 'double precision' })
  rainMm!: number;

  @Column({ name: 'score_student', type: 'text' })
  scoreStudent!: Rating;

  @Column({ name: 'score_pilot', type: 'text' })
  scorePilot!: Rating;

  @Column({ name: 'reason_student', type: 'text', nullable: true })
  reasonStudent!: CheckId | null;

  @Column({ name: 'reason_pilot', type: 'text', nullable: true })
  reasonPilot!: CheckId | null;

  @Column({ type: 'jsonb' })
  notes!: ScoreNote[];

  @Column({ name: 'fetched_at', type: 'timestamptz' })
  fetchedAt!: Date;
}
