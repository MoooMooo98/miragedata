// ─────────────────────────────────────────────────────────────────────────────
// FaaS investment model — financial engine.
// Ported 1:1 from FaaS_Dashboard_v8.3 (vanilla JS) to typed, side-effect-free
// functions. DOM `gn('f-…')` reads are replaced by an explicit `Settings` object.
// ─────────────────────────────────────────────────────────────────────────────

import { clamp, fmtEUR, num } from "./format";
import type {
  Gate,
  GateReport,
  GfzInfo,
  IncomeProfile,
  LeasingMetrics,
  RunResult,
  Settings,
  Variant,
  WorksBase,
} from "./types";

// ── Asset classes & presets ──────────────────────────────────────────────────
export const ASSET_CLASSES = [
  "Büro",
  "Einzelhandel",
  "Wohnen",
  "Mikroapartments",
  "Studentisches Wohnen",
  "Logistik",
  "Light Industrial",
  "Hotel",
  "Senior Living",
  "Betreutes Wohnen",
  "Pflegeheim",
  "Rechenzentrum",
  "Mixed Use",
  "Sonstige",
];
// steuerschädlich: kein Vorsteuerabzug
export const VAT_EXEMPT = [
  "Wohnen",
  "Mikroapartments",
  "Studentisches Wohnen",
  "Senior Living",
  "Betreutes Wohnen",
  "Pflegeheim",
];
export const OPERATOR_HOTEL = ["Hotel"];
export const OPERATOR_CARE = ["Senior Living", "Betreutes Wohnen", "Pflegeheim"];

export function isVatExempt(cls: string): boolean {
  return VAT_EXEMPT.indexOf(cls) > -1;
}
export function operatorKind(cls: string): "hotel" | "care" | null {
  if (OPERATOR_HOTEL.indexOf(cls) > -1) return "hotel";
  if (OPERATOR_CARE.indexOf(cls) > -1) return "care";
  return null;
}

// Beim Wechsel der Assetklasse: USt-Behandlung & Ertragslogik marktkonform setzen.
export function applyAssetDefaults(v: Variant): void {
  v.vorsteuer = !isVatExempt(v.assetClass);
  const op = operatorKind(v.assetClass);
  v.incomeMode = op
    ? "operator"
    : v.incomeMode === "operator"
      ? "standard"
      : v.incomeMode;
}

function ustRegelsatz(S: Settings): number {
  return S.fin.foUst || 19;
}
function foerderZins(S: Settings): number {
  return S.fin.foZins / 100;
}

// ── Revenue / area / cost modules ────────────────────────────────────────────
export function variantArea(v: Variant): number {
  if (v.incomeMode === "segments" && v.segments && v.segments.length)
    return v.segments.reduce((a, s) => a + num(s.area), 0) || num(v.mietFl) || 1;
  if (v.incomeMode === "operator") return num(v.bgf) || num(v.mietFl) || 1;
  return num(v.mietFl) || 1;
}

// Ertragsprofil: potentielle Jahres-Nettokaltmiete/-pacht bei Vollbelegung + stabilisierte Belegung
export function incomeProfile(
  v: Variant,
  ov: { rentPct?: number; vacancyPts?: number } = {},
): IncomeProfile {
  const rentAdj = 1 + (ov.rentPct || 0) / 100;
  const area = variantArea(v);
  let potAnnual0 = 0;
  let stabOcc = 1;
  let perM2Rent = 0;
  let usesLeasing = true;
  let label = "";
  if (v.incomeMode === "operator") {
    usesLeasing = false;
    if (operatorKind(v.assetClass) === "hotel") {
      if (v.operatorModel === "pacht") {
        const roomRev =
          num(v.hotelRooms) *
          num(v.hotelADR) *
          clamp(num(v.hotelOcc) / 100, 0, 1) *
          365;
        potAnnual0 =
          roomRev * clamp(num(v.hotelPachtQuote) / 100, 0, 1) * rentAdj;
        label =
          "Umsatzpacht " +
          num(v.hotelPachtQuote) +
          "% auf " +
          fmtEUR(roomRev) +
          " Zimmerumsatz";
      } else {
        // ADR-Feld hier als €/Zimmer/Monat interpretiert
        potAnnual0 = num(v.hotelRooms) * num(v.hotelADR) * 12 * rentAdj;
        label =
          num(v.hotelRooms) + " Zimmer × " + fmtEUR(num(v.hotelADR)) + "/Monat";
      }
    } else {
      // care — Umsatzpacht wie €/Einheit rechnen identisch
      potAnnual0 = num(v.careUnits) * num(v.carePachtUnitMonth) * 12 * rentAdj;
      label =
        (v.operatorModel === "pacht" ? "Pacht " : "") +
        num(v.careUnits) +
        " Plätze × " +
        fmtEUR(num(v.carePachtUnitMonth)) +
        "/Monat";
    }
    // Bei Betreibermodellen ist die Auslastung bereits in der Pacht/Umsatzrechnung enthalten.
    stabOcc = 1 - clamp((num(v.leer) + (ov.vacancyPts || 0)) / 100, 0, 0.9);
    perM2Rent = area > 0 ? potAnnual0 / area / 12 : 0;
  } else if (v.incomeMode === "segments" && v.segments && v.segments.length) {
    let totA = 0;
    let wRent = 0;
    let wVac = 0;
    v.segments.forEach((s) => {
      const a = num(s.area);
      totA += a;
      wRent += a * num(s.rent);
      wVac += a * clamp(num(s.leer) / 100, 0, 0.95);
    });
    potAnnual0 = wRent * 12 * rentAdj;
    stabOcc =
      totA > 0
        ? clamp(1 - wVac / totA - (ov.vacancyPts || 0) / 100, 0.05, 1)
        : 1;
    perM2Rent = totA > 0 ? (wRent / totA) * rentAdj : 0;
    label = v.segments.length + " Flächensegmente (heterogener Bauzustand)";
  } else {
    potAnnual0 = num(v.mZiel) * rentAdj * area * 12;
    stabOcc = 1 - clamp((num(v.leer) + (ov.vacancyPts || 0)) / 100, 0, 0.95);
    perM2Rent = num(v.mZiel) * rentAdj;
    label = "Einheitliche Zielmiete";
  }
  return { area, potAnnual0, stabOcc, perM2Rent, usesLeasing, label };
}

