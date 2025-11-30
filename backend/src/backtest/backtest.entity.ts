import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Plan } from '../plan/plan.entity';
import { BacktestFund } from './backtest-fund.entity';

@Entity()
export class Backtest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  planId: string;

  @Column({ length: 100, nullable: true })
  name: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalAmount: number;

  @OneToMany(() => BacktestFund, (fund) => fund.backtest, { cascade: true })
  funds: BacktestFund[];

  @CreateDateColumn()
  createdAt: Date;
}
