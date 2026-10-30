import type { CheckId, DegreeRange, PilotLevel, Rating, ScoreNote } from '@hawa/scoring';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  name!: string;

  @Column({ type: 'text', default: '' })
  region!: string;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lon!: number;

  @Column({ name: 'launch_alt_m', type: 'integer' })
  launchAltM!: number;

  @Column({ name: 'landing_alt_m', type: 'integer' })
  landingAltM!: number;

  @Column({ name: 'wind_sectors', type: 'jsonb' })
  windSectors!: DegreeRange[];

  @Column({ name: 'min_level', type: 'text' })
  minLevel!: PilotLevel;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('wind_grid_frames')
export class WindGridFrame {
  @PrimaryColumn({ name: 'time_utc', type: 'timestamptz' })
  timeUtc!: Date;

  @PrimaryColumn({ name: 'height_m', type: 'integer' })
  heightM!: number;

  @PrimaryColumn({ type: 'text' })
  model!: string;

  @Column({ type: 'real', array: true })
  u!: number[];

  @Column({ type: 'real', array: true })
  v!: number[];

  @Column({ name: 'fetched_at', type: 'timestamptz' })
  fetchedAt!: Date;
}

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
