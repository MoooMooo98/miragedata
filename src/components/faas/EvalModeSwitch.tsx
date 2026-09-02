"use client";

import { THRESH_PRESETS } from "@/lib/faas/defaults";
import type { EvalMode, Settings } from "@/lib/faas/types";

export function applyEvalMode(
  s: Settings,
  mode: EvalMode,
  keepThresholds = false,
): Settings {
  const next: Settings = { ...s, evalMode: mode };
  if (!keepThresholds) {
    const p = THRESH_PRESETS[mode];
    next.thresholds = {
      ...s.thresholds,
      minirr: p.minirr ?? s.thresholds.minirr,
      minuirr: p.minuirr ?? s.thresholds.minuirr,
      minem: p.minem ?? s.thresholds.minem,
      minpoc: p.minpoc ?? s.thresholds.minpoc,
      minvapoc: p.minvapoc ?? s.thresholds.minvapoc,
      mindscr: p.mindscr ?? s.thresholds.mindscr,
      maxpay: p.maxpay ?? s.thresholds.maxpay,
      minspread: p.minspread ?? s.thresholds.minspread,
      mindownirr: p.mindownirr ?? s.thresholds.mindownirr,
      mincapexyield: p.mincapexyield ?? s.thresholds.mincapexyield,
    };
    next.decisionKPIs = (p.decisionKPIs ?? s.decisionKPIs).slice();
  }
  return next;
}

export default function EvalModeSwitch({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
}) {
  const dev = settings.evalMode === "development";
  return (
    <div>
      <div className="inline-flex overflow-hidden rounded-[9px] border border-[#ccc] bg-[#f2f2f0]">
        <button
          type="button"
          onClick={() => onChange(applyEvalMode(settings, "bestand"))}
          className={`px-[15px] py-[7px] text-xs font-semibold ${
            !dev ? "bg-[#1a3557] text-white" : "text-[#666]"
          }`}
        >
          🏛 Bauen im Bestand
        </button>
        <button
          type="button"
          onClick={() => onChange(applyEvalMode(settings, "development"))}
          className={`px-[15px] py-[7px] text-xs font-semibold ${
            dev ? "bg-[#B45309] text-white" : "text-[#666]"
          }`}
        >
          🏗 New Development
        </button>
      </div>
      <div className="mt-1.5 max-w-[640px] text-[10.5px] leading-[1.45] text-[#777]">
        {dev
          ? "New-Development-Kalibrierung: IRR ≥ 12 %, Profit on Cost ≥ 15 %, DSCR ≥ 1,25x, Amortisation ≤ 12 J.; Gates: Development Spread + Downside-IRR. Quelle: gif e.V. Projektentwicklungsrechnung, RICS."
          : "Bestands-Kalibrierung: IRR ≥ 10 %, Profit on Cost ≥ 8 %, DSCR ≥ 1,20x, Amortisation ≤ 10 J.; Gates: CapEx-Yield + Buchwert-Schutz. Quelle: RICS/IPD-Bestandsbenchmark."}
      </div>
    </div>
  );
}
