import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { categoryInfo, type HabitCategory } from "@/data/habitsData";
import WalletButton from "./WalletButton";
import { Menu, X } from "lucide-react";

const navItems: { path: string; category?: HabitCategory; label: string }[] = [
  { path: "/", label: "首页" },
  { path: "/mental", category: "mental", label: "🧠 脑力" },
  { path: "/physical", category: "physical", label: "💪 身体" },
  { path: "/diet", category: "diet", label: "🥗 饮食" },
  { path: "/happiness", category: "happiness", label: "😊 幸福" },
  { path: "/business", category: "business", label: "💼 商业" },
  { path: "/productivity", category: "productivity", label: "🚀 生产力" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl font-hand font-bold text-foreground">心契</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">Pacta</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ink-underline ${
                  location.pathname === item.path
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <WalletButton />
            <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-border"
            >
              <div className="container py-3 flex flex-col gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm ${
                      location.pathname === item.path
                        ? "text-primary font-semibold bg-primary/5"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main className="flex-1 container py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p className="font-hand text-lg">心契 Pacta — 你的承诺，链上生效</p>
          <p className="mt-1">Avalanche Fuji Testnet · 全球节点见证</p>
        </div>
      </footer>
    </div>
  );
}
