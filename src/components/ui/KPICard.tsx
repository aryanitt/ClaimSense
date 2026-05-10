"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  glowColor?: string;
  delay?: number;
}

export function KPICard({ title, value, subtitle, icon, trend, glowColor = "#06b6d4", delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-5 relative overflow-hidden cursor-default"
    >
      {/* Glow orb */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)`, transform: "translate(30%, -30%)" }} />

      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${glowColor}15`, border: `1px solid ${glowColor}30` }}>
          <div style={{ color: glowColor }}>{icon}</div>
        </div>
      </div>

      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}

      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-3 text-xs font-semibold",
          trend.positive ? "text-emerald-400" : "text-red-400"
        )}>
          <span>{trend.positive ? "↑" : "↓"}</span>
          <span>{trend.value} from last month</span>
        </div>
      )}
    </motion.div>
  );
}
