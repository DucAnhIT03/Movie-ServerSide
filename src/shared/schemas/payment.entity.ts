import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Booking } from 'src/shared/schemas/booking.entity';
import { PaymentMethod, PaymentStatus } from 'src/common/constrants/enums';

@Entity('Payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking, booking => booking.payments)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod
  })
  payment_method: PaymentMethod;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  payment_status: PaymentStatus;

  @Column({ name: 'payment_time', type: 'datetime', nullable: true })
  payment_time?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: false })
  amount: number;

  @Column({ name: 'transaction_id', type: 'varchar', length: 255, nullable: true })
  transaction_id?: string;

  @Column({ name: 'payment_url', type: 'text', nullable: true })
  payment_url?: string;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qr_code?: string;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expires_at?: Date;
}
