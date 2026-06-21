import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Project } from './project.entity';

export enum TransactionType {
  EXPENSE = 'expense',           // invest করা
  PROFIT = 'profit',             // monthly profit
  CAPITAL_RETURN = 'capital_return', // আসল টাকা ফেরত
}

@Entity()
export class ProjectTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int', nullable: true })
  capturedInMonth: number | null;

  @Column({ type: 'int', nullable: true })
  capturedInYear: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Project, project => project.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}