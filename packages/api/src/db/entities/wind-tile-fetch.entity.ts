import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wind_tile_fetches')
export class WindTileFetch {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ name: 'tile_key', type: 'text' })
  tileKey!: string;

  @Column({ type: 'text' })
  model!: string;

  @Column({ type: 'real' })
  calls!: number;

  @Column({ name: 'fetched_at', type: 'timestamptz' })
  fetchedAt!: Date;
}
