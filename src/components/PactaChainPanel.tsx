import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Check, Gift, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pactaAbi } from "@/abi/pactaAbi";
import { PACTA_ADDRESS } from "@/lib/pacta";
import { avalancheFuji } from "@/lib/chains";
import { usePactaDashboard, type DashboardPact } from "@/hooks/usePactaDashboard";
import { cn } from "@/lib/utils";

export type PactaChainPanelProps = {
  variant?: "default" | "compact";
  title?: string;
  className?: string;
  /** 为 true 时不展示全局奖励池卡片（例如在「我的挑战」页由统计栏展示） */
  hideRewardPool?: boolean;
};

function formatTs(sec: bigint) {
  if (sec === 0n) return "暂无";
  const ms = Number(sec) * 1000;
  if (!Number.isFinite(ms)) return "—";
  return format(new Date(ms), "yyyy-MM-dd HH:mm", { locale: zhCN });
}

const ENCOURAGEMENT_DURATION_MS = 5000;

export default function PactaChainPanel({
  variant = "default",
  title = "链上契约",
  className,
  hideRewardPool = false,
}: PactaChainPanelProps) {
  type PendingAction =
    | { kind: "checkin"; pact: DashboardPact }
    | { kind: "claim"; pact: DashboardPact };

  const { address } = useAccount();
  const {
    wallet,
    demoMode,
    isConnected,
    isFuji,
    rewardPoolWei,
    pacts,
    isLoading,
    refresh,
    recordBackendCheckin,
    isRecordingCheckin,
    claimBackendReward,
    isClaimingReward,
  } = usePactaDashboard();

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
      ? `${Number.parseFloat(formatEther(rewardPoolWei)).toFixed(6)} AVAX`
      : "—";

  const onCheckin = (p: DashboardPact) => {
    if (demoMode) {
      setPendingAction({ kind: "checkin", pact: p });
      void recordBackendCheckin({
        pactId: p.id.toString(),
      })
        .then((result) => {
          toast.success(result.encouragement ?? "打卡成功", {
            description: result.summary ?? "后端记录已生成阶段总结。",
            duration: ENCOURAGEMENT_DURATION_MS,
          });
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : "打卡失败";
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
    setPendingAction({ kind: "checkin", pact: p });
    void writeContractAsync({
        account: address,
        address: PACTA_ADDRESS,
        abi: pactaAbi,
        chain: avalancheFuji,
        functionName: "checkin" as const,
        args: [p.id] as const,
      })
      .then((hash) => {
        setTxHash(hash);
        toast.message("已在钱包中提交，等待区块确认…");
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "交易失败";
        toast.error(msg);
        setPendingAction(null);
      });
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
        chain: avalancheFuji,
        functionName: "claimReward" as const,
        args: [p.id] as const,
      })
      .then((hash) => {
        setTxHash(hash);
        toast.message("已在钱包中提交，等待区块确认…");
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "交易失败";
        toast.error(msg);
        setPendingAction(null);
      });
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
        pacts.map((p, i) => {
          return (
            <motion.div
              key={p.id.toString()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("paper-card p-4 mb-3", variant === "compact" && "p-3 mb-2")}
            >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-hand text-xl font-semibold text-foreground">{p.habitName}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Pact #{p.id.toString()}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded-full border font-sans",
                  p.completed
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground",
                )}
              >
                {p.completed ? "已完成" : "进行中"}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm font-body mb-4">
              <div>
                <dt className="text-muted-foreground">质押</dt>
                <dd className="font-medium">{formatEther(p.stakeAmount)} AVAX</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">频率</dt>
                <dd className="font-medium">{p.frequencyLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">开始</dt>
                <dd className="font-medium text-xs sm:text-sm">{formatTs(p.startTime)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">上次打卡</dt>
                <dd className="font-medium text-xs sm:text-sm">{formatTs(p.lastCheckin)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">持续天数（合约）</dt>
                <dd className="font-medium">{p.durationDays.toString()} 天</dd>
              </div>
            </dl>

            {p.summary && (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-primary mb-2 font-medium">
                  <span>后端总结</span>
                  <span>·</span>
                  <span>累计 {p.checkinCount} 次</span>
                  <span>·</span>
                  <span>连续 {p.currentStreak} 天</span>
                </div>
                <p className="text-sm text-foreground leading-6">{p.summary}</p>
                {p.latestEncouragement && (
                  <p className="text-sm text-primary/90 mt-2">“{p.latestEncouragement}”</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="cyber"
                size="sm"
                className="font-hand flex-1 min-w-[7rem]"
                disabled={busy || p.completed}
                onClick={() => onCheckin(p)}
              >
                <Check className="w-4 h-4" />
                打卡
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="font-hand flex-1 min-w-[7rem] border border-border"
                disabled={busy || p.rewardClaimed}
                onClick={() => onClaim(p)}
              >
                <Gift className="w-4 h-4" />
                {p.rewardClaimed ? "已领取" : "领取奖励"}
              </Button>
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
