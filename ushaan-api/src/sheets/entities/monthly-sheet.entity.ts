import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum SheetStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity()
export class MonthlySheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  month: number;

  @Column()
  year: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalMemberIncome: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProjectIncome: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  previousBalance: number; // আগের মাসের cash in hand

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cashInHand: number; // এই মাসের শেষে হাতে আছে

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalInvested: number; // এখনো বাইরে আছে

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAsset: number; // cashInHand + totalInvested

  @Column({
    type: 'enum',
    enum: SheetStatus,
    default: SheetStatus.DRAFT,
  })
  status: SheetStatus;

  @Column({ nullable: true })
  publishedBy: number; // accountant id

  @Column({ nullable: true, type: 'timestamp' })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
totalProjectExpense: number; // ✅ নতুন
@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
totalGeneralExpense: number; // ✅ নতুন
}