// Baukosten (KGR 200–700) inkl. Segment-Capex, Aufstockung und ggf. nicht abziehbarer USt
export function worksBase(
  v: Variant,
  ov: { costPct?: number } = {},
  S: Settings,
): WorksBase {
  let seg = 0;
  if (v.incomeMode === "segments" && v.segments)
    seg = v.segments.reduce((a, s) => a + num(s.area) * num(s.capexM2), 0);
  const flB = num(v.flBestand) || variantArea(v);
  const flZ = Math.max(0, variantArea(v) - flB);
  const auf = flZ * num(v.aufstockCostM2);
  const base =
    (num(v.c200) +
      num(v.c300) +
      num(v.c400) +
      num(v.c500) +
      num(v.c600) +
      num(v.c700) +
      auf +
      seg) *
    (1 + (ov.costPct || 0) / 100);
  // steuerschädlich: USt ist echte Kostenposition
  const ust = v.vorsteuer ? 0 : (base * num(v.ustPct, ustRegelsatz(S))) / 100;
  return {
    base,
    ust,
    total: base + ust,
    aufstock: auf,
    segCapex: seg,
    flZusatz: flZ,
    flBestand: flB,
  };
}

export function gfzInfo(v: Variant, S: Settings): GfzInfo {
  const grund = S.project.grund;
  const gfzZul = S.project.gfz;
  const bgfBestand = S.project.bgf;
  const bgfNach = (num(v.bgf) || bgfBestand) + num(v.bgfZusatz);
  const gfzIst = grund > 0 ? bgfNach / grund : 0;
  const ok = gfzZul <= 0 || gfzIst <= gfzZul + 1e-9;
  const relevant =
    !!v.projectType &&
    /Aufstockung|Erweiterung|Verdicht|Redevelopment/i.test(v.projectType);
  return { grund, gfzZul, bgfNach, gfzIst, ok, relevant };
}

export function effInfo(v: Variant, S: Settings): number {
  const b = (num(v.bgf) || S.project.bgf) + num(v.bgfZusatz);
  return b > 0 ? (variantArea(v) / b) * 100 : 0;
}

export function crremInfo(
  v: Variant,
  r: RunResult | null,
  S: Settings,
): { exitY: number; strandingY: number; stranded: boolean } {
  const y = parseInt(String(S.project.date || "2026").slice(0, 4)) || 2026;
  const exitY = y + Math.round((r ? r.exitMonth : 0) / 12);
  return {
    exitY,
    strandingY: v.crremYear || 0,
    stranded: v.crremYear > 0 && v.crremYear < exitY,
  };
}

// ── Financial engine: monthly DCF ────────────────────────────────────────────
export function npvAnnual(cfs: number[], rate: number): number {
  if (rate <= -1) return NaN;
  return cfs.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t / 12), 0);
}

