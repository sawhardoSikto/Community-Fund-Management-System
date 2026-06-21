import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IsInt, IsNotEmpty, IsString, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
export enum PaymentMethod {
  BKASH = 'bkash',
  NAGAD = 'nagad',
  CASH = 'cash',
  CARD = 'card',
  OTHER = 'other',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  month!: number; // 1-12

  @Column()
  year!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  bkashNumber!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ nullable: true })
  approvedBy!: number; // accountant id

  @Column({ nullable: true })
  note!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.BKASH,
  })
  paymentMethod!: PaymentMethod; // ✅ নতুন

  @Column({ nullable: true })
  transactionNumber!: string; // ✅ bKash/Nagad number বা transaction ID

  @Column({ type: 'text', nullable: true })
  coveredMonths!: string | null; // JSON array of covered months [{month, year}, ...]

  @Column({ nullable: true, type: 'timestamp' })
  approvedAt!: Date | null;

  @Column({ nullable: true })
  capturedInMonth!: number | null;

  @Column({ nullable: true })
  capturedInYear!: number | null;
}