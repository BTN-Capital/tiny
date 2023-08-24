import { Token, TradeType } from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v3-sdk";

// Interfaces
export enum TransactionState {
    Failed = "Failed",
    New = "New",
    Rejected = "Rejected",
    Sending = "Sending",
    Sent = "Sent",
  }

  // Pool
export interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
}

export type TokenTrade = Trade<Token, Token, TradeType>;

export interface TradeInfo {
  pool: PoolInfo;
  tokenIn: Token;
  tokenOut: Token;
  amount: number;
  trade: TokenTrade;
}