export function calcIRR(cfs: number[]): number {
  const hasNeg = cfs.some((x) => x < 0);
  const hasPos = cfs.some((x) => x > 0);
  if (!hasNeg || !hasPos) return NaN;
  const pts = [
    -0.999, -0.9, -0.75, -0.5, -0.25, 0, 0.03, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2,
    0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10,
  ];
  let a = pts[0];
  let fa = npvAnnual(cfs, a);
  let b: number | null = null;
  for (let i = 1; i < pts.length; i++) {
    const x = pts[i];
    const fx = npvAnnual(cfs, x);
    if (isFinite(fa) && isFinite(fx) && fa * fx <= 0) {
      b = x;
      break;
    }
    a = x;
    fa = fx;
  }
  if (b === null) return NaN;
  let hi: number = b;
  for (let k = 0; k < 120; k++) {
    const m = (a + hi) / 2;
    const fm = npvAnnual(cfs, m);
    if (Math.abs(fm) < 0.01 || Math.abs(hi - a) < 1e-9) return m * 100;
    if (fa * fm <= 0) {
      hi = m;
    } else {
      a = m;
      fa = fm;
    }
  }
  return ((a + hi) / 2) * 100;
}

export function sCurve(n: number): number[] {
  const w: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) / n;
    w.push(Math.max(0.0001, 6 * x * (1 - x)));
  }
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / s);
}

export function dataScore(v: Variant): number {
  return { hoch: 90, mittel: 65, niedrig: 35 }[v.confidence] || 50;
}
export function esgScore(v: Variant): number {
  return { aligned: 90, partial: 65, none: 30 }[v.esg] || 40;
}
export function riskScoreV(v: Variant): number {
  return { niedrig: 85, mittel: 55, hoch: 25 }[v.risk] || 50;
}

export function getThresholds(S: Settings) {
  const t = S.thresholds;
  return {
    minIrr: t.minirr,
    minUIrr: t.minuirr,
    minEm: t.minem,
    minPoc: t.minpoc,
    minVaPoc: t.minvapoc,
    minDscr: t.mindscr,
    maxLtc: t.maxltc,
    minSpread: t.minspread,
    maxPay: t.maxpay,
    minDownIrr: t.mindownirr,
    maxVac: t.maxvac,
    minStartOcc: t.minstartocc,
    maxLease: t.maxlease,
    minCapexYield: t.mincapexyield,
    buchwert: t.buchwert,
  };
}
export type EngineThresholds = ReturnType<typeof getThresholds>;

// Buchwert-Schutz-Gate (Ersatz für DS-IRR-Gate bei Refurbishment):
// GDV im Stressfall (Exit-Yield +75 Bp, Miete −10%) ≥ aktueller Buchwert
export function buchwertSchutzOK(r: RunResult, T: EngineThresholds): boolean {
  const v = r.v;
  const buchwert = T.buchwert || 0;
  if (buchwert <= 0) return true;
  const stressNOI = r.downside ? r.downside.stabNOI : r.stabNOI * 0.9;
  const stressYield = Math.max(0.005, (v.exitYield + 0.75) / 100);
  const gdvStress = stressNOI / stressYield;
  return gdvStress >= buchwert;
}
export function gdvStressValue(r: RunResult): number {
  const v = r.v;
  const stressNOI = r.downside ? r.downside.stabNOI : r.stabNOI * 0.9;
  const stressYield = Math.max(0.005, (v.exitYield + 0.75) / 100);
  return stressNOI / stressYield;
}

export const REFURB_TYPES = [
  "Refurbishment",
  "Refurbishment (kosmetisch)",
  "Refurbishment (energetisch)",
  "Modernisierung",
  "Instandsetzung",
];
export function isRefurbishment(v: Variant): boolean {
  return REFURB_TYPES.indexOf(v.projectType || "") > -1;
}
// Nur echter Neubau/Ersatzneubau/Redevelopment nutzt Development-Gates.
export const NEUBAU_TYPES = ["Teilabriss / Neubau", "Neubau", "Redevelopment"];
export function isBestand(v: Variant): boolean {
  return NEUBAU_TYPES.indexOf(v.projectType || "") < 0;
}
export function bestandGatesActive(v: Variant, S: Settings): boolean {
  return S.evalMode === "bestand" && isBestand(v);
}

// CapEx-Yield = stabNOI / reine Baukosten (KG300+400+500) – Gate für Refurbishment
export function capexYield(r: RunResult): number {
  const v = r.v;
  const bauK = num(v.c300) + num(v.c400) + num(v.c500);
  return bauK > 0 ? (r.stabNOI / bauK) * 100 : NaN;
}

// stabilisiertes NOI zu einem Betriebs-Zeitpunkt (Jahre nach Fertigstellung)
export function noiAt(
  v: Variant,
  ov: { rentPct?: number; vacancyPts?: number },
  opFrac: number,
  S: Settings,
): number {
  const IP = incomeProfile(v, ov);
  const g = S.fin.mstg / 100;
  const cg = S.fin.costg / 100;
  const gross =
    IP.potAnnual0 * Math.pow(1 + g, Math.max(0, opFrac)) * IP.stabOcc;
  const opex = num(v.nuk) * Math.pow(1 + cg, Math.max(0, opFrac));
  const capex = num(v.capex) * IP.area * Math.pow(1 + cg, Math.max(0, opFrac));
  return Math.max(0, gross - opex - capex);
}

