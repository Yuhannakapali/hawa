import type { DegreeRange, PilotLevel } from '@hawa/scoring';
import {
  Column,
  CreateDateColumn,
  Entity,
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
