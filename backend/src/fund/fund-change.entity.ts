import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class FundChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ type: 'uuid' })
  fundId: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  oldAmount: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  newAmount: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  oldFeeRate: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  newFeeRate: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  opType: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  opAmount: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

