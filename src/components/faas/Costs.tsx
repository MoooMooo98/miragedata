"use client";

import { useState } from "react";

import { gfzInfo } from "@/lib/faas/engine";
import { fmtM, fmtPct, fmtX, num } from "@/lib/faas/format";

import type { FaasModel } from "./useFaasModel";
import { BarRow, Card } from "./ui";

export default function Costs({ model }: { model: FaasModel }) {
  const { results, settings } = model;
  const [idx, setIdx] = useState(0);
  const r = results[Math.min(idx, results.length - 1)] ?? results[0];
  if (!r) return <Card>Keine Daten.</Card>;
  const v = r.v;
  const W = r.works;

  const items: [string, number, string][] = [
    ["KGR 100 / Bestandswert + NK", v.c100 * (1 + (v.acqPct || 0) / 100), "#378ADD"],
    [
      "KGR 200–700 (Bau)",
      num(v.c200) + num(v.c300) + num(v.c400) + num(v.c500) + num(v.c600) + num(v.c700),
      "#1D9E75",
    ],
    ["Aufstockung / Zusatzfläche", W.aufstock, "#2aaa8a"],
    ["Segment-Capex (heterogen)", W.segCapex, "#7F77DD"],
    ["nicht abziehbare USt", W.ust, "#EF9F27"],
    ["Nominalisierung + Risiko", Math.max(0, r.nominalWorks - W.total), "#E24B4A"],
    ["Finanzierung bis Stabilisierung", r.financeToStab, "#BA7517"],
  ];
  if (r.grant > 0) items.push(["abzgl. Förderzuschuss", -r.grant, "#0F6E56"]);
  const max = Math.max(...items.map((x) => Math.abs(x[1])));
  const gi = gfzInfo(v, settings);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Kostenstruktur (DIN 276) – gewählte Variante">
        <div className="mb-2.5">
          <label className="text-[11px] font-medium text-[#666]">Variante: </label>
          <select
            className="ml-2 rounded-md border border-[#ccc] px-2 py-1 text-xs"
            value={idx}
            onChange={(e) => setIdx(parseInt(e.target.value))}
          >
            {results.map((res, i) => (
              <option key={res.v.id} value={i}>
                {res.v.name}
              </option>
            ))}
          </select>
        </div>
        {items.map((it) => (
          <BarRow
            key={it[0]}
            label={it[0]}
            fmtValue={fmtM(it[1])}
            frac={Math.abs(it[1]) / max}
            color={it[2]}
          />
        ))}
        <div className="mt-3 border-t border-[#eee] pt-2.5 text-xs leading-[1.6] text-[#555]">
          <strong>TDC: {fmtM(r.tdc)}</strong> · je Mietfläche:{" "}
          <strong>
            €{Math.round(r.tdc / Math.max(1, r.area)).toLocaleString("de-DE")}/m²
          </strong>{" "}
          · BGF n. Maßnahme{" "}
          {Math.round(gi.bgfNach).toLocaleString("de-DE")} m² · GFZ{" "}
          {gi.gfzIst.toFixed(2)}/{gi.gfzZul > 0 ? gi.gfzZul.toFixed(2) : "–"}
          {!v.vorsteuer && (
            <>
              {" "}
              · <span className="text-[#854f0b]">
                steuerschädlich: {fmtM(W.ust)} USt nicht abziehbar
              </span>
            </>
          )}
        </div>
      </Card>

      <Card title="Kapitaleinsatz & Rendite">
        <div className="text-[13px] leading-[2]">
          Eigenkapital (Peak): <strong>{fmtM(r.peakEquity)}</strong>
          <br />
          Fremdkapital (Peak): <strong>{fmtM(r.peakDebt)}</strong> · Mischzins{" "}
          {fmtPct(r.rate * 100, 2)}
          {r.foerderLoan > 0 && <> (inkl. {fmtM(r.foerderLoan)} Förderdarlehen)</>}
          <br />
          Investmentvalue (GDV): <strong>{fmtM(r.gdv)}</strong> · Gewinn:{" "}
          <strong>{fmtM(r.devProfit)}</strong>
          <br />
          Profit on Cost: <strong>{fmtPct(r.poc, 1)}</strong> · Levered IRR:{" "}
          <strong>{fmtPct(r.levIRR, 1)}</strong> · Amortisation:{" "}
          <strong>
            {r.payback !== null && isFinite(r.payback)
              ? r.payback.toFixed(1) + " J."
              : "–"}
          </strong>
          <br />
          Equity Multiple: <strong>{fmtX(r.em, 2)}</strong> · DSCR:{" "}
          <strong>{fmtX(r.dscr, 2)}</strong>
        </div>
      </Card>
    </div>
  );
}
