"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import type { TerminEntry } from "@/lib/faas/types";

import type { FaasModel } from "./useFaasModel";
import { Card } from "./ui";

const PHASE_COLORS: Record<string, string> = {
  Vorbereitung: "#7F77DD",
  Planung: "#378ADD",
  Genehmigung: "#EF9F27",
  Vergabe: "#2aaa8a",
  Bau: "#1D9E75",
  Abschluss: "#E24B4A",
  Sonstige: "#aaa",
};
const PHASES = [
  "Vorbereitung",
  "Planung",
  "Genehmigung",
  "Vergabe",
  "Bau",
  "Abschluss",
  "Sonstige",
];
const ST_OPTS: [string, string][] = [
  ["done", "Abgeschlossen"],
  ["active", "Aktiv"],
  ["delayed", "Verzug"],
  ["planned", "Geplant"],
];
const MN = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function useClientNow(): number | null {
  const store = useMemo(
    () => ({
      subscribe: () => () => {},
      getSnapshot: () => Date.now(),
      getServerSnapshot: () => null as number | null,
    }),
    [],
  );
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}

function Gantt({ data }: { data: TerminEntry[] }) {
  const now = useClientNow();

  const svg = useMemo(() => {
    if (!data.length) return null;
    const allD = data.flatMap((t) => [t.ps, t.pe, t.fe]);
    const t0 = new Date(allD.reduce((a, b) => (a < b ? a : b)));
    const t1 = new Date(allD.reduce((a, b) => (a > b ? a : b)));
    t0.setDate(1);
    t1.setMonth(t1.getMonth() + 2);
    t1.setDate(1);
    const span = (+t1 - +t0) / 864e5;
    const months: Date[] = [];
    const cur = new Date(t0);
    while (cur < t1) {
      months.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
    const colW = Math.max(20, Math.min(36, Math.floor(640 / months.length)));
    const lW = 190;
    const rH = 30;
    const hH = 38;
    const pV = 5;
    const phs = [...new Set(data.map((t) => t.phase || "Sonstige"))];
    type GRow = { type: "phase"; label: string; color: string } | { type: "task"; t: TerminEntry };
    const rows: GRow[] = [];
    phs.forEach((ph) => {
      rows.push({ type: "phase", label: ph, color: PHASE_COLORS[ph] || "#aaa" });
      data.forEach((t) => {
        if ((t.phase || "Sonstige") === ph) rows.push({ type: "task", t });
      });
    });
    const sW = lW + colW * months.length;
    const sH = hH + rows.length * rH + 8;
    const px = (s: string) =>
      lW + (((+new Date(s) - +t0) / 864e5 / span) * (colW * months.length));
    const todayX =
      now == null
        ? -1
        : lW + (((now - +t0) / 864e5 / span) * (colW * months.length));

    const parts: string[] = [];
    months.forEach((mo, i) => {
      const x = lW + i * colW;
      parts.push(
        `<rect x="${x}" y="16" width="${colW}" height="${hH - 16}" fill="${
          i % 2 === 0 ? "rgba(0,0,0,.02)" : "transparent"
        }"/>`,
      );
      if (colW >= 24)
        parts.push(
          `<text x="${x + colW / 2}" y="${hH - 6}" text-anchor="middle" font-size="9" fill="#999">${
            MN[mo.getMonth()]
          }</text>`,
        );
      parts.push(
        `<line x1="${x}" y1="16" x2="${x}" y2="${sH}" stroke="#e8e8e8" stroke-width="0.5"/>`,
      );
    });
    parts.push(
      `<line x1="${lW}" y1="0" x2="${lW}" y2="${sH}" stroke="#ccc" stroke-width="0.5"/><line x1="0" y1="${hH}" x2="${sW}" y2="${hH}" stroke="#ccc" stroke-width="0.5"/>`,
    );
    let ti = 0;
    rows.forEach((row, ri) => {
      const y = hH + ri * rH;
      if (row.type === "phase") {
        parts.push(
          `<rect x="0" y="${y}" width="${sW}" height="${rH}" fill="${row.color}18"/><text x="8" y="${
            y + rH / 2 + 4
          }" font-size="10" font-weight="700" fill="${row.color}">▸ ${row.label}</text>`,
        );
      } else {
        const t = row.t;
        const fc = t.st === "done" ? "#1D9E75" : t.st === "delayed" ? "#EF9F27" : "#378ADD";
        parts.push(
          `<rect x="0" y="${y}" width="${sW}" height="${rH}" fill="${
            ti % 2 === 0 ? "rgba(0,0,0,.012)" : "transparent"
          }"/>`,
        );
        const lbl = t.label.length > 24 ? t.label.slice(0, 23) + "…" : t.label;
        parts.push(
          `<text x="${lW - 7}" y="${y + rH / 2 + 4}" text-anchor="end" font-size="10.5" fill="#333">${lbl}</text>`,
        );
        const px1 = px(t.ps);
        const pw = Math.max(px(t.pe) - px1, 3);
        parts.push(
          `<rect x="${px1}" y="${y + pV + 3}" width="${pw}" height="${
            rH - pV * 2 - 5
          }" rx="3" fill="#d8d8d4" opacity="0.7"/>`,
        );
        const fx1 = px(t.ps);
        const fw = Math.max(px(t.fe) - fx1, 3);
        const by = y + pV + (rH - pV * 2) / 2 + 2;
        parts.push(
          `<rect x="${fx1}" y="${by - 5}" width="${fw}" height="10" rx="3" fill="${fc}"/>`,
        );
        ti++;
      }
    });
    if (todayX >= lW && todayX <= sW) {
      parts.push(
        `<line x1="${todayX}" y1="${hH}" x2="${todayX}" y2="${sH}" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="4,3"/><text x="${
          todayX + 3
        }" y="${hH + 11}" font-size="9" fill="#E24B4A">Heute</text>`,
      );
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${sW}" height="${sH}" style="min-width:${sW}px;font-family:system-ui,sans-serif">${parts.join(
      "",
    )}</svg>`;
  }, [data, now]);

  if (!svg) return null;
  return (
    <div
      className="overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function Schedule({ model }: { model: FaasModel }) {
  const { termine, setTermine } = model;
  const [newPhase, setNewPhase] = useState("Vorbereitung");

  const upd = (i: number, patch: Partial<TerminEntry>) =>
    setTermine((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const uniq = [...new Set(termine.map((t) => t.phase || "Sonstige"))];

  return (
    <div>
      <Card
        title={
          <>
            Projektterminplan{" "}
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
                <th className="min-w-[165px] border-b border-[#e0e0e0] p-1.5">Vorgang</th>
                <th className="min-w-[105px] border-b border-[#e0e0e0] p-1.5">Phase</th>
                <th className="min-w-[95px] border-b border-[#e0e0e0] p-1.5">Plan von</th>
                <th className="min-w-[95px] border-b border-[#e0e0e0] p-1.5">Plan bis</th>
                <th className="min-w-[95px] border-b border-[#e0e0e0] p-1.5">Prognose bis</th>
                <th className="min-w-[105px] border-b border-[#e0e0e0] p-1.5">Status</th>
                <th className="w-8 border-b border-[#e0e0e0]" />
              </tr>
            </thead>
            <tbody>
              {uniq.map((ph) => {
                const c = PHASE_COLORS[ph] || "#aaa";
                return (
                  <RowsForPhase
                    key={ph}
                    ph={ph}
                    color={c}
                    termine={termine}
                    upd={upd}
                    remove={(i) =>
                      setTermine((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex flex-wrap justify-end gap-1.5">
          <select
            className="rounded border border-[#ccc] px-1.5 py-1 text-[11px]"
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
          >
            {PHASES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <button
            type="button"
            className="rounded border border-[#1D9E75] bg-[#f0faf6] px-2.5 py-1 text-[11px] text-[#0F6E56]"
            onClick={() =>
              setTermine((prev) => [
                ...prev,
                {
                  label: "Neuer Vorgang",
                  ps: "2027-01-01",
                  pe: "2027-03-31",
                  fe: "2027-03-31",
                  st: "planned",
                  phase: newPhase,
                },
              ])
            }
          >
            + Vorgang
          </button>
        </div>
      </Card>

      <Card title="Gantt-Diagramm">
        <Gantt data={termine} />
      </Card>
    </div>
  );
}

function RowsForPhase({
  ph,
  color,
  termine,
  upd,
  remove,
}: {
  ph: string;
  color: string;
  termine: TerminEntry[];
  upd: (i: number, patch: Partial<TerminEntry>) => void;
  remove: (i: number) => void;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={7}
          className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
          style={{ background: color + "18", color }}
        >
          {ph}
        </td>
      </tr>
      {termine.map((t, i) =>
        (t.phase || "Sonstige") !== ph ? null : (
          <tr key={i}>
            <td className="p-1">
              <input
                className="w-full min-w-[150px] rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                value={t.label}
                onChange={(e) => upd(i, { label: e.target.value })}
              />
            </td>
            <td className="p-1">
              <select
                className="w-full rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                value={t.phase || "Sonstige"}
                onChange={(e) => upd(i, { phase: e.target.value })}
              >
                {PHASES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </td>
            {(["ps", "pe", "fe"] as const).map((k) => (
              <td key={k} className="p-1">
                <input
                  type="date"
                  className="w-full rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                  value={t[k]}
                  onChange={(e) => upd(i, { [k]: e.target.value })}
                />
              </td>
            ))}
            <td className="p-1">
              <select
                className="w-full rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5 py-1 text-xs"
                value={t.st}
                onChange={(e) => upd(i, { st: e.target.value })}
              >
                {ST_OPTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </td>
            <td className="p-1">
              <button
                type="button"
                className="rounded border border-[#f5c0c0] bg-[#fff8f8] px-2 py-1 text-[11px] text-[#a32d2d]"
                onClick={() => remove(i)}
              >
                ✕
              </button>
            </td>
          </tr>
        ),
      )}
    </>
  );
}
