import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TheaterOrmEntity } from './theater.orm-entity.js';

@Entity('Screens')
export class ScreenOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'int' })
  seat_capacity!: number;

  @Column()
  theater_id!: number;

  @ManyToOne(() => TheaterOrmEntity, t => t.screens, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'theater_id' })
  theater!: TheaterOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;
}


