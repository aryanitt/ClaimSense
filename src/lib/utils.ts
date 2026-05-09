import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    denied: "text-red-400 bg-red-400/10 border-red-400/20",
    paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    appealed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    recovered: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  };
  return map[status.toLowerCase()] ?? "text-gray-400 bg-gray-400/10 border-gray-400/20";
}

export function getRecoverabilityColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 25) return "text-orange-400";
  return "text-red-400";
}
