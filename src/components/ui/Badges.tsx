"use client";
import { cn } from "@/lib/utils";
import { getStatusColor, getRecoverabilityColor } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize",
      getStatusColor(status)
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
}

export function RecoverabilityBadge({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : score >= 25 ? "#f97316" : "#ef4444";
  const label = score >= 75 ? "High" : score >= 50 ? "Medium" : score >= 25 ? "Low" : "Minimal";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {score}% {label}
      </span>
    </div>
  );
}

export function ConfidenceGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-12 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 126} 126`} opacity="0.8" />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="text-xs font-bold" style={{ color }}>{score}%</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-1">AI Confidence</p>
    </div>
  );
}
