import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('Movies')
export class MovieOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  descriptions!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  author!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  trailer!: string | null;

  @Column({ type: 'enum', enum: ['2D', '3D'] })
  type!: '2D' | '3D';

  @Column({ type: 'int' })
  duration!: number;

  @Column({ name: 'release_date', type: 'datetime' })
  release_date!: Date;

  @Column({ name: 'end_date', type: 'datetime', nullable: true })
  end_date!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;
}

