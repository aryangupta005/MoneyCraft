/** Shared stock UI types (aligned with game `StockMarketManager` data). */
export interface Stock {
  id: string;
  name: string;
  currentPrice: number;
  priceHistory: number[];
  debtEquityRatio: number;
  businessGrowth: number;
  news: string[];
  marketCap: number;
  peRatio: number;
  eps: number;
  industryAvgPE: number;
  outstandingShares: number;
  volatility: number;
  lastUpdate: number;
  /** Present when data comes from the Phaser game layer */
  sector?: string;
}

export interface StockHolding {
  stockId: string;
  quantity: number;
  averagePurchasePrice: number;
  totalInvestment: number;
}

export interface StockTransaction {
  stockId: string;
  stockName: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
  total: number;
}

export interface PlayerPortfolio {
  holdings: StockHolding[];
  transactionHistory: StockTransaction[];
}

export interface MarketStatus {
  isOpen: boolean;
  trend: 'bull' | 'bear' | 'neutral';
  volatility: number;
  nextOpenTime: number;
  nextCloseTime: number;
}
