import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class MemberOpeningBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPaid: number;

  @Column()
  upToMonth: number;

  @Column()
  upToYear: number;

  @Column({ nullable: true })
  setBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}