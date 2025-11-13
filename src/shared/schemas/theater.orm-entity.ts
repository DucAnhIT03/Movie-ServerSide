import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ScreenOrmEntity } from './screen.orm-entity.js';

@Entity('Theaters')
export class TheaterOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255 })
  location!: string;

  @Column({ length: 20 })
  phone!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;

  @OneToMany(() => ScreenOrmEntity, s => s.theater)
  screens!: ScreenOrmEntity[];
}


