import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('wind_tile_frames')
export class WindTileFrame {
  @PrimaryColumn({ name: 'tile_key', type: 'text' })
  tileKey!: string;

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
