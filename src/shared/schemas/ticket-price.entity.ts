import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SeatTypeEnum, MovieTypeEnum } from 'src/common/constrants/enums';
import { TheaterOrmEntity } from './theater.orm-entity.js';

@Entity('Ticket_Prices')
export class TicketPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: SeatTypeEnum,
    name: 'type_seat', 
  })
  typeSeat: SeatTypeEnum; 

  @Column({
    type: 'enum',
    enum: MovieTypeEnum,
    name: 'type_movie',
  })
  typeMovie: MovieTypeEnum;

  @Column({ name: 'theater_id', type: 'int', nullable: true })
  theaterId: number | null;

  @ManyToOne(() => TheaterOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'theater_id' })
  theater?: TheaterOrmEntity | null;

  @Column({ type: 'double' }) 
  price: number;

  @Column({
    name: 'day_type',
    type: 'bit',
    transformer: { 
      from: (v: Buffer) => v ? v[0] === 1 : null, 
      to: (v: boolean) => v 
    }
  })
  dayType: boolean; 

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;
}