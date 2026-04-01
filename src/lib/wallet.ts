declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

const FUJI_CONFIG = {
  chainId: "0xa869",
  chainName: "Avalanche Fuji Testnet",
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  blockExplorerUrls: ["https://testnet.snowtrace.io"],
};

export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) throw new Error("请安装 MetaMask 钱包");
  const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts.length) throw new Error("未获取到账户");
  await ensureFujiNetwork();
  return accounts[0];
}

export async function ensureFujiNetwork(): Promise<void> {
  if (!window.ethereum) return;
  const chainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
  if (chainId === FUJI_CONFIG.chainId) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: FUJI_CONFIG.chainId }],
    });
  } catch (err: unknown) {
    const error = err as { code?: number };
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [FUJI_CONFIG],
      });
    } else {
      throw err;
    }
  }
}

export async function getBalance(address: string): Promise<string> {
  if (!window.ethereum) return "0";
  const balance = (await window.ethereum.request({
    method: "eth_getBalance",
    params: [address, "latest"],
  })) as string;
  const wei = BigInt(balance);
  const avax = Number(wei) / 1e18;
  return avax.toFixed(4);
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
