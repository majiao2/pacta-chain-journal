import { useState } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet, getBalance, shortenAddress, isMetaMaskInstalled } from "@/lib/wallet";
import { Wallet } from "lucide-react";

export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled()) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setLoading(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      const bal = await getBalance(addr);
      setBalance(bal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (address) {
    return (
      <div className="paper-card px-3 py-1.5 flex items-center gap-2 text-sm">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="font-mono text-foreground">{shortenAddress(address)}</span>
        {balance && <span className="text-muted-foreground">{balance} AVAX</span>}
      </div>
    );
  }

  return (
    <Button variant="cyber" size="sm" onClick={handleConnect} disabled={loading}>
      <Wallet className="w-4 h-4" />
      {loading ? "连接中..." : "连接钱包"}
    </Button>
  );
}
