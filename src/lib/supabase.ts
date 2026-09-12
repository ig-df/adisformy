import { createClient } from '@supabase/supabase-js';
import { NavodkaItem } from '../types';

export const API_URL = "https://qjoovhagucdcaebgdmbx.supabase.co";
export const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb292aGFndWNkY2FlYmdkbWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTYyMTEsImV4cCI6MjEwMDQ3MjIxMX0.Z-Pey6nbpo5b-RyXkc2cCCV7Uj3-YgbAqZsTUV1kZD0";
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz2Zp-Me-bMX_2VY6Be2Mt0Z5HguRLwnjuYz9fNh1nXjbAXIOVXMIlcTNjs1Z72qiuM9Q/exec";
export const MASTER_PASSWORD = "adisadis";
export const SUPER_ADMIN_PASSWORD = "adisadmin";

export const supabase = createClient(API_URL, API_KEY);

export const BASE_SYSTEM_CUSTOMERS = [
  "Škoda", "Novares", "Witte", "Scherdel", "AFSI", "Adient", "Mubea", "Ideal", "Others"
];

export const DEFAULT_CUSTOMERS = [
  { name: "Škoda", bg: "#ffffff" },
  { name: "Novares", bg: "#fef08a" },
  { name: "Witte", bg: "#e2e8f0" },
  { name: "Scherdel", bg: "#fecdd3" },
  { name: "AFSI", bg: "#ffedd5" },
  { name: "Adient", bg: "#93c5fd" },
  { name: "Mubea", bg: "#60a5fa" },
  { name: "Ideal", bg: "#f5d0fe" },
  { name: "Others", bg: "#fdfbf7" }
];

export const PALETTE_COLORS = [
  "#ffffff", "#f8fafc", "#cbd5e1", "#64748b", "#1e293b", "#0f172a",
  "#fdfbf7", "#d7ccc8", "#8d6e63", "#451a03",
  "#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239",
  "#ffedd5", "#fed7aa", "#fb923c", "#f97316", "#ea580c", "#c2410c",
  "#fef9c3", "#fef08a", "#fde047", "#facc15", "#eab308", "#a16207",
  "#f0fdf4", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534",
  "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0369a1",
  "#eff6ff", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"
];

export const POSSIBLE_POSITIONS: string[] = (() => {
  const positions = ["Mezisklad", "Mezisklad Ctiboř", "Mezisklad Externí"];
  const shelves = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const colors = ['z', 'c', 'č', 'm', 'b', 'h'];
  for (let num = 1; num <= 99; num++) {
    for (let i = 0; i < shelves.length; i++) {
      const shelf = shelves[i];
      for (let j = 0; j < colors.length; j++) {
        positions.push(`${num}${shelf} ${colors[j]}`);
      }
    }
  }
  return positions;
})();

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLORS_CS = [
  'červená', 'cervena', 'modrá', 'modra', 'žlutá', 'zluta', 
  'zelená', 'zelena', 'černá', 'cerna', 'bílá', 'bila', 
  'šedá', 'seda', 'stříbrná', 'stribrna', 'oranžová', 'oranzova', 
  'fialová', 'fialova', 'hnědá', 'hneda', 'růžová', 'ruzova'
];

export function getTitleFromFilename(filename: string, fallbackIndex: number): string {
  if (!filename) return `Návodka ${fallbackIndex}`;
  const nameWithoutExt = (filename.substring(0, filename.lastIndexOf('.')) || filename).toLowerCase();
  for (const color of COLORS_CS) {
    if (nameWithoutExt.includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }
  return `Návodka ${fallbackIndex}`;
}

export function parseNavodkaItems(rawUrl?: string): NavodkaItem[] {
  if (!rawUrl || !rawUrl.trim()) return [];
  try {
    if (rawUrl.startsWith('[')) {
      const parsed = JSON.parse(rawUrl);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          if (typeof item === 'string') return { url: item, title: `Návodka ${idx + 1}` };
          return { url: item.url, title: item.title || `Návodka ${idx + 1}` };
        });
      }
    }
  } catch {
    // Fallback to single URL
  }
  return [{ url: rawUrl, title: "Návodka 1" }];
}

export function autoDotPosition(str: string): string {
  if (!str) return str;
  const trimmed = str.trim();
  if (trimmed.toLowerCase().includes('mezisklad')) return trimmed;
  return trimmed.replace(/\s+([zcmbzCMBHhčČ])(?!\.)$/i, ' $1.');
}

export function formatPositionDisplay(pos: string): string {
  if (!pos) return '';
  const p = String(pos).trim();
  if (p.toLowerCase() === 'mezisklad externí' || p.toLowerCase() === 'mezisklad externi') {
    return 'Mezisklad Ext.';
  }
  return p;
}

export function getPositionBadgeClass(pos: string): string {
  const p = String(pos || "").trim().toLowerCase();
  if (p.includes("externí") || p.includes("externi")) return 'bg-[#7c2d12] text-white';
  if (p.includes("mezisklad")) return 'bg-[#4b5563] text-white';
  if (p.includes(' z')) return 'bg-[#16a34a] text-white';
  if (p.includes(' c') || p.includes(' č')) return 'bg-[#dc2626] text-white';
  if (p.includes(' m')) return 'bg-[#2563eb] text-white';
  if (p.includes(' b')) return 'bg-white text-[#0f172a] border border-[#cbd5e1]';
  if (p.includes(' h')) return 'bg-[#9a3412] text-white';
  const lastChar = p.replace('.', '').slice(-1);
  if (['z', 'c', 'č', 'm', 'b', 'h'].includes(lastChar)) {
    if (lastChar === 'č') return 'bg-[#dc2626] text-white';
    if (lastChar === 'z') return 'bg-[#16a34a] text-white';
    if (lastChar === 'c') return 'bg-[#dc2626] text-white';
    if (lastChar === 'm') return 'bg-[#2563eb] text-white';
    if (lastChar === 'b') return 'bg-white text-[#0f172a] border border-[#cbd5e1]';
    if (lastChar === 'h') return 'bg-[#9a3412] text-white';
  }
  return 'bg-[#4b5563] text-white';
}

export function sanitizeFileName(fileName: string): string {
  const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/__+/g, "_");
}

export function triggerHaptic(pattern: number[] = [15]): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}
