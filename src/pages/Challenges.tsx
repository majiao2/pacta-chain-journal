import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { usePactStore, type Pact } from "@/store/pactStore";
import { categoryInfo } from "@/data/habitsData";
import { cn } from "@/lib/utils";
import { format, differenceInDays, isSameDay, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Check, Flame, Trophy, Trash2, CalendarDays, Zap } from "lucide-react";

export default function Challenges() {
  const { pacts, checkin, removePact } = usePactStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const today = format(new Date(), "yyyy-MM-dd");

  // Gather all checkin dates for calendar highlighting
  const allCheckinDates = useMemo(() => {
    const dates = new Map<string, number>();
    pacts.forEach((p) => {
      p.checkins.forEach((d) => {
        const key = d;
        dates.set(key, (dates.get(key) || 0) + 1);
      });
    });
    return dates;
  }, [pacts]);

  // Days with checkins for calendar modifiers
  const checkedDays = useMemo(
    () => Array.from(allCheckinDates.keys()).map((d) => parseISO(d)),
    [allCheckinDates]
  );

  // Stats
  const totalCheckins = pacts.reduce((sum, p) => sum + p.checkins.length, 0);
  const totalStaked = pacts.reduce((sum, p) => sum + p.stakeAmount, 0);
  const activePacts = pacts.filter((p) => p.status === "active");

  // Streak calculation
  const getStreak = (pact: Pact) => {
    let streak = 0;
    const sortedCheckins = [...pact.checkins].sort().reverse();
    const now = new Date();
    for (let i = 0; i < sortedCheckins.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      const expectedStr = format(expected, "yyyy-MM-dd");
      if (sortedCheckins.includes(expectedStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getDaysRemaining = (pact: Pact) => {
    return Math.max(0, differenceInDays(parseISO(pact.endDate), new Date()));
  };

  const getProgress = (pact: Pact) => {
    const totalDays = Math.max(1, differenceInDays(parseISO(pact.endDate), parseISO(pact.startDate)));
    return Math.min(100, Math.round((pact.checkins.length / totalDays) * 100));
  };

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
        <p className="text-muted-foreground mt-1">管理你的链上自律契约</p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: "进行中", value: activePacts.length, emoji: "🔥", suffix: "个" },
          { label: "总打卡", value: totalCheckins, emoji: "✅", suffix: "次" },
          { label: "已质押", value: totalStaked.toFixed(2), emoji: "⛓️", suffix: " AVAX" },
          { label: "总挑战", value: pacts.length, emoji: "📋", suffix: "个" },
        ].map((stat, i) => (
          <div key={stat.label} className="paper-card p-4 text-center">
            <span className="text-2xl block">{stat.emoji}</span>
            <p className="font-hand text-3xl font-bold text-foreground mt-1">
              {stat.value}
              <span className="text-sm text-muted-foreground font-body">{stat.suffix}</span>
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="paper-card p-4">
            <h2 className="font-hand text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              打卡日历
            </h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className={cn("p-3 pointer-events-auto w-full")}
              modifiers={{ checked: checkedDays }}
              modifiersStyles={{
                checked: {
                  backgroundColor: "hsl(190 100% 50% / 0.15)",
                  borderRadius: "50%",
                  fontWeight: "bold",
                  color: "hsl(190 100% 40%)",
                },
              }}
            />
            <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/40" />
                <span>已打卡日期</span>
              </div>
              {selectedDate && (
                <p className="font-hand text-lg text-foreground mt-2">
                  {format(selectedDate, "yyyy年MM月dd日", { locale: zhCN })}
                  {allCheckinDates.has(format(selectedDate, "yyyy-MM-dd"))
                    ? ` · ${allCheckinDates.get(format(selectedDate, "yyyy-MM-dd"))} 次打卡`
                    : " · 未打卡"}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Challenge List */}
        <div className="lg:col-span-2 space-y-4">
          {pacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="paper-card p-12 text-center"
            >
              <span className="text-6xl block mb-4">📝</span>
              <h3 className="font-hand text-3xl font-bold text-foreground mb-2">
                还没有挑战
              </h3>
              <p className="text-muted-foreground mb-6">
                去习惯页面选择一个微习惯，创建你的链上契约吧！
              </p>
              <Button variant="cyber" size="lg" asChild>
                <a href="/">浏览习惯</a>
              </Button>
            </motion.div>
          ) : (
            pacts.map((pact, i) => {
              const streak = getStreak(pact);
              const daysLeft = getDaysRemaining(pact);
              const progress = getProgress(pact);
              const checkedToday = pact.checkins.includes(today);
              const info = categoryInfo[pact.habit.category];

              return (
                <motion.div
                  key={pact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="paper-card p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{pact.habit.emoji}</span>
                      <div>
                        <h3 className="font-hand text-2xl font-bold text-foreground">
                          {pact.habit.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{info.emoji} {info.label}</span>
                          <span>·</span>
                          <span>{pact.frequency === "daily" ? "每天" : pact.frequency === "weekdays" ? "工作日" : "自定义"}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removePact(pact.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">完成进度</span>
                      <span className="text-primary font-semibold">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full gradient-cyber"
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3 mb-4 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <Flame className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="font-hand text-xl font-bold text-foreground">{streak}</p>
                      <p className="text-xs text-muted-foreground">连续</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <Check className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="font-hand text-xl font-bold text-foreground">{pact.checkins.length}</p>
                      <p className="text-xs text-muted-foreground">已打卡</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <CalendarDays className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="font-hand text-xl font-bold text-foreground">{daysLeft}</p>
                      <p className="text-xs text-muted-foreground">剩余天</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <Trophy className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="font-hand text-xl font-bold text-foreground">{pact.stakeAmount}</p>
                      <p className="text-xs text-muted-foreground">AVAX</p>
                    </div>
                  </div>

                  {/* Checkin button */}
                  <Button
                    variant={checkedToday ? "outline" : "cyber"}
                    className="w-full"
                    onClick={() => checkin(pact.id, today)}
                  >
                    {checkedToday ? (
                      <>
                        <Check className="w-4 h-4" />
                        今日已打卡 ✓（点击取消）
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        立即打卡
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
