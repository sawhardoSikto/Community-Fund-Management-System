import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'general_secretary', 'accountant', 'member'],
    default: 'member',
  })
  role: string;

  @Column({ type: 'int', default: 200 })
  monthlyAmount: number; // 200 বা 400

  @Column({ nullable: true })
  nid: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ default: false })
  isVerified: boolean; // OTP verify হলে true

  @Column({ nullable: true, type: 'varchar' })
  otp: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  otpExpiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}