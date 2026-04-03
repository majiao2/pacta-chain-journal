import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, differenceInCalendarDays } from "date-fns";
import type { Habit } from "@/data/habitsData";
import { CalendarIcon, Zap, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { avalancheFuji } from "viem/chains";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pactaAbi } from "@/abi/pactaAbi";
import { PACTA_ADDRESS, FREQUENCY_TO_UINT, type FrequencyKey } from "@/lib/pacta";
import { FUJI_CHAIN_ID } from "@/lib/chains";
import { useDemoModeStore } from "@/store/demoModeStore";
import { usePactaDashboard } from "@/hooks/usePactaDashboard";

interface CreatePactDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const frequencies: { value: FrequencyKey; label: string; desc: string }[] = [
  { value: "daily", label: "每天", desc: "每日打卡" },
  { value: "weekdays", label: "工作日", desc: "周一至周五" },
  { value: "custom", label: "自定义", desc: "灵活安排" },
];

export default function CreatePactDialog({ habit, open, onOpenChange }: CreatePactDialogProps) {
  const [frequency, setFrequency] = useState<FrequencyKey>("daily");
  const [stake, setStake] = useState(0.1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isFuji = chainId === FUJI_CHAIN_ID;
  const demoMode = useDemoModeStore((state) => state.enabled);
  const queryClient = useQueryClient();
  const { createDemoPact, isCreatingDemoPact } = usePactaDashboard();

  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isSuccess || !txHash) return;
    void queryClient.invalidateQueries();
    toast.success("链上契约已创建");
    setTxHash(undefined);
    onOpenChange(false);
  }, [isSuccess, txHash, queryClient, onOpenChange]);

  const handleCreate = async () => {
    if (!habit) return;
    const durationDays = Math.max(
      1,
      differenceInCalendarDays(endDate, startDate) + 1,
    );

    if (demoMode) {
      try {
        await createDemoPact({
          habit,
          frequency,
          stake,
          durationDays,
          startAt: startDate.toISOString(),
        });
        toast.success("演示挑战已创建");
        onOpenChange(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "创建失败";
        toast.error(msg);
      }
      return;
    }

    if (!isConnected) {
      toast.error("请先连接 MetaMask");
      return;
    }
    if (!isFuji) {
      toast.error("请切换到 Avalanche Fuji Testnet");
      return;
    }
    if (!address) {
      toast.error("未获取到钱包地址");
      return;
    }
    const freqUint = FREQUENCY_TO_UINT[frequency];

    try {
      const hash = await writeContractAsync({
        account: address,
        address: PACTA_ADDRESS,
        abi: pactaAbi,
        chain: avalancheFuji,
        functionName: "createPact",
        args: [habit.name, freqUint, BigInt(durationDays)],
        value: parseEther(String(stake)),
      });
      setTxHash(hash);
      toast.message("请在钱包中确认交易…");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "创建失败";
      toast.error(msg);
    }
  };

  if (!habit) return null;

  const submitting = isWritePending || isConfirming || isCreatingDemoPact;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-[1.05rem]">
        <DialogHeader>
          <DialogTitle className="font-hand text-3xl text-foreground flex items-center gap-2">
            <span>{habit.emoji}</span> 创建挑战
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="paper-card p-4">
            <h4 className="font-hand text-xl font-semibold text-foreground">{habit.name}</h4>
            <p className="text-sm text-muted-foreground font-body">{habit.description}</p>
          </div>

          <div>
            <label className="font-hand text-lg text-foreground block mb-2">打卡频率</label>
            <div className="grid grid-cols-3 gap-2">
              {frequencies.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all",
                    frequency === f.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50",
                  )}
                >
                  <span className="font-hand text-lg block">{f.label}</span>
                  <span className="text-xs font-body">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-hand text-lg text-foreground block mb-2">开始日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "MM/dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="font-hand text-lg text-foreground block mb-2">结束日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "MM/dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => d && setEndDate(d)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <label className="font-hand text-lg text-foreground block mb-2">质押金额 (AVAX)</label>
            <div className="flex gap-2">
              {[0.05, 0.1, 0.5, 1.0].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setStake(amount)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-medium transition-all font-sans",
                    stake === amount
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="cyber"
            className="w-full py-6 text-lg font-hand"
            disabled={submitting}
            onClick={() => void handleCreate()}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {demoMode ? "正在创建挑战…" : "等待链上确认…"}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {demoMode ? `演示模式 · 创建 ${habit.name} 挑战` : `质押 ${stake} AVAX · 创建链上契约`}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground font-body">
            {demoMode ? (
              <>当前可直接创建体验挑战，无需连接 MetaMask。</>
            ) : (
              <>
                将调用合约 <span className="font-mono text-[10px] break-all">{PACTA_ADDRESS}</span>
                的 createPact（Fuji 测试网）。
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
