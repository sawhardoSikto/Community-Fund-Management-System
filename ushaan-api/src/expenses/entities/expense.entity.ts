import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  MEETING = 'meeting',
  UTILITY = 'utility',
  OTHER = 'other',
}

@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER,
  })
  category: ExpenseCategory;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  addedBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addedBy' })
  user: User;
}