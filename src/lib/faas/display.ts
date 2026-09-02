import type { Gate, GateStatus } from "./types";
import { fmtM } from "./format";

export function statusLong(st: GateStatus): string {
  return st === "go"
    ? "GO – FREIGABE EMPFOHLEN"
    : st === "conditional"
      ? "CONDITIONAL GO – FREIGABE MIT AUFLAGEN"
      : st === "benchmark"
        ? "BENCHMARK – STRETCH-ZIEL"
        : "NO-GO – KEINE FREIGABE";
}

export function statusShort(st: GateStatus): string {
  return st === "go"
    ? "GO"
    : st === "conditional"
      ? "CONDITIONAL GO"
      : st === "benchmark"
        ? "BENCHMARK"
        : "NO-GO";
}

export function statusChipTone(st: GateStatus): "g" | "a" | "r" | "bm" {
  return st === "go" ? "g" : st === "conditional" ? "a" : st === "benchmark" ? "bm" : "r";
}

// Formatiert einen Gate-Wert für die Karten/Tabellen
export function gateValStr(x: Gate): string {
  const dp =
    x.dec2 != null ? x.dec2 : x.unit === "x" ? 2 : x.unit === " €" ? 0 : 1;
  if (x.v === null || !isFinite(x.v)) return "n/a";
  if (x.unit === " €") return fmtM(x.v);
  return x.v.toFixed(dp) + x.unit;
}

export const bannerBg: Record<GateStatus, string> = {
  go: "linear-gradient(135deg,#1D9E75,#0F6E56)",
  conditional: "linear-gradient(135deg,#EF9F27,#BA7517)",
  nogo: "linear-gradient(135deg,#E24B4A,#a32d2d)",
  benchmark: "linear-gradient(135deg,#7F77DD,#5b3fc4)",
};

export const cardTopColor: Record<GateStatus, string> = {
  go: "#1D9E75",
  conditional: "#EF9F27",
  nogo: "#E24B4A",
  benchmark: "#7F77DD",
};

export const vstatBg: Record<GateStatus, string> = {
  go: "bg-[#eaf3de] text-[#3b6d11]",
  conditional: "bg-[#faeeda] text-[#854f0b]",
  nogo: "bg-[#fcebeb] text-[#a32d2d]",
  benchmark: "bg-[#efeafc] text-[#5b3fc4]",
};
