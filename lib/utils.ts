import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return formatDate(date);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const MOOD_COLORS: Record<string, string> = {
  happy: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  excited: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  neutral: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  shy: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  sad: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  angry: "text-red-400 bg-red-400/10 border-red-400/20",
  cold: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};

export const MOOD_EMOJI: Record<string, string> = {
  happy: "😊",
  excited: "🤩",
  neutral: "😐",
  shy: "🥺",
  sad: "😢",
  angry: "😠",
  cold: "🥶",
};
