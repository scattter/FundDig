import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Plan } from '../plan/plan.entity';

@Entity()
export class Fund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Plan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ length: 32 })
  fundCode: string;

  @Column({ length: 200, nullable: true })
  fundName?: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  feeRate: string;

  @CreateDateColumn()
  createdAt: Date;
}