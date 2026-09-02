"use client";

import { DECISION_KPI_DEFS } from "@/lib/faas/defaults";
import type { Settings, Thresholds } from "@/lib/faas/types";

import type { FaasModel } from "./useFaasModel";
import EvalModeSwitch from "./EvalModeSwitch";
import { Callout, Card, GRID4, InfoBox, NumberField, TextField } from "./ui";

function KpiConfig({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
}) {
  const toggle = (key: string, on: boolean) => {
    let next = on
      ? [...settings.decisionKPIs, key]
      : settings.decisionKPIs.filter((k) => k !== key);
    if (!next.length) next = [key];
    setSettings({ ...settings, decisionKPIs: next });
  };
  const preset = (p: "muc" | "refurb" | "full") => {
    const next =
      p === "muc"
        ? ["levirr", "poc"]
        : p === "refurb"
          ? ["levirr", "poc", "dscr", "downside_buchwert"]
          : DECISION_KPI_DEFS.map((d) => d.key);
    setSettings({ ...settings, decisionKPIs: next });
  };
  return (
    <Card title="★ Entscheidungsrelevante Kennzahlen (GO / NO-GO)" accent="#0F6E56">
      <Callout kind="info">
        Das vollständige Kennzahlen-Set wird immer berechnet. Hier legen Sie fest,
        welche Kennzahlen die GO/CONDITIONAL/NO-GO-Entscheidung treiben. Alle
        übrigen bleiben informativ.
      </Callout>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {DECISION_KPI_DEFS.map((d) => {
          const on = settings.decisionKPIs.includes(d.key);
          return (
            <label
              key={d.key}
              className={`flex items-start gap-1.5 rounded-lg border px-2.5 py-2 ${
                on
                  ? "border-[#1D9E75] bg-[#f0faf6]"
                  : "border-[#e0e0e0] bg-[#fafafa]"
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={on}
                onChange={(e) => toggle(d.key, e.target.checked)}
              />
              <span>
                <span className="block text-[11.5px] font-semibold text-[#1a3557]">
                  {d.lab}
                </span>
                <span className="block text-[10px] leading-[1.35] text-[#888]">
                  {d.sub}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-[#888]">Schnellauswahl:</span>
        {(
          [
            ["muc", "München-Fokus (IRR + PoC)"],
            ["refurb", "Refurbishment-Standard (4 KPI)"],
            ["full", "Vollständig (alle Gates)"],
          ] as const
        ).map(([p, lab]) => (
          <button
            key={p}
            type="button"
            className="rounded border border-[#e0e0e0] bg-[#f5f5f3] px-2.5 py-1 text-[11px] text-[#555]"
            onClick={() => preset(p)}
          >
            {lab}
          </button>
        ))}
        <span className="ml-auto text-[11px] font-semibold text-[#0F6E56]">
          {settings.decisionKPIs.length} von {DECISION_KPI_DEFS.length}{" "}
          entscheidungsrelevant
        </span>
      </div>
    </Card>
  );
}

export default function Assumptions({ model }: { model: FaasModel }) {
  const { settings, setSettings } = model;
  const s = settings;
  const setFin = (patch: Partial<Settings["fin"]>) =>
    setSettings({ ...s, fin: { ...s.fin, ...patch } });
  const setTh = (patch: Partial<Thresholds>) =>
    setSettings({ ...s, thresholds: { ...s.thresholds, ...patch } });
  const setDown = (patch: Partial<Settings["downside"]>) =>
    setSettings({ ...s, downside: { ...s.downside, ...patch } });
  const setW = (patch: Partial<Settings["weights"]>) =>
    setSettings({ ...s, weights: { ...s.weights, ...patch } });
  const setProj = (patch: Partial<Settings["project"]>) =>
    setSettings({ ...s, project: { ...s.project, ...patch } });

  const wSum =
    s.weights.irr +
    s.weights.margin +
    s.weights.fin +
    s.weights.down +
    s.weights.lease +
    s.weights.risk;

  return (
    <div>
      <Card title="⚖ Bewertungsmodus" accent="#1a3557">
        <Callout kind="info">
          Ein Klick stellt alle IC-Schwellen und die Gate-Logik marktkonform um:{" "}
          <strong>Bauen im Bestand</strong> oder <strong>New Development</strong>.
        </Callout>
        <EvalModeSwitch settings={s} onChange={setSettings} />
      </Card>

      <KpiConfig settings={s} setSettings={setSettings} />

      <Card title="Projekteckdaten">
        <div className={GRID4}>
          <TextField label="Projektname" value={s.project.name} onChange={(name) => setProj({ name })} />
          <TextField label="Standort" value={s.project.ort} onChange={(ort) => setProj({ ort })} />
          <TextField label="Adresse" value={s.project.adresse} onChange={(adresse) => setProj({ adresse })} />
          <TextField label="Bewertungsstichtag" value={s.project.date} onChange={(date) => setProj({ date })} />
          <NumberField label="Bestands-BGF (m²)" value={s.project.bgf} step={100} onChange={(bgf) => setProj({ bgf })} />
          <NumberField label="Grundstücksfläche (m²)" value={s.project.grund} step={100} onChange={(grund) => setProj({ grund })} />
          <NumberField label="Zulässige GFZ" value={s.project.gfz} step={0.1} onChange={(gfz) => setProj({ gfz })} />
        </div>
      </Card>

      <InfoBox>
        Die folgenden Parameter steuern die Rechnung im Hintergrund.
        Standardwerte sind marktkonform (2026) und je Assetklasse anpassbar.
      </InfoBox>

      <Card title="Finanzierung & Marktdynamik">
        <div className={GRID4}>
          <NumberField label="Ziel-LTC / FK-Anteil (%)" value={s.fin.fkq} step={1} onChange={(fkq) => setFin({ fkq })} />
          <NumberField label="Zinssatz p.a. (%)" value={s.fin.zins} step={0.1} onChange={(zins) => setFin({ zins })} />
          <NumberField label="Tilgung n. Fertigstellung p.a. (%)" value={s.fin.amort} step={0.25} onChange={(amort) => setFin({ amort })} />
          <NumberField label="Arrangement Fee (%)" value={s.fin.fee} step={0.1} onChange={(fee) => setFin({ fee })} />
          <NumberField label="Mietsteigerung p.a. (%)" value={s.fin.mstg} step={0.25} onChange={(mstg) => setFin({ mstg })} />
          <NumberField label="Kostensteigerung p.a. (%)" value={s.fin.costg} step={0.25} onChange={(costg) => setFin({ costg })} />
          <NumberField label="Unlevered Diskontsatz (%)" value={s.fin.disc} step={0.25} onChange={(disc) => setFin({ disc })} />
          <NumberField label="Levered Hurdle Rate (%)" value={s.fin.eqdisc} step={0.25} onChange={(eqdisc) => setFin({ eqdisc })} />
        </div>
      </Card>

      <Card title="Förderung (Standardwerte, je Variante überschreibbar)">
        <div className={GRID4}>
          <NumberField label="Förderdarlehen-Zins p.a. (%)" hint="KfW/NRW.BANK-Kondition" value={s.fin.foZins} step={0.1} onChange={(foZins) => setFin({ foZins })} />
          <NumberField label="USt-Regelsatz (%)" hint="für steuerschädliche Nutzungen" value={s.fin.foUst} step={0.5} onChange={(foUst) => setFin({ foUst })} />
        </div>
      </Card>

      <Card title="Investment-Committee Mindestanforderungen">
        <div className={GRID4}>
          <NumberField label="Min. Levered IRR (%)" value={s.thresholds.minirr} step={0.5} onChange={(minirr) => setTh({ minirr })} />
          <NumberField label="Min. Unlevered IRR (%)" value={s.thresholds.minuirr} step={0.5} onChange={(minuirr) => setTh({ minuirr })} />
          <NumberField label="Min. Equity Multiple (x)" value={s.thresholds.minem} step={0.05} onChange={(minem) => setTh({ minem })} />
          <NumberField label="Min. Profit on Cost (%)" value={s.thresholds.minpoc} step={1} onChange={(minpoc) => setTh({ minpoc })} />
          <NumberField label="Min. Value-Add PoC (%)" value={s.thresholds.minvapoc} step={1} onChange={(minvapoc) => setTh({ minvapoc })} />
          <NumberField label="Min. DSCR (x)" value={s.thresholds.mindscr} step={0.05} onChange={(mindscr) => setTh({ mindscr })} />
          <NumberField label="Max. LTC (%)" value={s.thresholds.maxltc} step={1} onChange={(maxltc) => setTh({ maxltc })} />
          <NumberField label="Min. Development Spread (%-Pkt.)" value={s.thresholds.minspread} step={0.25} onChange={(minspread) => setTh({ minspread })} />
          <NumberField label="Min. CapEx-Yield Bestand (%)" value={s.thresholds.mincapexyield} step={0.25} onChange={(mincapexyield) => setTh({ mincapexyield })} />
          <NumberField label="Max. Amortisation (Jahre)" value={s.thresholds.maxpay} step={1} onChange={(maxpay) => setTh({ maxpay })} />
          <NumberField label="Min. Downside IRR – Neubau (%)" value={s.thresholds.mindownirr} step={0.5} onChange={(mindownirr) => setTh({ mindownirr })} />
          <NumberField label="Aktueller Buchwert Immobilie (€)" value={s.thresholds.buchwert} step={100000} onChange={(buchwert) => setTh({ buchwert })} />
          <NumberField label="Max. stab. Leerstand (%)" value={s.thresholds.maxvac} step={1} onChange={(maxvac) => setTh({ maxvac })} />
          <NumberField label="Min. Belegung b. Fertigst. (%)" value={s.thresholds.minstartocc} step={5} onChange={(minstartocc) => setTh({ minstartocc })} />
          <NumberField label="Max. Vermietungsanlauf (Mon.)" value={s.thresholds.maxlease} step={1} onChange={(maxlease) => setTh({ maxlease })} />
        </div>
      </Card>

      <Card title="Standard-Downside (IC-Stresstest)">
        <div className={GRID4}>
          <NumberField label="Miete (%)" value={s.downside.rent} step={1} onChange={(rent) => setDown({ rent })} />
          <NumberField label="Baukosten (%)" value={s.downside.cost} step={1} onChange={(cost) => setDown({ cost })} />
          <NumberField label="Exit Yield (Bp.)" value={s.downside.yield} step={25} onChange={(yield_) => setDown({ yield: yield_ })} />
          <NumberField label="Verzögerung (Monate)" value={s.downside.delay} step={1} onChange={(delay) => setDown({ delay })} />
          <NumberField label="Zins (Bp.)" value={s.downside.rate} step={25} onChange={(rate) => setDown({ rate })} />
          <NumberField label="zusätzl. Leerstand (%-Pkt.)" value={s.downside.vac} step={1} onChange={(vac) => setDown({ vac })} />
        </div>
      </Card>

      <Card title={`Scoring-Gewichtung (Summe = 100% · aktuell ${wSum}%)`}>
        <div className={GRID4}>
          <NumberField label="Rendite (IRR) (%)" value={s.weights.irr} step={5} onChange={(irr) => setW({ irr })} />
          <NumberField label="Entwicklungsmarge (%)" value={s.weights.margin} step={5} onChange={(margin) => setW({ margin })} />
          <NumberField label="Finanzierbarkeit (%)" value={s.weights.fin} step={5} onChange={(fin) => setW({ fin })} />
          <NumberField label="Downside (%)" value={s.weights.down} step={5} onChange={(down) => setW({ down })} />
          <NumberField label="Vermietbarkeit (%)" value={s.weights.lease} step={5} onChange={(lease) => setW({ lease })} />
          <NumberField label="Risiko/ESG/Daten (%)" value={s.weights.risk} step={5} onChange={(risk) => setW({ risk })} />
        </div>
        {Math.abs(wSum - 100) > 0.001 && (
          <div className="mt-2 text-[11px] text-[#E24B4A]">
            ⚠ Summe muss 100% ergeben (aktuell: {wSum}%)
          </div>
        )}
      </Card>
    </div>
  );
}
