import { motion } from "framer-motion";
import RandomPicker from "@/components/RandomPicker";
import { Link } from "react-router-dom";
import { categoryInfo, type HabitCategory } from "@/data/habitsData";

const categories = Object.entries(categoryInfo) as [HabitCategory, typeof categoryInfo[HabitCategory]][];

export default function Index() {
  return (
    <div className="flex flex-col items-center gap-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        <h1 className="text-7xl font-hand font-bold text-foreground mb-3">
          心契
        </h1>
        <p className="text-2xl font-hand text-gold mb-2">Pacta</p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          你的承诺，链上生效。将易逝的决心锚定在 Avalanche 区块链上，<br />
          通过质押 AVAX 创建不可撤销的自律协议。
        </p>
      </motion.div>

      {/* Random Picker */}
      <RandomPicker />

      {/* Category Grid */}
      <div className="w-full">
        <h2 className="text-3xl font-hand font-bold text-foreground text-center mb-6">
          选择你的修行之路
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(([key, info], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/${key}`} className="block">
                <div className="paper-card p-6 text-center group cursor-pointer">
                  <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">
                    {info.emoji}
                  </span>
                  <h3 className="font-hand text-xl font-semibold text-foreground">
                    {info.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{info.labelEn}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="w-full max-w-3xl">
        <h2 className="text-3xl font-hand font-bold text-foreground text-center mb-6">
          如何运作
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "01", title: "选择习惯", desc: "从 6 大分类中选择你的微习惯", emoji: "📋" },
            { step: "02", title: "质押 AVAX", desc: "用 MetaMask 质押代币创建链上契约", emoji: "⛓️" },
            { step: "03", title: "每日打卡", desc: "完成打卡获得奖励，链上见证你的蜕变", emoji: "✅" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="paper-card p-6 text-center"
            >
              <span className="text-3xl block mb-2">{item.emoji}</span>
              <span className="text-primary font-hand text-2xl font-bold">{item.step}</span>
              <h3 className="font-hand text-xl font-semibold text-foreground mt-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
