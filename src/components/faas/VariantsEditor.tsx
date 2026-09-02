"use client";

import { useState } from "react";

import { applyAssetDefaults, ASSET_CLASSES, operatorKind } from "@/lib/faas/engine";
import { PROJECT_TYPES } from "@/lib/faas/defaults";
import type { IncomeMode, Segment, Variant } from "@/lib/faas/types";

import type { FaasModel } from "./useFaasModel";
import { newHybrid } from "./useFaasModel";
import { optimizeHybrid } from "@/lib/faas/hybrid";
import {
  Callout,
  Card,
  GRID4,
  InfoBox,
  NumberField,
  SelectField,
  TextField,
} from "./ui";

function nutzIcon(c: string): string {
  if (!c) return "🏢";
  if (/Büro/.test(c)) return "🏢";
  if (/Wohn|apartments/i.test(c)) return "🏠";
  if (/Hotel/.test(c)) return "🏨";
  if (/Senior|Betreut|Pflege/i.test(c)) return "🏥";
  if (/Mixed/.test(c)) return "🏙️";
  if (/Logistik|Industrial|Rechen/i.test(c)) return "🏭";
  if (/Einzelhandel/.test(c)) return "🛍️";
  return "🏗️";
}

function VariantForm({
  v,
  onPatch,
}: {
  v: Variant;
  onPatch: (patch: Partial<Variant>) => void;
}) {
  const op = operatorKind(v.assetClass);
  const incomeOpts: { value: IncomeMode; label: string }[] = [
    { value: "standard", label: "Einheitliche Zielmiete" },
    { value: "segments", label: "Segmente (heterogener Bauzustand)" },
  ];
  if (op) incomeOpts.push({ value: "operator", label: "Betreibermodell" });

  const setSegments = (segments: Segment[]) => onPatch({ segments });

  return (
    <div>
      <Card title={`${nutzIcon(v.assetClass)} ${v.name}`}>
        <div className={GRID4}>
          <TextField
            label="Variantenname"
            value={v.name}
            onChange={(name) => onPatch({ name })}
          />
          <SelectField
            label="Assetklasse"
            value={v.assetClass}
            options={ASSET_CLASSES}
            onChange={(assetClass) => {
              const next = { ...v, assetClass };
              applyAssetDefaults(next);
              onPatch({
                assetClass,
                vorsteuer: next.vorsteuer,
                incomeMode: next.incomeMode,
              });
            }}
          />
          <SelectField
            label="Projektart"
            value={v.projectType}
            options={PROJECT_TYPES}
            onChange={(projectType) => onPatch({ projectType })}
          />
          <SelectField
            label="Exitstrategie"
            value={v.strategy}
            options={[
              { value: "income" as const, label: "Hold / Vermietung / Exit" },
              { value: "sell" as const, label: "Verkauf nach Fertigstellung" },
            ]}
            onChange={(strategy) => onPatch({ strategy })}
          />
          <SelectField
            label="Datenreife"
            value={v.confidence}
            options={[
              { value: "niedrig" as const, label: "niedrig" },
              { value: "mittel" as const, label: "mittel" },
              { value: "hoch" as const, label: "hoch" },
            ]}
            onChange={(confidence) => onPatch({ confidence })}
          />
          <SelectField
            label="USt-Behandlung"
            value={v.vorsteuer ? "true" : "false"}
            options={[
              { value: "true" as const, label: "Vorsteuerabzug (Kosten netto)" },
              { value: "false" as const, label: "steuerschädlich (inkl. USt)" },
            ]}
            onChange={(val) => onPatch({ vorsteuer: val === "true" })}
          />
        </div>
      </Card>

      <Card title="Flächen & Dichte">
        <div className={GRID4}>
          <NumberField label="BGF (m²)" value={v.bgf} step={100} onChange={(bgf) => onPatch({ bgf })} />
          <NumberField
            label="Mietfläche / Nutzfläche (m²)"
            hint="bei Segmenten aus Summe abgeleitet"
            value={v.mietFl}
            step={100}
            onChange={(mietFl) => onPatch({ mietFl })}
          />
          <NumberField
            label="Bestands-Mietfläche (m²)"
            hint="für Flächengewinn"
            value={v.flBestand}
            step={100}
            onChange={(flBestand) => onPatch({ flBestand })}
          />
          <NumberField
            label="Zusätzliche BGF (m²)"
            hint="Aufstockung/Anbau, GFZ"
            value={v.bgfZusatz}
            step={100}
            onChange={(bgfZusatz) => onPatch({ bgfZusatz })}
          />
          <NumberField
            label="Baukosten Zusatzfläche (€/m²)"
            value={v.aufstockCostM2}
            step={50}
            onChange={(aufstockCostM2) => onPatch({ aufstockCostM2 })}
          />
        </div>
      </Card>

      <Card title="Mieten & Ertrag">
        <div className={GRID4}>
          <SelectField
            label="Ertragslogik"
            value={v.incomeMode}
            options={incomeOpts}
            onChange={(incomeMode) => onPatch({ incomeMode })}
          />
        </div>

        {v.incomeMode === "operator" && op === "hotel" && (
          <>
            <Callout kind="info">
              Betreibermodell Hotel: Eigentümer-Einnahme über{" "}
              <strong>Umsatzpacht</strong> (% des Zimmerumsatzes) oder{" "}
              <strong>€/Zimmer/Monat</strong>.
            </Callout>
            <div className={GRID4}>
              <SelectField
                label="Betreibermodell"
                value={v.operatorModel}
                options={[
                  { value: "pacht" as const, label: "Umsatzpacht (%)" },
                  { value: "unit" as const, label: "€/Zimmer/Monat" },
                ]}
                onChange={(operatorModel) => onPatch({ operatorModel })}
              />
              <NumberField label="Zimmer" value={v.hotelRooms} step={1} onChange={(hotelRooms) => onPatch({ hotelRooms })} />
              <NumberField
                label={v.operatorModel === "unit" ? "Pacht €/Zimmer/Monat" : "ADR (€/Nacht)"}
                value={v.hotelADR}
                step={1}
                onChange={(hotelADR) => onPatch({ hotelADR })}
              />
              {v.operatorModel === "pacht" && (
                <>
                  <NumberField label="Auslastung (%)" value={v.hotelOcc} step={1} onChange={(hotelOcc) => onPatch({ hotelOcc })} />
                  <NumberField label="Pachtquote (%)" value={v.hotelPachtQuote} step={1} onChange={(hotelPachtQuote) => onPatch({ hotelPachtQuote })} />
                </>
              )}
            </div>
          </>
        )}

        {v.incomeMode === "operator" && op === "care" && (
          <>
            <Callout kind="info">
              Betreibermodell Pflege/Senior: Eigentümer-Einnahme als{" "}
              <strong>Pacht €/Platz/Monat</strong>.
            </Callout>
            <div className={GRID4}>
              <SelectField
                label="Betreibermodell"
                value={v.operatorModel}
                options={[
                  { value: "unit" as const, label: "€/Platz/Monat" },
                  { value: "pacht" as const, label: "Umsatzpacht (%)" },
                ]}
                onChange={(operatorModel) => onPatch({ operatorModel })}
              />
              <NumberField label="Plätze / Einheiten" value={v.careUnits} step={1} onChange={(careUnits) => onPatch({ careUnits })} />
              <NumberField label="Pacht €/Platz/Monat" value={v.carePachtUnitMonth} step={10} onChange={(carePachtUnitMonth) => onPatch({ carePachtUnitMonth })} />
              {v.operatorModel === "pacht" && (
                <NumberField label="Umsatzpachtquote (%)" value={v.hotelPachtQuote} step={1} onChange={(hotelPachtQuote) => onPatch({ hotelPachtQuote })} />
              )}
            </div>
          </>
        )}

        {v.incomeMode === "segments" && (
          <>
            <Callout kind="info">
              Heterogener Bestand: je Bauzustand ein Segment mit eigener Fläche,
              Miete, Leerstand und Sanierungs-Capex. Miete und Fläche werden
              gewichtet aggregiert.
            </Callout>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-left text-[11px] text-[#888]">
                    <th className="p-1.5">Segment</th>
                    <th className="p-1.5">Fläche m²</th>
                    <th className="p-1.5">Miete €/m²/Mon.</th>
                    <th className="p-1.5">Leerst.%</th>
                    <th className="p-1.5">Capex €/m²</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {(v.segments ?? []).map((s, si) => (
                    <tr key={si}>
                      {(
                        [
                          ["name", "text"],
                          ["area", "number"],
                          ["rent", "number"],
                          ["leer", "number"],
                          ["capexM2", "number"],
                        ] as const
                      ).map(([key, type]) => (
                        <td key={key} className="p-1">
                          <input
                            type={type}
                            className="w-full rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs outline-none focus:border-[#1D9E75] focus:bg-white"
                            value={s[key] as string | number}
                            onChange={(e) => {
                              const next = [...(v.segments ?? [])];
                              next[si] = {
                                ...s,
                                [key]:
                                  key === "name"
                                    ? e.target.value
                                    : parseFloat(e.target.value) || 0,
                              };
                              setSegments(next);
                            }}
                          />
                        </td>
                      ))}
                      <td className="p-1">
                        <button
                          type="button"
                          className="rounded border border-[#f5c0c0] bg-[#fff8f8] px-2 py-1 text-[11px] text-[#a32d2d]"
                          onClick={() =>
                            setSegments(
                              (v.segments ?? []).filter((_, i) => i !== si),
                            )
                          }
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-right">
              <button
                type="button"
                className="rounded border border-[#1D9E75] bg-[#f0faf6] px-2.5 py-1 text-[11px] text-[#0F6E56]"
                onClick={() =>
                  setSegments([
                    ...(v.segments ?? []),
                    { name: "Neues Segment", area: 1000, rent: 15, leer: 5, capexM2: 400 },
                  ])
                }
              >
                + Segment
              </button>
            </div>
          </>
        )}

        {v.incomeMode === "standard" && (
          <div className={GRID4}>
            <NumberField label="Zielmiete (€/m²/Mon.)" value={v.mZiel} step={0.25} onChange={(mZiel) => onPatch({ mZiel })} />
            <NumberField label="Stabilisierter Leerstand (%)" value={v.leer} step={0.5} onChange={(leer) => onPatch({ leer })} />
          </div>
        )}

        <div className={`${GRID4} mt-2`}>
          <NumberField label="Nicht umlagefähige Kosten p.a. (€)" value={v.nuk} step={10000} onChange={(nuk) => onPatch({ nuk })} />
          <NumberField label="Laufender Capex (€/m²/J.)" value={v.capex} step={1} onChange={(capex) => onPatch({ capex })} />
          <NumberField label="Aktueller NOI p.a. (€)" value={v.currentNOI} step={10000} onChange={(currentNOI) => onPatch({ currentNOI })} />
          <NumberField label="NOI während Bau erhalten (%)" value={v.retained} step={5} onChange={(retained) => onPatch({ retained })} />
        </div>
      </Card>

      <Card title="Kosten (DIN 276) & Bestandswert">
        <Callout kind="warn">
          KGR 100 = Opportunitätskosten des Grundstücks/Bestands (Kaufpreis-Ansatz).
          Aktueller Buchwert separat unter Annahmen → IC-Gates.
        </Callout>
        <div className={GRID4}>
          <NumberField label="KGR 100 / Bestandswert (€)" value={v.c100} step={100000} onChange={(c100) => onPatch({ c100 })} />
          <NumberField label="Erwerbs-NK (%)" value={v.acqPct} step={0.5} onChange={(acqPct) => onPatch({ acqPct })} />
          <NumberField label="KGR 200 (€)" value={v.c200} step={50000} onChange={(c200) => onPatch({ c200 })} />
          <NumberField label="KGR 300 (€)" value={v.c300} step={100000} onChange={(c300) => onPatch({ c300 })} />
          <NumberField label="KGR 400 (€)" value={v.c400} step={100000} onChange={(c400) => onPatch({ c400 })} />
          <NumberField label="KGR 500 (€)" value={v.c500} step={50000} onChange={(c500) => onPatch({ c500 })} />
          <NumberField label="KGR 600 (€)" value={v.c600} step={50000} onChange={(c600) => onPatch({ c600 })} />
          <NumberField label="KGR 700 (€)" value={v.c700} step={100000} onChange={(c700) => onPatch({ c700 })} />
          <NumberField label="Risiko-/Planungsreserve (%)" value={v.puf} step={0.5} onChange={(puf) => onPatch({ puf })} />
        </div>
      </Card>

      <Card title="Zeiten, Exit & Vermarktung">
        <div className={GRID4}>
          <NumberField label="Bauzeit (Monate)" value={v.devMonths} step={1} onChange={(devMonths) => onPatch({ devMonths })} />
          <NumberField label="Vermietungsanlauf (Monate)" value={v.leaseMonths} step={1} onChange={(leaseMonths) => onPatch({ leaseMonths })} />
          <NumberField label="Verkaufsphase (Monate)" value={v.saleMonths} step={1} onChange={(saleMonths) => onPatch({ saleMonths })} />
          <NumberField label="Pre-let / Vorverkauf (%)" value={v.prelet} step={5} onChange={(prelet) => onPatch({ prelet })} />
          <NumberField label="Exit Yield (%)" value={v.exitYield} step={0.1} onChange={(exitYield) => onPatch({ exitYield })} />
          <NumberField label="Verkaufskosten (%)" value={v.saleCosts} step={0.25} onChange={(saleCosts) => onPatch({ saleCosts })} />
          <NumberField label="Haltedauer n. Fertigst. (J.)" value={v.halt} step={1} onChange={(halt) => onPatch({ halt })} />
          <NumberField label="Verkaufspreis €/m² (Sell)" value={v.salesPrice} step={100} onChange={(salesPrice) => onPatch({ salesPrice })} />
          <NumberField label="Tenant Improvements (€/m²)" value={v.ti} step={10} onChange={(ti) => onPatch({ ti })} />
          <NumberField label="Rent-free (Monate)" value={v.rentFree} step={1} onChange={(rentFree) => onPatch({ rentFree })} />
          <NumberField label="Leasing Fee (% JM)" value={v.leasingFee} step={1} onChange={(leasingFee) => onPatch({ leasingFee })} />
        </div>
      </Card>

      <details className="mb-4 rounded-[10px] border border-[#ddd] bg-white px-4 py-2">
        <summary className="cursor-pointer py-[0.4rem] text-xs font-semibold text-[#1a3557]">
          Hintergrund: Förderung, Risiko & ESG
        </summary>
        <div className={`${GRID4} mt-2.5`}>
          <NumberField label="Förderzuschuss (€)" hint="BEG/BAFA – senkt Nettokosten" value={v.foerderZuschuss} step={50000} onChange={(foerderZuschuss) => onPatch({ foerderZuschuss })} />
          <NumberField label="Förderdarlehen (€)" hint="KfW/NRW.BANK – Zinsvorteil" value={v.foerderDarlehen} step={100000} onChange={(foerderDarlehen) => onPatch({ foerderDarlehen })} />
          <NumberField label="USt-Satz (%)" value={v.ustPct} step={0.5} onChange={(ustPct) => onPatch({ ustPct })} />
          <SelectField
            label="Risikostufe"
            value={v.risk}
            options={[
              { value: "niedrig" as const, label: "niedrig" },
              { value: "mittel" as const, label: "mittel" },
              { value: "hoch" as const, label: "hoch" },
            ]}
            onChange={(risk) => onPatch({ risk })}
          />
          <SelectField
            label="ESG-Underwriting"
            value={v.esg}
            options={[
              { value: "aligned" as const, label: "ambitioniert / aligned" },
              { value: "partial" as const, label: "teilweise" },
              { value: "none" as const, label: "nicht bewertet" },
            ]}
            onChange={(esg) => onPatch({ esg })}
          />
          <NumberField label="CRREM-konform bis Jahr" value={v.crremYear} step={1} onChange={(crremYear) => onPatch({ crremYear })} />
          <NumberField label="Ziel-Endenergie (kWh/m²a)" value={v.energyTarget} step={5} onChange={(energyTarget) => onPatch({ energyTarget })} />
          <TextField label="Risikohinweis" value={v.riskNote} onChange={(riskNote) => onPatch({ riskNote })} />
        </div>
      </details>
    </div>
  );
}

function HybridEditor({ model }: { model: FaasModel }) {
  const { variants, settings, hybrid, setHybrid, generateBenchmark } = model;
  const h = hybrid ?? newHybrid();
  const bases = variants.filter((v) => !v.isHybrid);
  const allocSum = bases.reduce((a, v) => a + (h.allocation[v.id] || 0), 0);

  const setAlloc = (id: number, val: number) =>
    setHybrid({ ...h, allocation: { ...h.allocation, [id]: val } });

  return (
    <div>
      <Card title="🧩 Benchmark / Stretch-Ziel – zweistufig">
        <Callout kind="info">
          <strong>Stufe 1 – Nutzungs-Allokation:</strong> flächengewichtete
          Kombination der realen Nutzungen (leer = automatische Raster-Suche).{" "}
          <strong>Stufe 2 – Wertmodule:</strong> beim Generieren werden
          energetische Sanierung, Aufstockung, EG-Umnutzung, Vorvermietung und
          Phasing greedy zugeschaltet.
        </Callout>
        <div className={GRID4}>
          <TextField label="Name" value={h.name} onChange={(name) => setHybrid({ ...h, name })} />
          <NumberField label="Haltedauer (J.)" value={h.halt} onChange={(halt) => setHybrid({ ...h, halt })} />
          <NumberField label="Zusätzliche BGF (m²)" value={h.bgfZusatz} onChange={(bgfZusatz) => setHybrid({ ...h, bgfZusatz })} />
        </div>
      </Card>

      <Card title="Stufe 1 – Nutzungs-Allokation (Flächenanteile, Summe 100%)">
        {bases.map((v) => (
          <div key={v.id} className="mb-1.5 flex items-center gap-2">
            <span className="w-[200px] text-xs text-[#444]">
              {nutzIcon(v.assetClass)} {v.name}
            </span>
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              className="w-20 rounded border border-[#ccc] px-1.5 py-1 text-xs"
              value={h.allocation[v.id] || 0}
              onChange={(e) => setAlloc(v.id, parseFloat(e.target.value) || 0)}
            />{" "}
            %
          </div>
        ))}
        <div
          className="mt-1.5 text-xs"
          style={{
            color:
              allocSum === 0
                ? "#888"
                : Math.abs(allocSum - 100) < 0.5
                  ? "#0F6E56"
                  : "#a32d2d",
          }}
        >
          Summe: {allocSum}%{" "}
          {allocSum === 0
            ? "(leer → automatische Raster-Optimierung)"
            : Math.abs(allocSum - 100) < 0.5
              ? "✓"
              : "(wird auf 100% normiert)"}
        </div>
        <div className="mt-2 flex flex-wrap justify-end gap-1.5">
          <button
            type="button"
            className="rounded border border-[#e0e0e0] bg-[#f5f5f3] px-2.5 py-1 text-[11px] text-[#555]"
            onClick={() => setHybrid({ ...h, allocation: {} })}
          >
            ↺ Anteile zurücksetzen
          </button>
          <button
            type="button"
            className="rounded border border-[#7F77DD] bg-[#f2f1fb] px-2.5 py-1 text-[11px] font-semibold text-[#4a45a0]"
            onClick={() => {
              const best = optimizeHybrid(h, variants, settings);
              if (best) setHybrid({ ...h, allocation: best, hybridMode: "alloc" });
            }}
          >
            ⚡ Allokation auto-optimieren (IRR)
          </button>
          <button
            type="button"
            className="rounded border border-[#7F77DD] bg-[#7F77DD] px-2.5 py-1 text-[11px] font-semibold text-white"
            onClick={generateBenchmark}
          >
            🧩 Benchmark generieren (Stufe 1 + 2)
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function VariantsEditor({ model }: { model: FaasModel }) {
  const { variants, updateVariant, addVariant, deleteVariant } = model;
  const bases = variants.filter((v) => !v.isHybrid);
  const [active, setActive] = useState(0); // -1 => hybrid editor

  const idx = Math.min(active, bases.length - 1);
  const current = active === -1 ? null : bases[idx];

  return (
    <div>
      <InfoBox>
        Bis zu 6 Nutzungsvarianten plus eine <strong>Hybridvariante</strong>. Je
        Variante: Assetklasse, Flächen, Mieten, Betreibermodell, USt-Behandlung,
        Kosten und Zeiten.
      </InfoBox>

      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-[#e0e0e0] pb-2.5">
        {bases.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-md border px-3 py-[5px] text-xs ${
              active === i
                ? "border-[#aaa] bg-[#f0f0ee] font-medium text-[#333]"
                : "border-[#ccc] bg-white text-[#555]"
            }`}
          >
            {nutzIcon(v.assetClass)} {v.name}
            {bases.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                className="ml-1 text-[#bbb] hover:text-[#E24B4A]"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteVariant(v.id);
                  setActive((a) => Math.max(0, Math.min(a, bases.length - 2)));
                }}
              >
                ✕
              </span>
            )}
          </button>
        ))}
        {bases.length < 6 && (
          <button
            type="button"
            onClick={addVariant}
            className="rounded-md border border-[#1D9E75] bg-[#f0faf6] px-2.5 py-[5px] text-[11px] text-[#0F6E56]"
          >
            + Variante
          </button>
        )}
        <button
          type="button"
          onClick={() => setActive(-1)}
          className={`rounded-md border px-2.5 py-[5px] text-[11px] ${
            active === -1
              ? "border-[#7F77DD] bg-[#7F77DD] text-white"
              : "border-[#7F77DD] bg-[#f2f1fb] text-[#4a45a0]"
          }`}
        >
          🧩 Hybrid / Benchmark
        </button>
      </div>

      {active === -1 ? (
        <HybridEditor model={model} />
      ) : current ? (
        <VariantForm
          v={current}
          onPatch={(patch) => updateVariant(current.id, patch)}
        />
      ) : null}
    </div>
  );
}