export interface RunOverrides {
  rentPct?: number;
  costPct?: number;
  rateBp?: number;
  vacancyPts?: number;
  exitYieldBp?: number;
  delayMonths?: number;
}

export function runModel(
  v: Variant,
  ov: RunOverrides = {},
  S: Settings,
): RunResult {
  const fkqBase = clamp(S.fin.fkq / 100, 0, 0.95);
  const mrate = Math.max(0, S.fin.zins / 100 + (ov.rateBp || 0) / 10000);
  const amort = Math.max(0, S.fin.amort / 100);
  const rentGrowth = S.fin.mstg / 100;
  const costGrowth = S.fin.costg / 100;
  const disc = S.fin.disc / 100;
  const eqDisc = S.fin.eqdisc / 100;
  const IP = incomeProfile(v, ov);
  const area = IP.area;
  const dev = Math.max(
    1,
    Math.round((v.devMonths || 1) + (ov.delayMonths || 0)),
  );
  const lease = Math.max(0, Math.round(v.leaseMonths || 0));
  const hold = Math.max(0.5, v.halt || 5);
  const saleMonths = Math.max(1, Math.round(v.saleMonths || 1));
  const exitMonth =
    v.strategy === "sell" ? dev + saleMonths : dev + Math.round(hold * 12);
  const n = exitMonth + 1;
  const projectCF = new Array<number>(n).fill(0);
  const income = new Array<number>(n).fill(0);
  const devCostA = new Array<number>(n).fill(0);
  const opCost = new Array<number>(n).fill(0);

  // Ankauf (KGR 100 + Erwerbsnebenkosten) in Monat 0
  const acq = v.c100 * (1 + (v.acqPct || 0) / 100);
  devCostA[0] += acq;
  projectCF[0] -= acq;

  // Baukosten inkl. USt/Segment/Aufstockung, Förder-Zuschuss senkt Nettokosten
  const W = worksBase(v, ov, S);
  const baseWorks = W.total;
  const weights = sCurve(dev);
  let nominalWorks = 0;
  for (let m = 1; m <= dev; m++) {
    const escal = Math.pow(1 + costGrowth, m / 12);
    const c = baseWorks * weights[m - 1] * escal * (1 + (v.puf || 0) / 100);
    nominalWorks += c;
    devCostA[m] += c;
    projectCF[m] -= c;
    const ret =
      ((v.currentNOI || 0) * clamp((v.retained || 0) / 100, 0, 1)) / 12;
    income[m] += ret;
    projectCF[m] += ret;
  }
  const grant = Math.max(0, num(v.foerderZuschuss));
  if (grant > 0) {
    devCostA[dev] -= grant;
    projectCF[dev] += grant;
  }

  // Ertragsphase
  const pre = IP.usesLeasing
    ? clamp((v.prelet || 0) / 100, 0, IP.stabOcc)
    : 0;
  let prevOcc = 0;
  if (v.strategy === "income") {
    for (let t = dev + 1; t <= exitMonth; t++) {
      const om = t - dev;
      const occ =
        lease === 0
          ? IP.stabOcc
          : pre + (IP.stabOcc - pre) * Math.min(1, om / lease);
      const newOcc = Math.max(0, occ - prevOcc);
      prevOcc = occ;
      const gross =
        (IP.potAnnual0 * Math.pow(1 + rentGrowth, om / 12) * occ) / 12;
      const opex = (v.nuk / 12) * Math.pow(1 + costGrowth, t / 12);
      const cap =
        (((v.capex || 0) * area) / 12) * Math.pow(1 + costGrowth, t / 12);
      const leaseCost = IP.usesLeasing
        ? newOcc *
          area *
          ((v.ti || 0) +
            IP.perM2Rent * (v.rentFree || 0) +
            (IP.perM2Rent * 12 * (v.leasingFee || 0)) / 100)
        : 0;
      income[t] += gross;
      opCost[t] += opex + cap;
      devCostA[t] += leaseCost;
      projectCF[t] += gross - opex - cap - leaseCost;
    }
    const exitNOI = noiAt(v, ov, (exitMonth + 12 - dev) / 12, S);
    const exitYld = Math.max(
      0.005,
      (v.exitYield + (ov.exitYieldBp || 0) / 100) / 100,
    );
    const sale = exitNOI / exitYld;
    projectCF[exitMonth] += sale - (sale * (v.saleCosts || 0)) / 100;
  } else {
    const gdvSale = area * (v.salesPrice || 0) * (1 + (ov.rentPct || 0) / 100);
    const per = gdvSale / saleMonths;
    for (let sm = dev + 1; sm <= exitMonth; sm++) {
      projectCF[sm] += per - (per * (v.saleCosts || 0)) / 100;
    }
  }

  // Finanzierung: Marktdarlehen + Förderdarlehen (Mischzins), gezogen auf Bedarf
  const facility = fkqBase * (acq + nominalWorks);
  const foerderLoan = clamp(num(v.foerderDarlehen), 0, facility);
  const rate =
    facility > 0
      ? (foerderLoan * foerderZins(S) + (facility - foerderLoan) * mrate) /
        facility
      : mrate;
  const arrFee = (facility * S.fin.fee) / 100;
  const equityCF = new Array<number>(n).fill(0);
  let debtBal = 0;
  let peakDebt = 0;
  let cumEq = 0;
  let peakEquity = 0;
  let totalInterest = 0;
  let financeToStab = arrFee;
  const stabMonth = Math.min(exitMonth, dev + Math.max(lease, 1));
  const monthlyDebt: { closing: number }[] = [];
  equityCF[0] -= arrFee;
  cumEq += equityCF[0];
  peakEquity = Math.max(peakEquity, -cumEq);
  for (let q = 0; q < n; q++) {
    const opening = debtBal;
    const base = projectCF[q];
    let draw = 0;
    let interest = 0;
    let principal = 0;
    if (base < 0) {
      const need = -base;
      draw =
        (fkqBase * (need + (opening * rate) / 12)) /
        (1 - fkqBase * 0.5 * (rate / 12));
      interest = ((opening + 0.5 * draw) * rate) / 12;
    } else {
      interest = (opening * rate) / 12;
    }
    const isExit = q === exitMonth;
    if (isExit) {
      principal = opening + draw;
    } else if (q > dev && base > 0 && opening + draw > 0) {
      principal = Math.min(opening + draw, ((opening + draw) * amort) / 12);
    }
    debtBal = opening + draw - principal;
    equityCF[q] += base + draw - interest - principal;
    totalInterest += interest;
    if (q <= stabMonth) financeToStab += interest;
    peakDebt = Math.max(peakDebt, opening + draw);
    cumEq += equityCF[q];
    peakEquity = Math.max(peakEquity, -cumEq);
    monthlyDebt.push({ closing: debtBal });
  }

  const unlevIRR = calcIRR(projectCF);
  const levIRR = calcIRR(equityCF);
  const eqNpv = npvAnnual(equityCF, eqDisc);
  const npv = npvAnnual(projectCF, disc);
  const posEq = equityCF.filter((x) => x > 0).reduce((a, b) => a + b, 0);
  const negEq = -equityCF.filter((x) => x < 0).reduce((a, b) => a + b, 0);
  const em = negEq > 0 ? posEq / negEq : NaN;
  const stabNOI =
    v.strategy === "income" ? noiAt(v, ov, (stabMonth - dev) / 12, S) : 0;
  const gdv =
    v.strategy === "income"
      ? stabNOI /
        Math.max(0.005, (v.exitYield + (ov.exitYieldBp || 0) / 100) / 100)
      : area * (v.salesPrice || 0);
  const ndv = gdv * (1 - (v.saleCosts || 0) / 100);
  const devCosts = devCostA
    .slice(0, stabMonth + 1)
    .reduce((a, b) => a + b, 0);
  const tdc = devCosts + financeToStab;
  const devProfit = ndv - tdc;
  const poc = tdc > 0 ? (devProfit / tdc) * 100 : NaN;
  const pogdv = gdv > 0 ? (devProfit / gdv) * 100 : NaN;
  const yoc = tdc > 0 ? (stabNOI / tdc) * 100 : NaN;
  // Value-Add PoC: Marge auf tatsächlich eingesetztes Umbaukapital (ohne eingebrachten Bestandswert)
  const capexNeu = Math.max(1, tdc - num(v.c100));
  const vaPoc = (devProfit / capexNeu) * 100;
  const exitYieldPct = v.exitYield + (ov.exitYieldBp || 0) / 100;
  const spread = v.strategy === "income" ? yoc - exitYieldPct : NaN;
  const ltc = tdc > 0 ? (peakDebt / tdc) * 100 : NaN;
  const stabDebt = monthlyDebt[Math.min(stabMonth, monthlyDebt.length - 1)];
  const stabBal = stabDebt && stabDebt.closing > 0 ? stabDebt.closing : peakDebt;
  const dscr =
    stabBal * (rate + amort) > 0 ? stabNOI / (stabBal * (rate + amort)) : NaN;
  // Amortisation (Jahre bis kumulierter EK-Rückfluss >= 0, ab Monat 0)
  let payback: number | null = null;
  let cum = 0;
  for (let z = 0; z < equityCF.length; z++) {
    cum += equityCF[z];
    if (z > 0 && cum >= 0) {
      payback = z / 12;
      break;
    }
  }
  const roiTotal = negEq > 0 ? ((posEq - negEq) / negEq) * 100 : NaN;

  return {
    v,
    projectCF,
    equityCF,
    tdc,
    gdv,
    ndv,
    devProfit,
    poc,
    vaPoc,
    capexNeu,
    pogdv,
    yoc,
    spread,
    exitYield: exitYieldPct,
    unlevIRR,
    levIRR,
    npv,
    eqNpv,
    em,
    peakDebt,
    peakEquity,
    ltc,
    dscr,
    payback,
    roiTotal,
    stabNOI,
    exitMonth,
    devMonths: dev,
    stabMonth,
    financeToStab,
    nominalWorks,
    totalInterest,
    rate,
    facility,
    foerderLoan,
    grant,
    works: W,
    IP,
    area,
    riskScore: riskScoreV(v),
    dataScore: dataScore(v),
    esgScore: esgScore(v),
  };
}

