import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Habit } from "@/data/habitsData";
import { usePactStore } from "@/store/pactStore";
import { CalendarIcon, Zap } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CreatePactDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const frequencies = [
  { value: "daily" as const, label: "每天", desc: "每日打卡" },
  { value: "weekdays" as const, label: "工作日", desc: "周一至周五" },
  { value: "custom" as const, label: "自定义", desc: "灵活安排" },
];

export default function CreatePactDialog({ habit, open, onOpenChange }: CreatePactDialogProps) {
  const [frequency, setFrequency] = useState<"daily" | "weekdays" | "custom">("daily");
  const [stake, setStake] = useState(0.1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const addPact = usePactStore((s) => s.addPact);

  const handleCreate = () => {
    if (!habit) return;
    addPact({
      habit,
      stakeAmount: stake,
      frequency,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    onOpenChange(false);
  };

  if (!habit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-hand text-3xl text-foreground flex items-center gap-2">
            <span>{habit.emoji}</span> 创建挑战
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Habit info */}
          <div className="paper-card p-4">
            <h4 className="font-hand text-xl font-semibold text-foreground">{habit.name}</h4>
            <p className="text-sm text-muted-foreground">{habit.description}</p>
          </div>

          {/* Frequency */}
          <div>
            <label className="font-hand text-lg text-foreground block mb-2">打卡频率</label>
            <div className="grid grid-cols-3 gap-2">
              {frequencies.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all",
                    frequency === f.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <span className="font-hand text-lg block">{f.label}</span>
                  <span className="text-xs">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
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

          {/* Stake */}
          <div>
            <label className="font-hand text-lg text-foreground block mb-2">质押金额 (AVAX)</label>
            <div className="flex gap-2">
              {[0.05, 0.1, 0.5, 1.0].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setStake(amount)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                    stake === amount
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm */}
          <Button variant="cyber" className="w-full py-6 text-lg" onClick={handleCreate}>
            <Zap className="w-5 h-5" />
            质押 {stake} AVAX · 创建链上契约
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            确认后将通过 MetaMask 发送交易到 Avalanche Fuji Testnet
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
