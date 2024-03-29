import { ethers, toNumber, Provider } from "ethers";
import { Currency, Token, TradeType } from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v3-sdk";

import { ERC20_ABI } from "./constants";
import { TransactionState } from "./interfaces";

export function fromReadableAmount(amount: number, decimals: number): bigint {
  return ethers.parseUnits(amount.toString(), decimals);
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return ethers.formatUnits(rawAmount, decimals);
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`;
}

export function importWallet(priKey: string, rpcUrl: string): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(priKey, provider);
}

export async function getCurrencyBalance(
  provider: Provider,
  address: string,
  currency: Currency
): Promise<string> {
  if (currency.isNative) {
    return ethers.formatEther(await provider.getBalance(address));
  }

  const ERC20Contract = new ethers.Contract(
    currency.address,
    ERC20_ABI,
    provider
  );
  const balance: number = await ERC20Contract.balanceOf(address);
  const decimals: number = await ERC20Contract.decimals();

  // Format with proper units (approximate)
  return toReadableAmount(balance, decimals);
}

export async function getCurrencyDecimals(
  provider: Provider,
  currency: Currency
): Promise<number> {
  // Handle ETH directly
  if (currency.isNative) {
    return 18;
  }

  // Get currency otherwise
  const ERC20Contract = new ethers.Contract(
    currency.address,
    ERC20_ABI,
    provider
  );
  const decimals: bigint = await ERC20Contract.decimals();
  return toNumber(decimals);
}


export async function sendTransaction(
  wallet: ethers.Wallet,
  transaction: ethers.TransactionRequest,
  noWait?: boolean
): Promise<TransactionState> {
  console.log("Send transaction for ...", wallet.address);
  const provider = wallet.provider;
  if (!provider) {
    console.error("Null provider");
    return TransactionState.Failed;
  }

  if (transaction.value) {
    transaction.value = BigInt(transaction.value);
  }

  // TODO: optimize gas price 
  const fee = await provider!.getFeeData();
  if ((await provider!.getNetwork()).chainId === 137n) {
    // Gas station
    transaction.gasPrice = fee.gasPrice! * 2n;
  } else {
    transaction.maxFeePerGas = fee.maxFeePerGas! * 2n;
    transaction.maxPriorityFeePerGas = fee.maxPriorityFeePerGas! * 2n;
  }

  const txRes = await wallet.sendTransaction(transaction);
  let receipt = null;

  while (!noWait && receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash);

      // set time out here
      if (receipt === null) continue;

    } catch (e) {
      console.log(`Receipt error:`, e);
      break;
    }
  }

  // Transaction was successful if status === 1 or won wait for result.
  if (receipt || noWait) {
    return TransactionState.Sent;
  } else {
    return TransactionState.Failed;
  }
}