// Downside + Break-even
export function solveBreakEvenRent(v: Variant, S: Settings): number {
  const T = getThresholds(S);
  let lo = 0.2;
  let hi = 2.5;
  const f = (x: number) =>
    (runModel(v, { rentPct: (x - 1) * 100 }, S).levIRR || -999) - T.minIrr;
  const fl = f(lo);
  const fh = f(hi);
  if (!isFinite(fl) || !isFinite(fh) || fl * fh > 0) return NaN;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (f(lo) * f(m) <= 0) hi = m;
    else lo = m;
  }
  return incomeProfile(v, {}).perM2Rent * ((lo + hi) / 2);
}

export function calcVariant(v: Variant, S: Settings): RunResult {
  const r = runModel(v, {}, S);
  const down = runModel(
    v,
    {
      rentPct: S.downside.rent,
      costPct: S.downside.cost,
      exitYieldBp: S.downside.yield,
      delayMonths: S.downside.delay,
      rateBp: S.downside.rate,
      vacancyPts: S.downside.vac,
    },
    S,
  );
  r.downside = down;
  r.breakEvenRent = solveBreakEvenRent(v, S);
  return r;
}

// ── Gates + scoring ─────────────────────────────────────────────────────────
export function leasingMetrics(v: Variant): LeasingMetrics {
  const IP = incomeProfile(v, {});
  const stabilizedOcc = clamp(IP.stabOcc * 100, 0, 100);
  const startOcc =
    (+v.leaseMonths || 0) <= 0
      ? stabilizedOcc
      : IP.usesLeasing
        ? clamp(+v.prelet || 0, 0, stabilizedOcc)
        : 0;
  return {
    stabilizedOcc,
    startOcc,
    leaseMonths: Math.max(0, +v.leaseMonths || 0),
    usesLeasing: IP.usesLeasing,
  };
}

