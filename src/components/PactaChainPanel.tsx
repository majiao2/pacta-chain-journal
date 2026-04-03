import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useConfig } from "wagmi";
import { formatEther } from "viem";
import { toast } from "sonner";
import { Check, Gift, Link2, Loader2, Flame, CalendarCheck, Clock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pactaAbi } from "@/abi/pactaAbi";
import { PACTA_ADDRESS } from "@/lib/pacta";
import { avalancheFuji } from "@/lib/chains";
import { usePactaDashboard, type DashboardPact } from "@/hooks/usePactaDashboard";
import { cn } from "@/lib/utils";

export type PactaChainPanelProps = {
  variant?: "default" | "compact";
  title?: string;
  className?: string;
  hideRewardPool?: boolean;
};

function isCheckedToday(lastCheckin: bigint): boolean {
  if (lastCheckin === 0n) return false;
  const lastMs = Number(lastCheckin) * 1000;
  const now = new Date();
  const last = new Date(lastMs);
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

const ENCOURAGEMENT_DURATION_MS = 5000;

export default function PactaChainPanel({
  variant = "default",
  title = "链上契约",
  className,
  hideRewardPool = false,
}: PactaChainPanelProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isFuji = chainId === FUJI_CHAIN_ID;
  const queryClient = useQueryClient();
  const config = useConfig();
  const chain = config.chains.find((c) => c.id === chainId);
  const { rewardPoolWei, myPacts, isLoading } = usePactaChainReads();

  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isSuccess || !txHash || !pendingAction) return;

    void (async () => {
      try {
        if (pendingAction.kind === "checkin") {
          const result = await recordBackendCheckin({
            pactId: pendingAction.pact.id.toString(),
            txHash,
          });
          toast.success(result.encouragement ?? "打卡成功", {
            description: result.summary ?? "后端记录已同步，可继续查看阶段总结。",
            duration: ENCOURAGEMENT_DURATION_MS,
          });
        } else {
          await claimBackendReward({ pactId: pendingAction.pact.id.toString() });
          toast.success("奖励领取交易已确认");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "同步后端失败";
        toast.error(msg);
      } finally {
        setTxHash(undefined);
        setPendingAction(null);
      }
    })();
  }, [claimBackendReward, isSuccess, pendingAction, recordBackendCheckin, refresh, txHash]);

  const poolDisplay =
    rewardPoolWei !== undefined
      ? `${Number.parseFloat(formatEther(rewardPoolWei)).toFixed(4)} AVAX`
      : "—";

  const runTx = async (label: string, fn: () => Promise<`0x${string}`>) => {
    setPendingOp(label);
    try {
      const h = await fn();
      setTxHash(h);
      toast.message("已在钱包中提交，等待区块确认…");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "交易失败";
      toast.error(msg);
      setPendingOp(null);
    }

    if (!address) {
      toast.error("请先连接钱包");
      return;
    }
    setPendingAction({ kind: "checkin", pact: p });
    void writeContractAsync({
        account: address,
        address: PACTA_ADDRESS,
        abi: pactaAbi,
        functionName: "checkin",
        args: [p.id],
        account: address,
        chain,
      } as any),
    );
  };

  const onClaim = (p: DashboardPact) => {
    if (demoMode) {
      setPendingAction({ kind: "claim", pact: p });
      void claimBackendReward({ pactId: p.id.toString() })
        .then(() => {
          toast.success("演示奖励已领取");
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : "领取失败";
          toast.error(msg);
        })
        .finally(() => {
          setPendingAction(null);
        });
      return;
    }

    if (!address) {
      toast.error("请先连接钱包");
      return;
    }
    setPendingAction({ kind: "claim", pact: p });
    void writeContractAsync({
        account: address,
        address: PACTA_ADDRESS,
        abi: pactaAbi,
        functionName: "claimReward",
        args: [p.id],
        account: address,
        chain,
      } as any),
    );
  };

  const busy = isWritePending || isConfirming || !!pendingAction || isRecordingCheckin || isClaimingReward;

  return (
    <section className={cn("w-full", className)}>
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4",
          variant === "compact" && "mb-3",
        )}
      >
        <h2
          className={cn(
            "font-hand font-bold text-foreground",
            variant === "compact" ? "text-2xl" : "text-3xl",
          )}
        >
          {title}
        </h2>
        <a
          href={`https://testnet.snowtrace.io/address/${PACTA_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-sans"
        >
          <Link2 className="w-3.5 h-3.5" />
          Snowtrace 合约
        </a>
      </div>

      {!hideRewardPool && (
        <div className="paper-card p-4 mb-4 flex flex-wrap items-baseline gap-2">
          <span className="font-hand text-lg text-muted-foreground">全局奖励池</span>
          <span className="font-hand text-2xl font-semibold text-foreground">{poolDisplay}</span>
          {demoMode && <span className="text-xs text-primary">演示后端</span>}
        </div>
      )}

      {!isConnected && (
        <p className="text-sm text-muted-foreground font-body text-center py-6 border border-dashed border-border rounded-xl bg-muted/20">
          连接 MetaMask 并切换到 Fuji 后，可查看你在链上的挑战与操作。
        </p>
      )}

      {isConnected && !isFuji && (
        <p className="text-sm text-muted-foreground font-body text-center py-6 border border-dashed border-border rounded-xl bg-muted/20">
          请先在右上角切换到 <strong>Avalanche Fuji Testnet</strong>。
        </p>
      )}

      {isConnected && isFuji && isLoading && (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {isConnected && isFuji && !isLoading && pacts.length === 0 && (
        <div className="paper-card p-8 text-center text-muted-foreground font-body">
          {demoMode ? "还没有演示挑战。选择习惯即可直接写入后端数据。" : "暂无属于你的链上挑战。选择习惯并「创建挑战」即可上链。"}
        </div>
      )}

      {isConnected &&
        isFuji &&
        !isLoading &&
        myPacts.map((p, i) => {
          const total = Number(p.durationDays);
          const checked = Number(p.checkinCount);
          const remaining = Math.max(0, total - checked);
          const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
          const todayDone = isCheckedToday(p.lastCheckin);
          const streak = Number(p.streak);
          const stakeDisplay = Number.parseFloat(formatEther(p.stakeAmount)).toFixed(4);

          return (
            <motion.div
              key={p.id.toString()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("paper-card p-5 mb-4", variant === "compact" && "p-4 mb-3")}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-hand text-2xl font-semibold text-foreground">
                    {p.habitName}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Pact #{p.id.toString()} · {UINT_TO_FREQUENCY_LABEL[p.frequency.toString()] ?? "自定义"}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border font-sans whitespace-nowrap",
                    p.completed
                      ? p.claimed
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-amber-400/40 bg-amber-50 text-amber-700"
                      : "border-border bg-muted/40 text-muted-foreground",
                  )}
                >
                  {p.completed ? (p.claimed ? "已领取 ✅" : "已完成 🎉") : "进行中"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-body">
                  <span>完成进度</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* 4 stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Flame className="w-4 h-4 mx-auto text-destructive mb-1" />
                  <p className="font-hand text-xl font-bold text-foreground">{streak}</p>
                  <p className="text-[10px] text-muted-foreground font-body">连续</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
                  <CalendarCheck className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="font-hand text-xl font-bold text-foreground">{checked}</p>
                  <p className="text-[10px] text-muted-foreground font-body">已打卡</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Clock className="w-4 h-4 mx-auto text-secondary mb-1" />
                  <p className="font-hand text-xl font-bold text-foreground">{remaining}</p>
                  <p className="text-[10px] text-muted-foreground font-body">剩余天</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Coins className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <p className="font-hand text-lg font-bold text-foreground">{stakeDisplay}</p>
                  <p className="text-[10px] text-muted-foreground font-body">AVAX</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {!p.completed ? (
                  <Button
                    type="button"
                    variant={todayDone ? "secondary" : "cyber"}
                    size="sm"
                    className="font-hand flex-1 min-w-[8rem]"
                    disabled={busy || todayDone}
                    onClick={() => onCheckin(p)}
                  >
                    {pendingOp === `checkin-${p.id}` ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        确认中…
                      </>
                    ) : todayDone ? (
                      <>
                        <Check className="w-4 h-4" />
                        今日已打卡 ✓
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        打卡
                      </>
                    )}
                  </Button>
                ) : !p.claimed ? (
                  <Button
                    type="button"
                    variant="cyber"
                    size="sm"
                    className="font-hand flex-1 min-w-[8rem]"
                    disabled={busy}
                    onClick={() => onClaim(p)}
                  >
                    {pendingOp === `claim-${p.id}` ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        领取中…
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        领取质押 + 奖励
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex-1 text-center py-2 text-sm text-primary font-hand">
                    🎊 奖励已到账
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

      {wallet && isFuji && !isLoading && pacts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-2 font-sans">
          钱包 {wallet.slice(0, 6)}… 共 {pacts.length} 条{demoMode ? "演示" : "链上"}契约
        </p>
      )}
    </section>
  );
}
