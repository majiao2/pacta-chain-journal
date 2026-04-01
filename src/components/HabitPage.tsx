import { useState } from "react";
import { getHabitsByCategory, categoryInfo, type HabitCategory, type Habit } from "@/data/habitsData";
import HabitCard from "./HabitCard";
import CreatePactDialog from "./CreatePactDialog";
import PactaChainPanel from "./PactaChainPanel";
import { motion } from "framer-motion";

interface HabitPageProps {
  category: HabitCategory;
}

export default function HabitPage({ category }: HabitPageProps) {
  const [tab, setTab] = useState<"quantity" | "time">("quantity");
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const info = categoryInfo[category];
  const allHabits = getHabitsByCategory(category);
  const filtered = allHabits.filter(h => h.type === tab);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl font-hand font-bold text-foreground flex items-center gap-3">
          {info.emoji} {info.label}
        </h1>
        <p className="text-muted-foreground mt-1">{info.labelEn}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("quantity")}
          className={`px-4 py-2 rounded-lg font-hand text-lg transition-all ${
            tab === "quantity"
              ? "bg-primary text-primary-foreground glow-cyber"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          📊 按数量
        </button>
        <button
          onClick={() => setTab("time")}
          className={`px-4 py-2 rounded-lg font-hand text-lg transition-all ${
            tab === "time"
              ? "bg-primary text-primary-foreground glow-cyber"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          ⏱️ 按时间
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((habit, i) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            index={i}
            onCreatePact={(h) => setSelectedHabit(h)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="paper-card p-12 text-center text-muted-foreground">
          <p className="font-hand text-2xl">暂无此类习惯</p>
        </div>
      )}

      <CreatePactDialog
        habit={selectedHabit}
        open={!!selectedHabit}
        onOpenChange={(open) => { if (!open) setSelectedHabit(null); }}
      />

      <div className="mt-14 pt-8 border-t border-dashed border-border/80">
        <PactaChainPanel variant="compact" title="我的链上挑战" />
      </div>
    </div>
  );
}
