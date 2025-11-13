import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ShowTimes')
export class ShowTimeOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  screen_id!: number;

  @Column()
  movie_id!: number;

  @Column({ name: 'start_time', type: 'datetime' })
  start_time!: Date;

  @Column({ name: 'end_time', type: 'datetime' })
  end_time!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;
}