export function scoreHigher(v: number, t: number, st?: number): number {
  if (!isFinite(v) || t <= 0) return 0;
  st = st || 1.35;
  return clamp(50 + (50 * (v - t)) / (t * (st - 1)), 0, 100);
}
export function scoreLower(v: number, t: number): number {
  if (!isFinite(v) || t <= 0) return 0;
  return clamp(50 + (50 * (t - v)) / (t * 0.35), 0, 100);
}

export function gateVariant(r: RunResult, S: Settings): GateReport {
  const T = getThresholds(S);
  const l = leasingMetrics(r.v);
  const isInc = r.v.strategy === "income";
  const gi = gfzInfo(r.v, S);
  const isRefurb = bestandGatesActive(r.v, S);
  const cxY = capexYield(r);
  const bwOK = buchwertSchutzOK(r, T);
  const gdvStr = gdvStressValue(r);
  const isDecisionKPI = (key: string) => S.decisionKPIs.indexOf(key) > -1;
  const downIRR = r.downside ? r.downside.levIRR : NaN;

  const g: Gate[] = [
    {
      key: "levirr",
      k: "Levered IRR",
      v: r.levIRR,
      t: T.minIrr,
      ok: r.levIRR >= T.minIrr,
      unit: "%",
      note: isRefurb
        ? "Bestand-Schwelle " +
          T.minIrr +
          "% (Opportunitätskosten EK, RICS/IPD)"
        : "",
    },
    {
      key: "unlevirr",
      k: "Unlevered IRR",
      v: r.unlevIRR,
      t: T.minUIrr,
      ok: r.unlevIRR >= T.minUIrr,
      unit: "%",
      note: isRefurb
        ? "Bestand-Schwelle " +
          T.minUIrr +
          "% (Exit-Yield + Illiquiditätsprämie)"
        : "",
    },
    {
      key: "em",
      k: "Equity Multiple",
      v: r.em,
      t: T.minEm,
      ok: r.em >= T.minEm,
      unit: "x",
    },
    isRefurb
      ? {
          key: "poc",
          k: "Value-Add PoC",
          v: r.vaPoc,
          t: T.minVaPoc,
          ok: r.vaPoc >= T.minVaPoc,
          unit: "%",
          note:
            "Profit / Umbaukapital (TDC − Bestandswert " +
            fmtMLocal(num(r.v.c100)) +
            ") ≥ " +
            T.minVaPoc +
            "% – Wertschöpfungsmarge auf neu eingesetztes Kapital (gif e.V. Value-Add)",
        }
      : {
          key: "poc",
          k: "Profit on Cost",
          v: r.poc,
          t: T.minPoc,
          ok: r.poc >= T.minPoc,
          unit: "%",
          note:
            "Marge auf Gesamtkosten inkl. Grundstück ≥ " +
            T.minPoc +
            "% (gif e.V. Projektentwicklung, RICS Red Book)",
        },
    {
      key: "dscr",
      k: "DSCR",
      v: r.dscr,
      t: T.minDscr,
      ok: r.dscr >= T.minDscr,
      unit: "x",
      note: isRefurb
        ? "Bestand-Schwelle " + T.minDscr + "x (Bestand-Refi-Standard)"
        : "",
    },
    {
      key: "ltc",
      k: "LTC",
      v: r.ltc,
      t: T.maxLtc,
      ok: r.ltc <= T.maxLtc,
      unit: "%",
      lower: true,
    },
    isRefurb
      ? {
          key: "capexyield_spread",
          k: "CapEx-Yield",
          v: cxY,
          t: T.minCapexYield,
          ok: !isInc || cxY >= T.minCapexYield,
          unit: "%",
          note:
            "stabNOI / (KG300+400+500) ≥ " +
            T.minCapexYield +
            "% – Refurb.-Rendite-Gate",
        }
      : {
          key: "capexyield_spread",
          k: "Development Spread",
          v: r.spread,
          t: T.minSpread,
          ok: !isInc || r.spread >= T.minSpread,
          unit: "%-Pkt.",
        },
    {
      key: "payback",
      k: "Amortisation",
      v: r.payback,
      t: T.maxPay,
      ok:
        r.payback !== null &&
        isFinite(r.payback) &&
        r.payback <= T.maxPay,
      unit: " J.",
      lower: true,
      dec2: 1,
      note: isRefurb
        ? "Bestand-Schwelle ≤" +
          T.maxPay +
          " J. (EK-Rückfluss innerhalb Halteperiode)"
        : "",
    },
    isRefurb
      ? {
          key: "downside_buchwert",
          k: "Buchwert-Schutz",
          v: gdvStr,
          t: T.buchwert,
          ok: !isInc || T.buchwert <= 0 || bwOK,
          unit: " €",
          dec2: 0,
          note:
            "GDV-Stress (−10% Miete, +75 Bp Yield) ≥ Buchwert " +
            Math.round(T.buchwert).toLocaleString("de") +
            " € – kein Kapitalverlust im Worst Case",
        }
      : {
          key: "downside_buchwert",
          k: "Downside IRR",
          v: downIRR,
          t: T.minDownIrr,
          ok: downIRR >= T.minDownIrr,
          unit: "%",
        },
    {
      key: "startocc",
      k: "Belegung b. Fertigst.",
      v: l.startOcc,
      t: T.minStartOcc,
      ok: !isInc || !l.usesLeasing || l.startOcc >= T.minStartOcc,
      unit: "%",
    },
    {
      key: "leasemonths",
      k: "Vermietungsanlauf",
      v: l.leaseMonths,
      t: T.maxLease,
      ok: !isInc || l.leaseMonths <= T.maxLease,
      unit: " Mon.",
      lower: true,
    },
  ];
  if (gi.relevant && gi.gfzZul > 0)
    g.push({
      key: "gfz",
      k: "GFZ-Ausnutzung",
      v: gi.gfzIst,
      t: gi.gfzZul,
      ok: gi.ok,
      unit: "",
      lower: true,
      dec2: 2,
    });

  g.forEach((x) => {
    x.dec = isDecisionKPI(x.key);
  });
  const fails = g.filter((x) => !x.ok);
  const decGates = g.filter((x) => x.dec);
  const decFails = decGates.filter((x) => !x.ok);
  // Fundamentale K.-o.-Kriterien (immer entscheidungswirksam)
  const severe =
    r.eqNpv < 0 ||
    r.devProfit < 0 ||
    r.dscr < 1 ||
    (isRefurb ? !bwOK && T.buchwert > 0 : downIRR < 0);
  let status: GateReport["status"];
  if (r.v.isHybrid) {
    status = "benchmark";
  } else if (severe || decFails.length >= 2) {
    status = "nogo";
  } else if (decFails.length === 1) {
    status = "conditional";
  } else {
    status = r.dataScore >= 40 ? "go" : "conditional";
  }
  return {
    gates: g,
    fails,
    decGates,
    decFails,
    status,
    leasing: l,
    gfz: gi,
    isRefurb,
    bwOK,
    gdvStr,
  };
}

