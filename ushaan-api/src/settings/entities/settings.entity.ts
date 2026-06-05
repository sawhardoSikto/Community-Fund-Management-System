import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  openingCashInHand: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  openingTotalInvested: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  openingTotalProfit: number;

  @Column({ default: 1 })
  openingMonth: number;

  @Column({ default: 2024 })
  openingYear: number;

  @Column({ nullable: true })
  setBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}