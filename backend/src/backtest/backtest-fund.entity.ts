import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Backtest } from './backtest.entity';

@Entity()
export class BacktestFund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  backtestId: string;

  @ManyToOne(() => Backtest, (backtest) => backtest.funds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'backtestId' })
  backtest: Backtest;

  @Column({ length: 10 })
  fundCode: string;

  @Column({ length: 200 })
  fundName: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;
}