function fmtMLocal(v: number): string {
  return isFinite(v) ? "€" + (v / 1e6).toFixed(2) + "M" : "–";
}

export function getWeights(S: Settings) {
  const w = S.weights;
  return {
    irr: w.irr / 100,
    margin: w.margin / 100,
    fin: w.fin / 100,
    down: w.down / 100,
    lease: w.lease / 100,
    risk: w.risk / 100,
  };
}

export function leasingScore(v: Variant, T: EngineThresholds): number {
  const l = leasingMetrics(v);
  if (!l.usesLeasing) return 90;
  return Math.round(
    scoreLower(100 - l.stabilizedOcc, T.maxVac) * 0.5 +
      scoreHigher(l.startOcc, T.minStartOcc, 1.75) * 0.3 +
      scoreLower(l.leaseMonths, T.maxLease) * 0.2,
  );
}

export function scoreVariants(
  results: RunResult[],
  S: Settings,
): RunResult[] {
  const W = getWeights(S);
  const T = getThresholds(S);
  results.forEach((r) => {
    const fin =
      (scoreHigher(r.dscr, T.minDscr) +
        scoreLower(r.ltc, T.maxLtc) +
        scoreHigher(
          r.payback !== null && isFinite(r.payback)
            ? (T.maxPay / Math.max(0.5, r.payback)) * T.maxPay
            : 0,
          T.maxPay,
        )) /
      3;
    const margin =
      (scoreHigher(r.poc, T.minPoc) + scoreHigher(r.em, T.minEm)) / 2;
    const risk = (r.riskScore + r.dataScore + r.esgScore) / 3;
    r.leaseScore = leasingScore(r.v, T);
    r.score = Math.round(
      scoreHigher(r.levIRR, T.minIrr) * W.irr +
        margin * W.margin +
        fin * W.fin +
        scoreHigher(r.downside ? r.downside.levIRR : NaN, T.minDownIrr) *
          W.down +
        r.leaseScore * W.lease +
        risk * W.risk,
    );
    r.gate = gateVariant(r, S);
  });
  return results;
}

