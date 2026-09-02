"use client";

import {
  capexYield,
  crremInfo,
  gdvStressValue,
  getThresholds,
} from "@/lib/faas/engine";
import {
  bannerBg,
  cardTopColor,
  gateValStr,
  statusLong,
  statusShort,
  vstatBg,
} from "@/lib/faas/display";
import { fmtM, fmtPct, fmtX, fmtYr, num, sign } from "@/lib/faas/format";
import type { GateReport, RunResult } from "@/lib/faas/types";
import { DECISION_KPI_DEFS } from "@/lib/faas/defaults";

import type { FaasModel } from "./useFaasModel";
import EvalModeSwitch from "./EvalModeSwitch";
import { Callout, Card, Chip } from "./ui";

const PROC = [
  {
    n: 1,
    t: "Datenerfassung",
    d: "Bestand, Baurecht (GFZ/GRZ), DIN 276-Kosten, Marktdaten",
  },
  {
    n: 2,
    t: "Szenariomodellierung",
    d: "KI-gestützte Varianten: Refurbishment, Umnutzung, Aufstockung, Konversion",
  },
  {
    n: 3,
    t: "IC-Gate-Logik",
    d: "Konfigurierbares KPI-Set je Auftraggeber, GO/NO-GO, CRREM-Check",
  },
  {
    n: 4,
    t: "Human-in-the-Loop",
    d: "Fachliche Validierung durch Planer/Experten vor Freigabe",
    hitl: true,
  },
];

function kpiLabel(key: string): string {
  return DECISION_KPI_DEFS.find((d) => d.key === key)?.lab ?? key;
}

function VariantCard({
  r,
  isBest,
}: {
  r: RunResult;
  isBest: boolean;
}) {
  const g = r.gate as GateReport;
  const st = g.status;
  return (
    <div
      className={`rounded-[11px] border border-[#ddd] bg-white px-[0.95rem] py-[0.85rem] ${
        isBest ? "shadow-[0_0_0_2px_#1D9E75]" : ""
      }`}
      style={{ borderTop: `3px solid ${cardTopColor[st]}` }}
    >
      <div className="mb-[0.1rem] min-h-[31px] text-xs font-semibold leading-[1.3] text-[#1a3557]">
        {r.v.name}
        {isBest && (
          <span className="ml-1 align-middle text-[9px]">
            <Chip tone="g">Basisempfehlung</Chip>
          </span>
        )}
      </div>
      <div className="mb-2 text-[10px] text-[#999]">
        {r.v.isHybrid ? "Benchmark / Stretch-Ziel" : r.v.assetClass} ·{" "}
        {r.v.projectType}
      </div>
      <div className="flex items-baseline justify-between border-b border-[#f2f2f0] py-[3px] text-xs">
        <span className="text-[#666]">Immobilienwert</span>
        <span className="font-semibold text-[#1a3557]">{fmtM(r.gdv)}</span>
      </div>
      {g.decGates.map((x) => (
        <div
          key={x.key}
          className="flex items-baseline justify-between border-b border-[#f2f2f0] py-[3px] text-xs last:border-b-0"
        >
          <span className="text-[#666]">{x.k}</span>
          <span
            className={`font-semibold ${
              x.ok ? "text-[#0F6E56]" : "text-[#a32d2d]"
            }`}
          >
            {gateValStr(x)}
          </span>
        </div>
      ))}
      <div
        className={`mt-2.5 rounded-[7px] p-[5px] text-center text-xs font-bold tracking-[0.03em] ${vstatBg[st]}`}
      >
        {statusShort(st)}
      </div>
    </div>
  );
}

