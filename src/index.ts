import "dotenv/config";
import { Token } from "@uniswap/sdk-core";
import { program } from "commander";
import { exit } from "process";
import { Trading } from "./libs/trading";
import { loadTradeConfig } from "./tradeConfig";

import {
  getCurrencyBalance,
  getCurrencyDecimals,
} from "./libs/utils";

import { TransactionState } from './libs/interfaces'

async function runOnce(
  chainId: number,
  rpcUrl: string,
  privKey: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountToSwap: number,
  needApproval?: boolean,
  approvalMax?: boolean
): Promise<TransactionState> {
  const config = loadTradeConfig(chainId);
  if (!config) {
    console.error(`Invalid chain id ${chainId}`);
    exit(-1);
  }

  const Trade = new Trading(
    privKey,
    rpcUrl || config.rpc,
    config.chainId,
    config.poolFactoryAddress,
    config.swapRouterAddress,
    config.quoterAddress
  );

  /// correct decimals
  const tokenInDecimals = await getCurrencyDecimals(Trade.getProvider()!, new Token(config.chainId, tokenInAddress, 18));
  const tokenOutDecimals = await getCurrencyDecimals(Trade.getProvider()!, new Token(config.chainId, tokenOutAddress, 18));

  let tokenIn = new Token(config.chainId, tokenInAddress, tokenInDecimals);
  let tokenOut = new Token(config.chainId, tokenOutAddress, tokenOutDecimals);

  /// TODO: check balance and handle error
  const tokenInBalance = await getCurrencyBalance(Trade.getProvider()!, Trade.getWalletAddress()!, tokenIn);
  
  // console.log(`tokenInBalance: `, tokenInBalance);
  if (parseFloat(tokenInBalance) < amountToSwap) {
    return TransactionState.Rejected;
  }

  if (amountToSwap <= 0) {
    amountToSwap = parseFloat(tokenInBalance);
  }

  /// handle approval
  if (needApproval && tokenIn.isToken) {
    let ret;
    if (approvalMax) {
      ret = await Trade.getTokenApprovalMax(tokenIn);
    } else {
      ret = await Trade.getTokenTransferApproval(tokenIn, amountToSwap);
    }
    if (ret !== TransactionState.Sent) return TransactionState.Failed;
  }

  const tradeInfo = await Trade.createTrade(tokenIn, tokenOut, amountToSwap);

  const result = await Trade.executeTrade(tradeInfo);
  return result;
}

async function main() {
  program
    .name("bacoor-trading-cli")
    .description("CLI to trade tokens on uniswap.")
    .version("0.0.1");

  program
    .requiredOption("-n, --chain-id <string>", "The Chain ID of the network")
    .option("-u, --rpc-url <string>", "HTTP URL of the RPC endpoint")
    .option("-f, --config-file <string>", "The trade config file for batch trading")
    .option("-s, --amount-to-swap <string>", "Amount of tokens to swap.")
    .option("-i, --token-in <string>", "Address of the token to swap from")
    .option("-o, --token-out <string>", "Address of the token to swap to")
    .option("-m, --approval-max", "Approval max allowance for token", false)
    .option("-p, --needApproval", "Need approval or not for token", false);

  program.parse();

  let opts = program.opts();
  console.debug(opts);

  const config = loadTradeConfig(opts.chainId);
  if (!config) {
    console.error(`invalid chain id ${opts.chainId}`);
    exit(-1);
  }

  if (!opts.tokenIn) {
    console.error(`missing tokenIn address`);
    exit(-1);
  }
  if (!opts.tokenOut) {
    console.error(`missing tokenOut address`);
    exit(-1);
  }
  if (!opts.amountToSwap) {
    console.error(`missing amout to swap`);
    exit(-1);
  }

  await runOnce(
    opts.chainId,
    opts.rpcUrl,
    process.env.PRIVATE_KEY!,
    opts.tokenIn,
    opts.tokenOut,
    opts.amountToSwap,
    opts.needApproval,
    opts.approvalMax
  );

  console.log("Done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
