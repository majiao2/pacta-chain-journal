import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { formatEther } from "viem";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import PactaChainPanel from "@/components/PactaChainPanel";
import { usePactaChainReads } from "@/hooks/usePactaChain";
import { useAccount, useChainId } from "wagmi";
import { FUJI_CHAIN_ID } from "@/lib/chains";

export default function Challenges() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isFuji = chainId === FUJI_CHAIN_ID;

  const { myPacts, rewardPoolWei, isLoading } = usePactaChainReads();

  const checkedDays = useMemo(
    () =>
      myPacts
        .filter((p) => p.lastCheckin > 0n)
        .map((p) => new Date(Number(p.lastCheckin) * 1000)),
    [myPacts],
  );

  const activePacts = myPacts.filter((p) => !p.completed);
  const totalStaked = useMemo(
    () => myPacts.reduce((acc, p) => acc + parseFloat(formatEther(p.stakeAmount)), 0),
    [myPacts],
  );
  const withCheckin = myPacts.filter((p) => Number(p.checkinCount) > 0).length;

  const poolLabel =
    rewardPoolWei !== undefined
      ? `${Number.parseFloat(formatEther(rewardPoolWei)).toFixed(4)}`
      : "—";

  const showStats = isConnected && isFuji && !isLoading;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl font-hand font-bold text-foreground flex items-center gap-3">
          📅 我的挑战
        </h1>
        <p className="text-muted-foreground mt-1">链上契约 · Avalanche Fuji</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          {
            label: "进行中",
            value: showStats ? activePacts.length : "—",
            emoji: "🔥",
            suffix: "个",
          },
          {
            label: "有打卡记录",
            value: showStats ? withCheckin : "—",
            emoji: "✅",
            suffix: "个",
          },
          {
            label: "总质押",
            value: showStats ? totalStaked.toFixed(3) : "—",
            emoji: "⛓️",
            suffix: " AVAX",
          },
          {
            label: "奖励池",
            value: showStats ? poolLabel : "—",
            emoji: "🏦",
            suffix: " AVAX",
          },
        ].map((stat) => (
          <div key={stat.label} className="paper-card p-4 text-center">
            <span className="text-2xl block">{stat.emoji}</span>
            <p className="font-hand text-3xl font-bold text-foreground mt-1">
              {stat.value}
              <span className="text-sm text-muted-foreground font-body">{stat.suffix}</span>
            </p>
            <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="paper-card p-4">
            <h2 className="font-hand text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              最近打卡日
            </h2>
            <p className="text-xs text-muted-foreground mb-3 font-body">
              链上仅保存每条契约的「上次打卡时间」，高亮为各契约最近一次打卡所在日期。
            </p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className={cn("p-3 pointer-events-auto w-full")}
              modifiers={{ checked: checkedDays }}
              modifiersStyles={{
                checked: {
                  backgroundColor: "hsl(168 38% 42% / 0.18)",
                  borderRadius: "50%",
                  fontWeight: "bold",
                  color: "hsl(168 38% 36%)",
                },
              }}
            />
            <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground space-y-1">
              {selectedDate && (
                <p className="font-hand text-lg text-foreground mt-2">
                  {format(selectedDate, "yyyy年MM月dd日", { locale: zhCN })}
                </p>
              )}
              {!isConnected && (
                <p className="text-xs font-body">连接钱包后可同步链上挑战。</p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-2 space-y-4">
          {isConnected && isFuji && !isLoading && myPacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="paper-card p-12 text-center"
            >
              <span className="text-6xl block mb-4">📝</span>
              <h3 className="font-hand text-3xl font-bold text-foreground mb-2">还没有链上挑战</h3>
              <p className="text-muted-foreground mb-6 font-body">
                在首页或习惯页选择微习惯，质押 AVAX 创建契约。
              </p>
              <Button variant="cyber" size="lg" className="font-hand" asChild>
                <Link to="/">浏览习惯</Link>
              </Button>
            </motion.div>
          ) : null}

          {(myPacts.length > 0 || !isConnected || !isFuji || isLoading) && (
            <PactaChainPanel
              title="挑战详情与操作"
              hideRewardPool
              variant="default"
            />
          )}
        </div>
      </div>
    </div>
  );
}