export default function ICMemo({ model }: { model: FaasModel }) {
  const {
    settings,
    setSettings,
    icBest,
    baseResults,
    benchResults,
    generateBenchmark,
    removeHybrid,
  } = model;

  if (!icBest) {
    return (
      <Card>
        <p className="text-sm text-[#555]">Keine Varianten vorhanden.</p>
      </Card>
    );
  }

  const r = icBest;
  const g = r.gate as GateReport;
  const T = getThresholds(settings);
  const st = g.status;
  const evalMode = settings.evalMode;
  const decNames = settings.decisionKPIs.map(kpiLabel).join(" · ");

  const plain =
    st === "go"
      ? "Alle entscheidungsrelevanten Kriterien sind erfüllt. Die Variante kann dem Investment Committee zur Freigabe vorgelegt werden."
      : st === "conditional"
        ? "Die Kernwirtschaftlichkeit trägt, eine entscheidungsrelevante Kennzahl ist grenzwertig. Freigabe unter den unten genannten Auflagen empfohlen."
        : "Mindestens eine entscheidungsrelevante Kennzahl ist verfehlt. In der vorliegenden Form ist keine Freigabe möglich; die Variante ist zu überarbeiten.";

  const heros: [string, string, string, string][] = [
    ["Investmentvalue (GDV)", fmtM(r.gdv), "Verkehrswert nach Fertigstellung", ""],
    ["Gesamtkosten (TDC)", fmtM(r.tdc), "inkl. Finanzierung b. Stabilisierung", ""],
    [
      "Gewinn (Development Profit)",
      fmtM(r.devProfit),
      "Wert minus Gesamtkosten",
      r.devProfit > 0 ? "good" : "bad",
    ],
    evalMode === "bestand"
      ? [
          "Value-Add PoC",
          fmtPct(r.vaPoc, 1),
          "Marge auf Umbaukapital · Ziel ≥" + T.minVaPoc + "%",
          r.vaPoc >= T.minVaPoc ? "good" : "bad",
        ]
      : [
          "Profit on Cost",
          fmtPct(r.poc, 1),
          "Marge auf Gesamtkosten · Ziel ≥" + T.minPoc + "%",
          r.poc >= T.minPoc ? "good" : "bad",
        ],
    [
      "ROI (Levered IRR)",
      fmtPct(r.levIRR, 1),
      "Eigenkapitalrendite · Ziel ≥" + T.minIrr + "%",
      r.levIRR >= T.minIrr ? "good" : "bad",
    ],
    [
      "Amortisationszeit",
      fmtYr(r.payback),
      "bis EK zurückgeflossen",
      r.payback !== null && isFinite(r.payback) && r.payback <= T.maxPay
        ? "good"
        : "bad",
    ],
    ["Netto-Anfangsrendite", fmtPct(r.yoc, 2), "Yield on Cost", ""],
    ["Eigenkapital (max.)", fmtM(r.peakEquity), "Peak Equity / Kapitalbedarf", ""],
  ];

  const conditions: string[] = g.decFails.map(
    (x) =>
      x.k +
      " (entscheidungsrelevant) aktuell " +
      gateValStr(x) +
      ", erforderlich " +
      (x.lower ? "max. " : "min. ") +
      x.t.toFixed(x.dec2 || 0) +
      x.unit +
      ".",
  );
  const crIC = crremInfo(r.v, r, settings);
  if (g.gfz.relevant && g.gfz.gfzZul > 0 && !g.gfz.ok)
    conditions.push(
      "GFZ-Ausnutzung " +
        g.gfz.gfzIst.toFixed(2) +
        " über zulässig " +
        g.gfz.gfzZul.toFixed(2) +
        ": Baurecht (B-Plan/§31 BauGB) klären oder Zusatzfläche reduzieren.",
    );
  if (crIC.stranded)
    conditions.push(
      "CRREM-Konformität nur bis " +
        crIC.strandingY +
        " (Exit " +
        crIC.exitY +
        "): Dekarbonisierungs-Capex einplanen oder Exit vorziehen.",
    );
  if (!r.v.vorsteuer)
    conditions.push(
      "Steuerschädliche Nutzung: kein Vorsteuerabzug – Baukosten sind inkl. " +
        num(r.v.ustPct, 19) +
        "% USt angesetzt (" +
        fmtM(r.works.ust) +
        " USt-Last).",
    );
  if (r.v.confidence === "niedrig")
    conditions.push(
      "Datenreife „niedrig“: zentrale Annahmen vor Vollfreigabe durch DD/Planung verifizieren.",
    );
  if (!conditions.length)
    conditions.push(
      "Freigabe des nächsten Projekt-Gates mit Kostenobergrenze gemäß Peak Equity zuzüglich genehmigter Reserve.",
      "Monatliches Reforecasting von Kosten, Terminen, Vermietung und Finanzierung.",
    );

  const ertragTxt =
    r.v.incomeMode === "operator"
      ? "Betreibermodell: " + r.IP.label
      : r.v.incomeMode === "segments"
        ? "Heterogener Bestand: " +
          r.IP.label +
          ", Mischmiete " +
          r.IP.perM2Rent.toFixed(2) +
          " €/m²"
        : "Zielmiete " + num(r.v.mZiel).toFixed(2) + " €/m²/Monat";

  const heroColor = (k: string) =>
    k === "good"
      ? "text-[#0F6E56]"
      : k === "amber"
        ? "text-[#BA7517]"
        : k === "bad"
          ? "text-[#a32d2d]"
          : "text-[#1a3557]";

  return (
    <div>
      {/* Prozess-Frame */}
      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {PROC.map((s) => (
          <div
            key={s.n}
            className={`relative rounded-[10px] border p-[0.7rem_0.8rem] ${
              s.hitl
                ? "border-[#1D9E75] bg-[#f0faf6]"
                : "border-[#ddd] bg-white"
            }`}
          >
            <div
              className={`absolute -top-[9px] left-3 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                s.hitl ? "bg-[#1D9E75]" : "bg-[#1a3557]"
              }`}
            >
              {s.n}
            </div>
            <div
              className={`my-[0.15rem_0_0.25rem] text-xs font-semibold ${
                s.hitl ? "text-[#0F6E56]" : "text-[#1a3557]"
              }`}
            >
              {s.t}
            </div>
            <div className="text-[10.5px] leading-[1.4] text-[#666]">{s.d}</div>
          </div>
        ))}
      </div>

      <Card title="⚖ Bewertungsmodus">
        <EvalModeSwitch settings={settings} onChange={setSettings} />
      </Card>

      {/* Decision banner */}
      <div
        className="mb-4 rounded-xl px-[1.35rem] py-[1.2rem] text-white"
        style={{ background: bannerBg[st] }}
      >
        <h2 className="mb-[0.3rem] text-xl font-semibold">{statusLong(st)}</h2>
        <div className="text-[13px] leading-[1.55] opacity-95">
          <strong>{r.v.name}</strong> · {r.v.assetClass} · Score {r.score}/100 ·{" "}
          {evalMode === "development" ? "New Development" : "Bauen im Bestand"} ·
          Bewertungsstichtag {settings.project.date} · Modell: monatlicher DCF,
          vor Steuern
        </div>
      </div>

      {/* Variant cards */}
      <Card title={`Geprüfte Varianten – Entscheidung auf Basis von: ${decNames}`}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {baseResults.map((x) => (
            <VariantCard key={x.v.id} r={x} isBest={x === icBest} />
          ))}
          {benchResults.map((x) => (
            <VariantCard key={x.v.id} r={x} isBest={false} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[#b7e3d0] bg-[#f0faf6] px-[0.7rem] py-[0.55rem] text-[11px] leading-[1.45]">
            <b className="mb-0.5 block">GO</b>Alle entscheidungsrelevanten
            Schwellen erreicht – Umsetzung ohne weitere Bedingungen empfohlen.
          </div>
          <div className="rounded-lg border border-[#f5d99a] bg-[#fff8e8] px-[0.7rem] py-[0.55rem] text-[11px] leading-[1.45]">
            <b className="mb-0.5 block">CONDITIONAL GO</b>Schwellen nur unter
            definierten Zusatzbedingungen erreichbar – eine Kennzahl
            grenzwertig.
          </div>
          <div className="rounded-lg border border-[#f0b0b0] bg-[#fff0f0] px-[0.7rem] py-[0.55rem] text-[11px] leading-[1.45]">
            <b className="mb-0.5 block">NO-GO</b>Entscheidungsrelevante Schwellen
            auf Basis aktueller Annahmen nicht erreichbar.
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generateBenchmark}
            className="rounded-lg bg-[#7F77DD] px-3.5 py-[7px] text-xs font-semibold text-white"
          >
            🧩 Benchmark / Stretch-Ziel generieren
          </button>
          {benchResults.length > 0 && (
            <button
              type="button"
              onClick={removeHybrid}
              className="rounded-lg border border-[#7F77DD] bg-[#f2f1fb] px-3.5 py-[7px] text-xs font-semibold text-[#4a45a0]"
            >
              Benchmark entfernen
            </button>
          )}
        </div>
        {benchResults[0]?.v._modular && (
          <div className="mt-3 text-[11px] leading-[1.6] text-[#555]">
            <div className="font-bold text-[#4a45a0]">
              Stufe 1 – Nutzungs-Allokation:
            </div>
            <div className="mb-1">
              {benchResults[0].v._allocParts?.map((p) => `${p.k} ${p.v}`).join(" · ") ||
                "Einzelnutzung"}
            </div>
            <div className="font-bold text-[#4a45a0]">Stufe 2 – Wertmodule:</div>
            <div className="mb-1">
              {benchResults[0].v._activeModules?.length
                ? benchResults[0].v._activeModules
                    .map((m) => m.name.split("(")[0].trim())
                    .join(" + ")
                : "Kein Wertmodul verbessert das Anforderungsprofil."}
            </div>
            <div className="text-[10.5px] text-[#777]">
              Erreicht:{" "}
              {evalMode === "bestand"
                ? "Value-Add-PoC " + fmtPct(benchResults[0].v._econEff ?? NaN, 1)
                : "Profit on Cost " +
                  fmtPct(benchResults[0].v._econEff ?? NaN, 1)}
              , IRR {fmtPct(benchResults[0].v._econIrr ?? NaN, 1)}, Peak Equity{" "}
              {fmtM(benchResults[0].v._econEquity ?? NaN)}. Anforderungsprofil:
              GO-Variante {benchResults[0].v._goScore?.toFixed(2) ?? "–"} ▸
              Benchmark {benchResults[0].v._hybScore?.toFixed(2) ?? "–"}.
            </div>
          </div>
        )}
      </Card>

      {/* Hero grid */}
      <Card title={`Basisempfehlung im Detail – ${r.v.name}`}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {heros.map((h) => (
            <div
              key={h[0]}
              className="rounded-[10px] border border-[#ddd] bg-white px-4 py-[0.85rem]"
            >
              <div className="mb-[5px] text-[11px] uppercase tracking-[0.04em] text-[#777]">
                {h[0]}
              </div>
              <div className={`text-[23px] font-bold leading-[1.1] ${heroColor(h[3])}`}>
                {h[1]}
              </div>
              <div className="mt-1 text-[11px] leading-[1.35] text-[#888]">
                {h[2]}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Narrative */}
      <div className="mb-4 rounded-[10px] border border-[#ddd] bg-white px-5 py-4 text-[13px] leading-[1.7] text-[#333]">
        <strong className="text-[#1a3557]">{r.v.name}</strong> ({r.v.assetClass},{" "}
        {r.v.projectType})
        {g.isRefurb && (
          <span className="ml-1 rounded-md bg-[#0EA5E9] px-2 py-0.5 text-[11px] font-semibold text-white">
            Bauen im Bestand
          </span>
        )}{" "}
        am Standort {settings.project.ort}. {ertragTxt}. Bei einer
        Gesamtinvestition von <strong>{fmtM(r.tdc)}</strong> entsteht ein
        Investmentwert von <strong>{fmtM(r.gdv)}</strong> und damit ein
        Entwicklungsgewinn von <strong>{fmtM(r.devProfit)}</strong> (Marge{" "}
        {fmtPct(r.poc, 1)}). Die Eigenkapitalrendite (Levered IRR) beträgt{" "}
        <strong>{fmtPct(r.levIRR, 1)}</strong> bei einem maximalen
        Eigenkapitaleinsatz von <strong>{fmtM(r.peakEquity)}</strong> und
        Rückfluss nach <strong>{fmtYr(r.payback)}</strong>.{" "}
        {g.isRefurb && (
          <>
            CapEx-Yield = <strong>{fmtPct(capexYield(r), 2)}</strong> (Schwelle ≥{" "}
            {settings.thresholds.mincapexyield}%); Buchwert-Schutz: GDV-Stress ={" "}
            <strong>{fmtM(gdvStressValue(r))}</strong> vs. Buchwert{" "}
            <strong>{fmtM(settings.thresholds.buchwert)}</strong> (
            {g.bwOK ? "✓ kein Kapitalverlust" : "✗ GDV-Stress unter Buchwert"}).{" "}
          </>
        )}
        Im IC-Stressfall (Miete {sign(settings.downside.rent)}
        {settings.downside.rent}%, Kosten {sign(settings.downside.cost)}
        {settings.downside.cost}%, Exit +{settings.downside.yield} Bp.) liegt der
        IRR bei <strong>{fmtPct(r.downside?.levIRR ?? NaN, 1)}</strong>. {plain}
      </div>

      {/* Auf einen Blick */}
      <Card title="Auf einen Blick">
        <div className="flex flex-wrap gap-1.5">
          {[
            `Fläche ${Math.round(r.area).toLocaleString("de-DE")} m²`,
            `BGF ${Math.round(g.gfz.bgfNach).toLocaleString("de-DE")} m²`,
            `Bauzeit ${r.devMonths} Mon.`,
            `Haltedauer ${num(r.v.halt)} J.`,
            `FK/LTC ${fmtPct(r.ltc, 0)}`,
            `DSCR ${fmtX(r.dscr, 2)}`,
            `Equity Multiple ${fmtX(r.em, 2)}`,
            `Exit-Yield ${fmtPct(r.exitYield, 2)}`,
            r.v.vorsteuer ? "Vorsteuerabzug" : "steuerschädlich (inkl. USt)",
            ...(r.grant > 0 ? [`Zuschuss ${fmtM(r.grant)}`] : []),
            ...(r.foerderLoan > 0
              ? [`Förderdarlehen ${fmtM(r.foerderLoan)}`]
              : []),
          ].map((s, i) => (
            <span
              key={i}
              className="rounded-[5px] bg-[#f0f0ee] px-[7px] py-[3px] text-[10px] text-[#555]"
            >
              {s}
            </span>
          ))}
        </div>
      </Card>

      {/* Empfehlung & Auflagen */}
      <Card title="Empfehlung & Auflagen">
        <ol className="ml-[1.1rem] list-decimal text-[12.5px] leading-[1.6] text-[#444]">
          {conditions.map((c, i) => (
            <li key={i} className="my-1">
              {c}
            </li>
          ))}
        </ol>
        <Callout kind="warn">
          <strong>Stage-Gate:</strong> Die Freigabe ist eine
          Investoren-/Eigentümerentscheidung für die nächste Projektphase.
          Genehmigungs-, Planungs-, Vermietungs- und Finanzierungsvorbehalte
          bestehen bis zur belastbaren Verifizierung fort.
        </Callout>
      </Card>

      {/* Gate detail */}
      <details className="mb-4 rounded-[10px] border border-[#ddd] bg-white px-4 py-2">
        <summary className="cursor-pointer py-[0.4rem] text-xs font-semibold text-[#1a3557]">
          Prüfkriterien im Detail (Investment-Gates) & Methodik
        </summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr>
                {["Kriterium", "Modell", "Hürde", "Status"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-[#ddd] bg-[#fafafa] p-1.5 text-left text-[#777]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.gates.map((x) => (
                <tr
                  key={x.key}
                  className={x.dec ? "bg-[#f7fbf8]" : undefined}
                >
                  <td className="border-b border-[#eee] p-1.5">
                    {x.k}{" "}
                    {x.dec ? (
                      <Chip tone="g">Entscheidung</Chip>
                    ) : (
                      <span className="text-[9px] text-[#9CA3AF]">
                        informativ
                      </span>
                    )}
                    {x.note && (
                      <div className="text-[10px] text-[#6B7280]">{x.note}</div>
                    )}
                  </td>
                  <td className="border-b border-[#eee] p-1.5 text-right">
                    {gateValStr(x)}
                  </td>
                  <td className="border-b border-[#eee] p-1.5 text-right">
                    {(x.lower ? "≤ " : "≥ ") + x.t.toFixed(x.dec2 || 0) + x.unit}
                  </td>
                  <td
                    className={`border-b border-[#eee] p-1.5 text-right font-semibold ${
                      x.ok ? "text-[#0F6E56]" : "text-[#a32d2d]"
                    }`}
                  >
                    {x.ok ? "erfüllt" : "verfehlt"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[10px] leading-[1.5] text-[#999]">
          Methodik: nominale monatliche Cashflows; explizite Baukostenphasen
          (S-Kurve), Kosten-/Mietsteigerung, Bestands-NOI während der Bauzeit,
          Vermietungsanlauf und Incentives, Exitkosten, Finanzierung auf gezogene
          Beträge inkl. Förderdarlehen-Mischzins und Zuschuss,
          Darlehensrückführung beim Exit; unlevered/levered IRR und NPV.
          Betreibermodelle als Umsatzpacht bzw. €/Einheit. Steuerschädliche
          Nutzungen ohne Vorsteuerabzug. Ergebnisse sind eine
          Investmententscheidungs-Unterstützung, kein Verkehrswertgutachten,
          Kreditangebot oder Steuer-/Rechtsberatung.
        </div>
      </details>
    </div>
  );
}
