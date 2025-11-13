import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Booking } from 'src/shared/schemas/booking.entity';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name', length: 100, nullable: true })
  first_name?: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  last_name?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 11, nullable: true })
  phone?: string;

  @OneToMany(() => Booking, (b) => b.user)
  bookings: Booking[];
}
