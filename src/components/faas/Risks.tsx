"use client";

import type { RisikoEntry, RiskLevel } from "@/lib/faas/types";

import type { FaasModel } from "./useFaasModel";
import { Card } from "./ui";

const LEVELS: RiskLevel[] = ["hoch", "mittel", "niedrig"];

export default function Risks({ model }: { model: FaasModel }) {
  const { risiken, setRisiken } = model;
  const upd = (i: number, patch: Partial<RisikoEntry>) =>
    setRisiken((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <Card
      title={
        <>
          Risikoregister{" "}
          <span className="float-right text-[11px] font-normal text-[#1D9E75]">
            ✎ Editierbar
          </span>
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="text-left text-[11px] text-[#888]">
              <th className="min-w-[150px] border-b border-[#e0e0e0] p-1.5">Risikofeld</th>
              <th className="min-w-[90px] border-b border-[#e0e0e0] p-1.5">Kategorie</th>
              <th className="min-w-[70px] border-b border-[#e0e0e0] p-1.5">Eintr.W.%</th>
              <th className="min-w-[100px] border-b border-[#e0e0e0] p-1.5">Auswirkung</th>
              <th className="min-w-[85px] border-b border-[#e0e0e0] p-1.5">Level</th>
              <th className="w-8 border-b border-[#e0e0e0]" />
            </tr>
          </thead>
          <tbody>
            {risiken.map((r, i) => (
              <tr key={i}>
                <td className="p-1">
                  <input
                    className="w-full rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                    value={r.label}
                    onChange={(e) => upd(i, { label: e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <input
                    className="w-full rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                    value={r.kat}
                    onChange={(e) => upd(i, { kat: e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className="w-[55px] rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                    value={r.ew}
                    onChange={(e) => upd(i, { ew: +e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <input
                    className="w-full rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                    value={r.ausw}
                    onChange={(e) => upd(i, { ausw: e.target.value })}
                  />
                </td>
                <td className="p-1">
                  <select
                    className="w-full rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                    value={r.level}
                    onChange={(e) => upd(i, { level: e.target.value as RiskLevel })}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <button
                    type="button"
                    className="rounded border border-[#f5c0c0] bg-[#fff8f8] px-2 py-1 text-[11px] text-[#a32d2d]"
                    onClick={() =>
                      setRisiken((prev) => prev.filter((_, idx) => idx !== i))
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
            setRisiken((prev) => [
              ...prev,
              { label: "Neues Risiko", kat: "Sonstige", ew: 10, ausw: "–", level: "niedrig" },
            ])
          }
        >
          + Risiko
        </button>
      </div>
    </Card>
  );
}
