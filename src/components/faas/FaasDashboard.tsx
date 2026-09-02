"use client";

import { useState } from "react";

import { gfzInfo, isBestand } from "@/lib/faas/engine";

import { useFaasModel } from "./useFaasModel";
import ICMemo from "./ICMemo";
import VariantsEditor from "./VariantsEditor";
import Comparison from "./Comparison";
import Costs from "./Costs";
import Sensitivity from "./Sensitivity";
import Assumptions from "./Assumptions";
import Schedule from "./Schedule";
import Risks from "./Risks";

type TabKey =
  | "ic"
  | "varianten"
  | "vergleich"
  | "projekt"
  | "kosten"
  | "sens"
  | "risiken"
  | "termine"
  | "annahmen";

const GROUP1: { key: TabKey; label: string; cls: string }[] = [
  { key: "ic", label: "★ IC-Entscheidung", cls: "ic" },
  { key: "varianten", label: "▶ Varianten", cls: "inp" },
  { key: "vergleich", label: "⇄ Vergleich", cls: "" },
];
const GROUP2: { key: TabKey; label: string }[] = [
  { key: "kosten", label: "Kosten" },
  { key: "sens", label: "Sensitivität" },
  { key: "risiken", label: "Risiken" },
  { key: "termine", label: "Termine" },
  { key: "annahmen", label: "⚙ Annahmen & KPI-Setup" },
];

export default function FaasDashboard() {
  const model = useFaasModel();
  const [tab, setTab] = useState<TabKey>("ic");

  function exportCSV() {
    const { results, settings } = model;
    if (!results.length) return;
    const head = [
      "Variante",
      "Assetklasse",
      "Projektart",
      "IC-Status",
      "Mietflaeche m2",
      "BGF n.M. m2",
      "GFZ Ist",
      "USt-Abzug",
      "Investmentvalue GDV EUR",
      "TDC EUR",
      "Development Profit EUR",
      "Profit on Cost %",
      "Levered IRR %",
      "Unlevered IRR %",
      "Equity Multiple",
      "Amortisation J",
      "Peak Equity EUR",
      "LTC %",
      "DSCR",
      "Downside IRR %",
      "CRREM Jahr",
      "Score",
    ];
    const rows: (string | number)[][] = [
      ["FaaS Investor Dashboard v8"],
      [settings.project.name],
      [settings.project.ort],
      ["Stichtag", settings.project.date],
      [],
      head,
    ];
    results.forEach((r) => {
      const gi = gfzInfo(r.v, settings);
      rows.push([
        r.v.name,
        r.v.assetClass,
        r.v.projectType,
        r.gate?.status ?? "",
        Math.round(r.area),
        Math.round(gi.bgfNach),
        gi.gfzIst.toFixed(2),
        r.v.vorsteuer ? "ja" : "nein",
        Math.round(r.gdv),
        Math.round(r.tdc),
        Math.round(r.devProfit),
        r.poc.toFixed(1),
        r.levIRR.toFixed(1),
        r.unlevIRR.toFixed(1),
        r.em.toFixed(2),
        r.payback !== null && isFinite(r.payback) ? r.payback.toFixed(1) : "",
        Math.round(r.peakEquity),
        r.ltc.toFixed(1),
        r.dscr.toFixed(2),
        isBestand(r.v)
          ? "BW-Schutz:" + (r.gate?.bwOK ? "OK" : "FAIL")
          : (r.downside?.levIRR ?? NaN).toFixed(1),
        r.v.crremYear || "",
        r.score ?? 0,
      ]);
    });
    const csv = rows
      .map((r) =>
        r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(";"),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
    );
    a.download =
      (model.settings.project.name || "FaaS").replace(/[^a-zA-Z0-9_-]/g, "_") +
      "_IC.csv";
    a.click();
  }

  const tabBtn = (active: boolean, extra = "") =>
    `rounded-md border px-3.5 py-1.5 text-xs ${
      active
        ? "border-[#aaa] bg-[#f0f0ee] font-medium text-[#111]"
        : "border-[#ccc] bg-white text-[#555]"
    } ${extra}`;

  return (
    <div className="min-h-screen bg-[#f5f5f3] font-sans text-[14px] text-[#1a1a18]">
      <div className="mx-auto max-w-[1180px] p-4">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#ddd] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <svg width="112" height="36" viewBox="0 0 370 120" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M30 95 L30 52 L58 24 L86 52 L86 95 Z"
                fill="none"
                stroke="#1a3557"
                strokeWidth="8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path d="M47 88 C47 70 62 58 74 56 C74 74 62 86 47 88 Z" fill="#2aaa8a" />
              <path d="M47 88 C54 78 62 68 74 56 C68 64 58 76 47 88 Z" fill="#1a7a64" />
              <text x="100" y="65" fontFamily="system-ui,Arial,sans-serif" fontSize="36" fontWeight="700" fill="#1a3557">
                SustainEstates
              </text>
              <text x="100" y="90" fontFamily="system-ui,Arial,sans-serif" fontSize="15" fill="#2a6080">
                Added Value in Built Environment
              </text>
            </svg>
            <div className="border-l border-[#ddd] pl-3">
              <div className="text-[13px] font-semibold">
                FaaS Investor Dashboard{" "}
                <span className="text-[10px] text-[#1D9E75]">v8.3</span>
              </div>
              <div className="mt-px text-[11px] text-[#666]">
                {model.settings.project.name} · {model.settings.project.ort}
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <span className="rounded-md bg-[#eaf3de] px-2.5 py-[3px] text-[11px] font-medium text-[#3b6d11]">
              ● Aktiv
            </span>
            <button
              type="button"
              onClick={exportCSV}
              className="rounded-md border border-[#ccc] bg-white px-2.5 py-1 text-[11px] text-[#444]"
            >
              ⭳ CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 self-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#aaa]">
              Entscheidung
            </span>
            {GROUP1.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={tabBtn(
                  tab === t.key,
                  t.cls === "ic"
                    ? tab === t.key
                      ? "!border-[#1a3557] !bg-[#1a3557] !text-white"
                      : "!border-[#1a3557] !text-[#1a3557] !bg-[#eef3fa] font-semibold"
                    : t.cls === "inp"
                      ? tab === t.key
                        ? "!border-[#1D9E75] !bg-[#1D9E75] !text-white"
                        : "!border-[#1D9E75] !text-[#0F6E56] !bg-[#f0faf6]"
                      : "",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 self-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#aaa]">
              Absicherung &amp; Setup
            </span>
            {GROUP2.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-md border px-2.5 py-[5px] text-[11px] ${
                  tab === t.key
                    ? "border-[#bbb] bg-[#e8e8e4] text-[#333]"
                    : "border-[#e0e0e0] bg-[#f7f7f5] text-[#777]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "ic" && <ICMemo model={model} />}
        {tab === "varianten" && <VariantsEditor model={model} />}
        {tab === "vergleich" && <Comparison model={model} />}
        {tab === "kosten" && <Costs model={model} />}
        {tab === "sens" && <Sensitivity model={model} />}
        {tab === "risiken" && <Risks model={model} />}
        {tab === "termine" && <Schedule model={model} />}
        {tab === "annahmen" && <Assumptions model={model} />}

        <p className="mt-8 text-[10px] leading-[1.6] text-[#999]">
          Investmententscheidungs-Unterstützung — kein Verkehrswertgutachten,
          Kreditangebot oder Steuer-/Rechtsberatung. Modell: monatlicher DCF, vor
          Steuern. Portiert aus FaaS_Dashboard v8.3.
        </p>
      </div>
    </div>
  );
}
