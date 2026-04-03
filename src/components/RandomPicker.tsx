import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRandomHabit, type Habit } from "@/data/habitsData";
import { Button } from "@/components/ui/button";
import { Shuffle, Zap } from "lucide-react";
import CreatePactDialog from "@/components/CreatePactDialog";

export default function RandomPicker() {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const pick = useCallback(() => {
    setSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      setHabit(getRandomHabit());
      count++;
      if (count > 8) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 100);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <Button
        variant="cyber"
        size="lg"
        onClick={pick}
        disabled={spinning}
        className="text-xl px-10 py-7 rounded-2xl animate-pulse-glow"
      >
        <Shuffle className="w-6 h-6 mr-2" />
        {spinning ? "抽取中..." : "今天做什么？"}
      </Button>

      <AnimatePresence mode="wait">
        {habit && (
          <motion.div
            key={habit.id}
            initial={{ scale: 0.8, opacity: 0, rotateZ: -5 }}
            animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="paper-card p-8 max-w-sm w-full text-center"
          >
            <span className="text-5xl block mb-4">{habit.emoji}</span>
            <h3 className="font-hand text-3xl font-bold text-foreground mb-2">{habit.name}</h3>
            <p className="text-muted-foreground mb-4">{habit.description}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <span className="px-2 py-1 rounded-full bg-muted">
                {habit.type === "quantity" ? "按数量" : "按时间"}
              </span>
              <span>·</span>
              <span className="text-primary font-semibold">{habit.defaultStake} AVAX</span>
            </div>
            <Button variant="cyber" className="w-full" onClick={() => setSelectedHabit(habit)}>
              <Zap className="w-4 h-4" />
              创建挑战
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <CreatePactDialog
        habit={selectedHabit}
        open={!!selectedHabit}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedHabit(null);
          }
        }}
      />
    </div>
  );
}