// Anforderungsprofil-Score = mittlerer Erfüllungsgrad der ENTSCHEIDUNGSRELEVANTEN KPIs
export function profileScore(
  r: RunResult,
  T: EngineThresholds,
  S: Settings,
): number {
  let s = 0;
  let n = 0;
  S.decisionKPIs.forEach((key) => {
    let val: number | null | undefined;
    let thr: number | undefined;
    let higher = true;
    if (key === "levirr") {
      val = r.levIRR;
      thr = T.minIrr;
    } else if (key === "unlevirr") {
      val = r.unlevIRR;
      thr = T.minUIrr;
    } else if (key === "em") {
      val = r.em;
      thr = T.minEm;
    } else if (key === "poc") {
      if (S.evalMode === "bestand") {
        val = r.vaPoc;
        thr = T.minVaPoc;
      } else {
        val = r.poc;
        thr = T.minPoc;
      }
    } else if (key === "dscr") {
      val = r.dscr;
      thr = T.minDscr;
    } else if (key === "ltc") {
      val = r.ltc;
      thr = T.maxLtc;
      higher = false;
    } else if (key === "capexyield_spread") {
      if (S.evalMode === "bestand") {
        val = capexYield(r);
        thr = T.minCapexYield;
      } else {
        val = r.spread;
        thr = T.minSpread;
      }
    } else if (key === "payback") {
      val = r.payback;
      thr = T.maxPay;
      higher = false;
    } else if (key === "downside_buchwert") {
      if (S.evalMode === "bestand") {
        val = gdvStressValue(r);
        thr = T.buchwert;
      } else {
        val = r.downside ? r.downside.levIRR : NaN;
        thr = T.minDownIrr;
      }
    } else if (key === "startocc") {
      val = null;
      thr = T.minStartOcc;
    } else {
      return;
    }
    if (val == null || !isFinite(val) || !thr) return;
    const ratio = higher ? val / thr : thr / Math.max(0.1, Math.abs(val));
    s += clamp(ratio, -2, 4);
    n++;
  });
  return n > 0 ? s / n : 0;
}

export function benchmarkScore(
  r: RunResult,
  T: EngineThresholds,
  S: Settings,
): number {
  const ps = profileScore(r, T, S);
  const eff = S.evalMode === "bestand" ? r.vaPoc : r.poc;
  const thr = S.evalMode === "bestand" ? T.minVaPoc : T.minPoc;
  const effRatio =
    isFinite(eff) && thr > 0 ? clamp(eff / thr, -2, 4) : -1;
  const viable =
    r.devProfit > 0 && isFinite(r.dscr) && r.dscr >= 1 && isFinite(r.levIRR);
  return (viable ? 0 : -5) + ps + 0.5 * effRatio;
}
