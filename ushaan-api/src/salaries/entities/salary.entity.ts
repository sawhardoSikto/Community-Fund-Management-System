import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Salary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  month: number;

  @Column()
  year: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  role: string; // admin, general_secretary, accountant

  @Column({ nullable: true })
  sheetId: number;

  @Column({ type: 'int', nullable: true })
  capturedInMonth: number | null;

  @Column({ type: 'int', nullable: true })
  capturedInYear: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}