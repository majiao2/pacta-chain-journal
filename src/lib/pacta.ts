export type FrequencyKey = "daily" | "weekdays" | "custom";

/** 已部署的 Pacta 合约 */
export const PACTA_ADDRESS = "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B" as const;

/** 与合约约定：0 每天 / 1 工作日 / 2 自定义（若链上不同请改此处） */
export const FREQUENCY_TO_UINT: Record<FrequencyKey, bigint> = {
  daily: 0n,
  weekdays: 1n,
  custom: 2n,
};

export const UINT_TO_FREQUENCY_LABEL: Record<string, string> = {
  "0": "每天",
  "1": "工作日",
  "2": "自定义",
};

const FUJI_CHAIN_HEX = "0xa869";

const ADD_CHAIN_PARAMS = {
  chainId: FUJI_CHAIN_HEX,
  chainName: "Avalanche Fuji Testnet",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://testnet.snowtrace.io"],
} as const;

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function isMetaMaskBrowser(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

/** MetaMask：添加 Fuji 网络 */
export async function addFujiEthereumChain(): Promise<void> {
  if (!window.ethereum) throw new Error("未检测到钱包");
  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [ADD_CHAIN_PARAMS],
  });
}

/** 先切换再添加（由调用方处理 4902） */
export async function switchFujiEthereumChain(): Promise<void> {
  if (!window.ethereum) throw new Error("未检测到钱包");
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: FUJI_CHAIN_HEX }],
  });
}
