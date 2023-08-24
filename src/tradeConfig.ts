import {
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  POOL_FACTORY_CONTRACT_ADDRESS,
} from "./libs/constants";

export interface ExampleConfig {
  chainId: number;
  name: string;
  rpc: string;
  poolFactoryAddress: string;
  quoterAddress: string;
  swapRouterAddress: string;
}

const CONTRACT_CONFIG: Array<ExampleConfig> = [
  {
    name: "eth-mainnet",
    chainId: 1,
    rpc: "https://eth.llamarpc.com",
    poolFactoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    quoterAddress: QUOTER_CONTRACT_ADDRESS,
    swapRouterAddress: SWAP_ROUTER_ADDRESS,
  },
  {
    name: "polygon-mainnet",
    chainId: 137,
    rpc: "https://poly-rpc.gateway.pokt.network",
    poolFactoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    quoterAddress: QUOTER_CONTRACT_ADDRESS,
    swapRouterAddress: SWAP_ROUTER_ADDRESS,
  },
];

export function loadTradeConfig(chainId: number): ExampleConfig | null {
  for (let index = 0; index < CONTRACT_CONFIG.length; index++) {
    const element = CONTRACT_CONFIG[index];
    if (element.chainId == chainId) {
      return element;
    }
  }
  return null;
}
