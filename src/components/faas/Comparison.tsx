"use client";

import {
  capexYield,
  effInfo,
  gdvStressValue,
  getThresholds,
  gfzInfo,
  isBestand,
} from "@/lib/faas/engine";
import { statusChipTone, statusShort } from "@/lib/faas/display";
import { fmtM, fmtPct, fmtX, fmtYr } from "@/lib/faas/format";
import type { RunResult, Settings } from "@/lib/faas/types";

import type { FaasModel } from "./useFaasModel";
import { Card, Chip } from "./ui";

const COLORS = [
  "#378ADD",
  "#1D9E75",
  "#EF9F27",
  "#7F77DD",
  "#E24B4A",
  "#2aaa8a",
  "#4a45a0",
];

type Row =
  | { sec: string }
  | [string, (r: RunResult, s: Settings) => React.ReactNode];

function MiniBars({
  title,
  labels,
  values,
  fmt,
}: {
  title: string;
  labels: string[];
  values: number[];
  fmt: (v: number) => string;
}) {
  const max = Math.max(1, ...values.map((v) => (isFinite(v) ? v : 0)));
  return (
    <Card title={title}>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-[40%] truncate text-[10px] text-[#666]">
              {labels[i]}
            </span>
            <div className="h-3 flex-1 rounded bg-[#f0f0ee]">
              <div
                className="h-3 rounded"
                style={{
                  width: `${Math.max(0, ((isFinite(v) ? v : 0) / max) * 100)}%`,
                  background: COLORS[i % COLORS.length],
                }}
              />
            </div>
            <span className="w-[70px] text-right text-[10px] font-semibold text-[#555]">
              {fmt(v)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Comparison({ model }: { model: FaasModel }) {
  const { results, settings } = model;
  const res = results;
  const maxScore = Math.max(0, ...res.map((r) => r.score ?? 0));

  const rows: Row[] = [
    { sec: "Profil" },
    ["Assetklasse", (r) => r.v.assetClass + (r.v.isHybrid ? " (Hybrid)" : "")],
    ["Projektart", (r) => r.v.projectType],
    [
      "Ertragslogik",
      (r) =>
        r.v.incomeMode === "operator"
          ? "Betreibermodell"
          : r.v.incomeMode === "segments"
            ? "Segmente (heterogen)"
            : "Zielmiete",
    ],
    ["USt-Behandlung", (r) => (r.v.vorsteuer ? "Vorsteuerabzug" : "steuerschädlich")],
    { sec: "Flächen" },
    ["Mietfläche", (r) => Math.round(r.area).toLocaleString("de-DE") + " m²"],
    [
      "BGF n. Maßnahme",
      (r, s) => Math.round(gfzInfo(r.v, s).bgfNach).toLocaleString("de-DE") + " m²",
    ],
    ["Flächeneffizienz", (r, s) => fmtPct(effInfo(r.v, s), 1)],
    [
      "GFZ Ist / zul.",
      (r, s) => {
        const gi = gfzInfo(r.v, s);
        return (
          gi.gfzIst.toFixed(2) +
          " / " +
          (gi.gfzZul > 0 ? gi.gfzZul.toFixed(2) : "–") +
          (gi.gfzZul > 0 ? (gi.ok ? " ✓" : " ⚠") : "")
        );
      },
    ],
    { sec: "Wirtschaftlichkeit" },
    ["Investmentvalue (GDV)", (r) => fmtM(r.gdv)],
    ["Gesamtkosten (TDC)", (r) => fmtM(r.tdc)],
    ["Development Profit", (r) => fmtM(r.devProfit)],
    ["Profit on Cost (Gesamtkosten)", (r) => fmtPct(r.poc, 1)],
    ["Value-Add PoC (Umbaukapital)", (r) => fmtPct(r.vaPoc, 1)],
    ["Netto-Anfangsrendite (YoC)", (r) => fmtPct(r.yoc, 2)],
    [
      "Development Spread",
      (r) =>
        r.v.strategy === "income"
          ? isBestand(r.v)
            ? "n/a (Bestand)"
            : fmtPct(r.spread, 2)
          : "n/a",
    ],
    [
      "CapEx-Yield (Bestand)",
      (r) => (isBestand(r.v) ? fmtPct(capexYield(r), 2) : "n/a"),
    ],
    [
      "Downside IRR",
      (r) =>
        isBestand(r.v)
          ? "n/a (Bestand)"
          : fmtPct(r.downside?.levIRR ?? NaN, 1),
    ],
    [
      "Buchwert-Schutz GDV-Stress",
      (r, s) => {
        if (!isBestand(r.v)) return "n/a";
        const T = getThresholds(s);
        return T.buchwert > 0
          ? fmtM(gdvStressValue(r)) + " vs. " + fmtM(T.buchwert)
          : "–";
      },
    ],
    { sec: "Rendite & Kapital" },
    ["Levered IRR (ROI)", (r) => fmtPct(r.levIRR, 1)],
    ["Unlevered IRR", (r) => fmtPct(r.unlevIRR, 1)],
    ["Equity Multiple", (r) => fmtX(r.em, 2)],
    ["Amortisationszeit", (r) => fmtYr(r.payback)],
    ["Peak Equity", (r) => fmtM(r.peakEquity)],
    ["LTC", (r) => fmtPct(r.ltc, 1)],
    ["DSCR", (r) => fmtX(r.dscr, 2)],
    [
      "Break-even Miete",
      (r) =>
        isFinite(r.breakEvenRent ?? NaN)
          ? "€" + (r.breakEvenRent as number).toFixed(2) + "/m²"
          : "–",
    ],
    { sec: "Entscheidung" },
    [
      "IC-Status",
      (r) => (
        <Chip tone={statusChipTone(r.gate?.status ?? "nogo")}>
          {statusShort(r.gate?.status ?? "nogo")}
        </Chip>
      ),
    ],
    ["Gesamtscore", (r) => (r.score ?? 0) + "/100"],
  ];

  return (
    <div>
      <Card title="Kennzahlen-Vergleich aller Varianten">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border-b border-[#e0e0e0] bg-[#fafafa] p-2 text-left text-[11px] font-semibold text-[#888]">
                  Kennzahl
                </th>
                {res.map((r) => (
                  <th
                    key={r.v.id}
                    className="border-b border-[#e0e0e0] bg-[#fafafa] p-2 text-right text-[11px] font-semibold text-[#888]"
                  >
                    {r.v.name}
                    {r.v.isHybrid ? " ★" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                if ("sec" in row) {
                  return (
                    <tr key={ri}>
                      <td
                        colSpan={res.length + 1}
                        className="bg-[#f5f5f3] p-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#666]"
                      >
                        {row.sec}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={ri}>
                    <td className="border-b border-[#f0f0ee] p-2 font-medium text-[#444]">
                      {row[0]}
                    </td>
                    {res.map((r) => {
                      const best =
                        row[0] === "Gesamtscore" && (r.score ?? 0) === maxScore;
                      return (
                        <td
                          key={r.v.id}
                          className={`border-b border-[#f0f0ee] p-2 text-right ${
                            best
                              ? "bg-[#f0faf6] font-semibold text-[#0F6E56]"
                              : ""
                          }`}
                        >
                          {row[1](r, settings)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MiniBars
          title="Levered IRR (ROI)"
          labels={res.map((r) => r.v.name)}
          values={res.map((r) => r.levIRR)}
          fmt={(v) => fmtPct(v, 1)}
        />
        <MiniBars
          title="Profit on Cost"
          labels={res.map((r) => r.v.name)}
          values={res.map((r) => r.poc)}
          fmt={(v) => fmtPct(v, 1)}
        />
        <MiniBars
          title="Investmentvalue (GDV)"
          labels={res.map((r) => r.v.name)}
          values={res.map((r) => r.gdv / 1e6)}
          fmt={(v) => "€" + v.toFixed(1) + "M"}
        />
        <MiniBars
          title="Amortisationszeit (Jahre)"
          labels={res.map((r) => r.v.name)}
          values={res.map((r) =>
            r.payback !== null && isFinite(r.payback) ? r.payback : 0,
          )}
          fmt={(v) => v.toFixed(1) + " J."}
        />
      </div>
    </div>
  );
}
