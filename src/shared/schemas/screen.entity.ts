import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Seat } from 'src/shared/schemas/seat.entity';
import { Showtime } from 'src/shared/schemas/showtime.entity'; 

@Entity('screens')
export class Screen {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Seat, (seat) => seat.screen)
  seats: Seat[];

  @OneToMany(() => Showtime, (showtime) => showtime.screen)
  showtimes: Showtime[];
  
}