export type Fund = {
  id: string;
  fundCode: string;
  fundName?: string;
  amount: string;
  feeRate: string;
  createdAt: string;
  changeCount: number;
};

export type FundChange = {
  id: string;
  oldAmount: string | null;
  newAmount: string | null;
  oldFeeRate: string | null;
  newFeeRate: string | null;
  createdAt: string;
  opType: string | null;
  opAmount: string | null;
};

export type BacktestFundItem = {
  fundCode: string;
  fundName: string;
  percentage: string;
  amount: string;
};

export type Backtest = {
  id: string;
  name: string;
  totalAmount: string;
  createdAt: string;
  funds: {
    id: string;
    fundCode: string;
    fundName: string;
    percentage: string;
    amount: string;
  }[];
};
