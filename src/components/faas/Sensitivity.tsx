"use client";

import { useMemo, useState } from "react";

import { getThresholds, runModel } from "@/lib/faas/engine";
import { fmtM, fmtPct, fmtX, fmtYr, sign } from "@/lib/faas/format";
import type { RunOverrides } from "@/lib/faas/engine";

import type { FaasModel } from "./useFaasModel";
import { Card } from "./ui";

const SLIDERS = [
  { key: "miete", label: "Mietveränderung", min: -25, max: 25, step: 1, unit: "%" },
  { key: "bau", label: "Baukostenveränderung", min: -10, max: 35, step: 1, unit: "%" },
  { key: "zins", label: "Zinssatz", min: -150, max: 300, step: 10, unit: " Bp." },
  { key: "leer", label: "Leerstand", min: -5, max: 20, step: 1, unit: " %-Pkt." },
  { key: "exit", label: "Exit Yield", min: -100, max: 200, step: 10, unit: " Bp." },
  { key: "delay", label: "Projektverzögerung", min: 0, max: 18, step: 1, unit: " Monate" },
] as const;

type SliderKey = (typeof SLIDERS)[number]["key"];

function ovFrom(s: Record<SliderKey, number>): RunOverrides {
  return {
    rentPct: s.miete,
    costPct: s.bau,
    rateBp: s.zins,
    vacancyPts: s.leer,
    exitYieldBp: s.exit,
    delayMonths: s.delay,
  };
}

export default function Sensitivity({ model }: { model: FaasModel }) {
  const { results, settings } = model;
  const [vIdx, setVIdx] = useState(0);
  const [vals, setVals] = useState<Record<SliderKey, number>>({
    miete: 0,
    bau: 0,
    zins: 0,
    leer: 0,
    exit: 0,
    delay: 0,
  });

  const v = (results[Math.min(vIdx, results.length - 1)] ?? results[0])?.v;

  const r = useMemo(
    () => (v ? runModel(v, ovFrom(vals), settings) : null),
    [v, vals, settings],
  );

  const matrix = useMemo(() => {
    if (!v) return null;
    const T = getThresholds(settings);
    const ms = [-15, -10, -5, 0, 5, 10, 15];
    const bs = [0, 5, 10, 15, 20];
    return { ms, bs, T };
  }, [v, settings]);

  if (!v || !r || !matrix) return <Card>Keine Daten.</Card>;

  const set = (k: SliderKey, n: number) =>
    setVals((prev) => ({ ...prev, [k]: n }));

  return (
    <div>
      <Card title="Sensitivität – vollständige Neuberechnung">
        <div className="mb-3">
          <label className="text-[11px] font-medium text-[#666]">Variante: </label>
          <select
            className="ml-2 rounded-md border border-[#ccc] px-2 py-1 text-xs"
            value={vIdx}
            onChange={(e) => setVIdx(parseInt(e.target.value))}
          >
            {results.map((res, i) => (
              <option key={res.v.id} value={i}>
                {res.v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3.5">
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <div className="mb-1 flex justify-between text-[11px] text-[#666]">
                <span>{s.label}</span>
                <span>
                  {s.key === "delay"
                    ? `${vals[s.key]}${s.unit}`
                    : `${sign(vals[s.key])}${vals[s.key]}${s.unit}`}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={vals[s.key]}
                onChange={(e) => set(s.key, parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-5 rounded-lg bg-[#f5f5f3] px-4 py-3">
          {[
            ["Levered IRR", fmtPct(r.levIRR, 1)],
            ["Profit on Cost", fmtPct(r.poc, 1)],
            ["Investmentvalue", fmtM(r.gdv)],
            ["Amortisation", fmtYr(r.payback)],
            ["DSCR", fmtX(r.dscr, 2)],
            ["Peak Equity", fmtM(r.peakEquity)],
          ].map(([k, val]) => (
            <div key={k} className="min-w-[95px]">
              <div className="text-[11px] text-[#666]">{k}</div>
              <div className="text-lg font-semibold">{val}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right">
          <button
            type="button"
            className="rounded border border-[#1D9E75] bg-[#f0faf6] px-2.5 py-1 text-[11px] text-[#0F6E56]"
            onClick={() =>
              setVals({ miete: 0, bau: 0, zins: 0, leer: 0, exit: 0, delay: 0 })
            }
          >
            ↻ Zurücksetzen
          </button>
        </div>
      </Card>

      <Card title="Levered-IRR-Matrix: Miete × Baukosten">
        <div className="mb-2 text-[11px] text-[#888]">
          Jede Zelle ist eine vollständige Modellrechnung.
        </div>
        <div className="overflow-x-auto">
          <div
            className="grid gap-[3px] text-[11px]"
            style={{
              gridTemplateColumns: `auto repeat(${matrix.bs.length},1fr)`,
              minWidth: 420,
            }}
          >
            <div className="p-1 text-[10px] text-[#888]">M↓/BK→</div>
            {matrix.bs.map((b) => (
              <div key={b} className="p-1 text-center text-[10px] text-[#888]">
                {sign(b)}
                {b}%
              </div>
            ))}
            {matrix.ms.map((m) => (
              <FragmentRow
                key={m}
                m={m}
                bs={matrix.bs}
                minIrr={matrix.T.minIrr}
                v={v}
                settings={settings}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function FragmentRow({
  m,
  bs,
  minIrr,
  v,
  settings,
}: {
  m: number;
  bs: number[];
  minIrr: number;
  v: import("@/lib/faas/types").Variant;
  settings: import("@/lib/faas/types").Settings;
}) {
  return (
    <>
      <div className="whitespace-nowrap p-1 text-[10px] text-[#888]">
        {sign(m)}
        {m}%
      </div>
      {bs.map((b) => {
        const val = runModel(v, { rentPct: m, costPct: b }, settings).levIRR;
        const bg =
          val >= minIrr
            ? "rgba(29,158,117,0.15)"
            : val >= minIrr * 0.75
              ? "rgba(239,159,39,0.15)"
              : "rgba(226,75,74,0.15)";
        const tc =
          val >= minIrr
            ? "#085041"
            : val >= minIrr * 0.75
              ? "#633806"
              : "#791F1F";
        return (
          <div
            key={b}
            className="rounded p-1 text-center font-medium"
            style={{ background: bg, color: tc }}
          >
            {isFinite(val) ? val.toFixed(1) + "%" : "–"}
          </div>
        );
      })}
    </>
  );
}
