import { motion } from "framer-motion";
import type { Habit } from "@/data/habitsData";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface HabitCardProps {
  habit: Habit;
  onCreatePact?: (habit: Habit) => void;
  index?: number;
}

export default function HabitCard({ habit, onCreatePact, index = 0 }: HabitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="paper-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{habit.emoji}</span>
          <div>
            <h3 className="font-hand text-xl font-semibold text-foreground">{habit.name}</h3>
            <p className="text-sm text-muted-foreground">{habit.description}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
          {habit.type === "quantity" ? "按数量" : "按时间"}
        </span>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
        <span className="text-sm text-muted-foreground">
          质押 <span className="text-primary font-semibold">{habit.defaultStake} AVAX</span>
        </span>
        <Button
          variant="cyber"
          size="sm"
          onClick={() => onCreatePact?.(habit)}
        >
          <Zap className="w-3 h-3" />
          创建挑战
        </Button>
      </div>
    </motion.div>
  );
}
