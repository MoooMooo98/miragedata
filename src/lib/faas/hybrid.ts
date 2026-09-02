// ─────────────────────────────────────────────────────────────────────────────
// Hybrid / Benchmark variant — two-stage optimiser.
// Stage 1: area allocation across the real uses (grid search, area-weighted blend).
// Stage 2: greedy value-module stacking (benchmarkScore objective).
// Ported from FaaS_Dashboard_v8.3.
// ─────────────────────────────────────────────────────────────────────────────

import { clamp, fmtPct, num } from "./format";
import { defVariant } from "./defaults";
import {
  benchmarkScore,
  getThresholds,
  incomeProfile,
  operatorKind,
  profileScore,
  runModel,
  variantArea,
  worksBase,
} from "./engine";
import type { HybridModuleView, Settings, Variant } from "./types";

export function baseVariants(variants: Variant[]): Variant[] {
  return variants.filter((v) => !v.isHybrid);
}

interface Density {
  area: number;
  worksD: number;
  revD: number;
  occ: number;
  nukD: number;
  capex: number;
  exitY: number;
  puf: number;
  dev: number;
  lease: number;
  prelet: number;
  sale: number;
  ti: number;
  rf: number;
  lf: number;
  acqPct: number;
  c100: number;
  crrem: number;
}

function densities(v: Variant, S: Settings): Density {
  const W = worksBase(v, {}, S);
  const IP = incomeProfile(v, {});
  const a = variantArea(v);
  return {
    area: a,
    worksD: W.total / a,
    revD: IP.potAnnual0 / a,
    occ: IP.stabOcc,
    nukD: num(v.nuk) / a,
    capex: num(v.capex),
    exitY: num(v.exitYield),
    puf: num(v.puf),
    dev: num(v.devMonths),
    lease: num(v.leaseMonths),
    prelet: num(v.prelet),
    sale: num(v.saleCosts),
    ti: num(v.ti),
    rf: num(v.rentFree),
    lf: num(v.leasingFee),
    acqPct: num(v.acqPct),
    c100: num(v.c100),
    crrem: num(v.crremYear),
  };
}

// Synthetisches Standardvarianten-Objekt aus Allokationsanteilen (shares in %)
export function synthByAlloc(
  hyb: Variant,
  alloc: Record<number, number>,
  variants: Variant[],
  S: Settings,
): Variant | null {
  const bs = baseVariants(variants);
  const picks: { v: Variant; s: number; d: Density }[] = [];
  bs.forEach((v) => {
    const s = (alloc[v.id] || 0) / 100;
    if (s > 0) picks.push({ v, s, d: densities(v, S) });
  });
  if (!picks.length) return null;
  const tot = picks.reduce((a, p) => a + p.s, 0);
  if (tot <= 0) return null;
  picks.forEach((p) => (p.s = p.s / tot));

  const areaH =
    num(hyb.mietFl) || picks.reduce((a, p) => a + p.s * p.d.area, 0);
  let worksH = 0,
    revH = 0,
    occH = 0,
    nukH = 0,
    capexH = 0,
    exitH = 0,
    pufH = 0,
    leaseH = 0,
    preH = 0,
    scH = 0,
    tiH = 0,
    rfH = 0,
    lfH = 0,
    devH = 0,
    crremH = 0;
  picks.forEach((p) => {
    const w = p.s;
    worksH += w * areaH * p.d.worksD;
    revH += w * areaH * p.d.revD;
    occH += w * p.d.occ;
    nukH += w * areaH * p.d.nukD;
    capexH += w * p.d.capex;
    exitH += w * p.d.exitY;
    pufH += w * p.d.puf;
    leaseH += w * p.d.lease;
    preH += w * p.d.prelet;
    scH += w * p.d.sale;
    tiH += w * p.d.ti;
    rfH += w * p.d.rf;
    lfH += w * p.d.lf;
    devH = Math.max(devH, p.d.dev);
    crremH += w * p.d.crrem;
  });
  const c100H =
    num(hyb.c100) || picks.reduce((a, p) => a + p.s * p.d.c100, 0);
  const acqH = num(hyb.acqPct) || picks[0].d.acqPct;

  const sv = defVariant({
    id: hyb.id,
    name: hyb.name,
    isHybrid: true,
    assetClass: "Mixed Use",
    projectType: "Mixed-Use-Konversion",
    strategy: "income",
    bgf: S.project.bgf + num(hyb.bgfZusatz),
    mietFl: areaH,
    flBestand: areaH,
    bgfZusatz: num(hyb.bgfZusatz),
    aufstockCostM2: 0,
    incomeMode: "standard",
    mZiel: areaH > 0 ? revH / areaH / 12 : 0,
    leer: clamp((1 - occH) * 100, 0, 90),
    vorsteuer: true,
    c100: c100H,
    acqPct: acqH,
    c200: 0,
    c300: worksH,
    c400: 0,
    c500: 0,
    c600: 0,
    c700: 0,
    puf: pufH,
    foerderZuschuss: num(hyb.foerderZuschuss),
    foerderDarlehen: num(hyb.foerderDarlehen),
    currentNOI: 0,
    retained: 0,
    nuk: nukH,
    capex: capexH,
    ti: tiH,
    rentFree: rfH,
    leasingFee: lfH,
    exitYield: exitH,
    saleCosts: scH,
    halt: num(hyb.halt) || 7,
    devMonths: Math.round(devH),
    leaseMonths: Math.round(leaseH),
    saleMonths: num(hyb.saleMonths) || 6,
    prelet: preH,
    risk: hyb.risk || "mittel",
    confidence: hyb.confidence || "niedrig",
    esg: hyb.esg || "partial",
    crremYear: Math.round(crremH) || 2045,
    riskNote:
      "Synthetische Nutzungs-Allokation über reale Basisvarianten-Ökonomien (flächengewichtet).",
    _allocText: picks
      .map((p) => p.v.assetClass + " " + Math.round(p.s * 100) + "%")
      .join(" · "),
  });
  sv._isAlloc = true;
  sv._modules = picks.map((p) => ({
    k: p.v.assetClass,
    v: Math.round(p.s * 100) + "% der Fläche",
    src: p.v.name.split("(")[0].trim(),
    area: Math.round(p.s * areaH),
  }));
  return sv;
}

function cloneVariant(v: Variant): Variant {
  return JSON.parse(JSON.stringify(v)) as Variant;
}

function adjRent(v: Variant, f: number): void {
  if (v.incomeMode === "segments" && v.segments)
    v.segments.forEach((s) => (s.rent = num(s.rent) * f));
  else if (v.incomeMode === "operator") {
    if (operatorKind(v.assetClass) === "hotel")
      v.hotelADR = num(v.hotelADR) * f;
    else v.carePachtUnitMonth = num(v.carePachtUnitMonth) * f;
  } else v.mZiel = num(v.mZiel) * f;
}

interface HybridModule {
  id: string;
  name: string;
  desc: string;
  applicable: (v: Variant) => boolean;
  apply: (v: Variant) => void;
}

// Wertmodule mit fachlich begründeten Standardeffekten.
export function hybridModules(S: Settings): HybridModule[] {
  return [
    {
      id: "energie",
      name: "Energetische Sanierung (GEG/BEG)",
      desc: "OpEx −12 %, Green Premium +3 % Miete, CRREM-konform bis 2050 (GEG 2024, BEG-Förderung, dena)",
      applicable: () => true,
      apply: (v) => {
        v.nuk = num(v.nuk) * 0.88;
        adjRent(v, 1.03);
        v.crremYear = 2050;
        v.c300 = num(v.c300) + 150 * variantArea(v);
        v.esg = "aligned";
      },
    },
    {
      id: "aufstockung",
      name: "Aufstockung / Dachausbau",
      desc: "Zusatzfläche bis GFZ-Reserve als Werthebel (BauGB §34 / LBO, ~2.800 €/m²)",
      applicable: (v) => {
        const grund = S.project.grund;
        const gfzZul = S.project.gfz;
        if (grund <= 0 || gfzZul <= 0) return false;
        const res = grund * gfzZul - (num(v.bgf) + num(v.bgfZusatz));
        return res > variantArea(v) * 0.03;
      },
      apply: (v) => {
        const grund = S.project.grund;
        const gfzZul = S.project.gfz;
        const res = Math.max(
          0,
          grund * gfzZul - (num(v.bgf) + num(v.bgfZusatz)),
        );
        const add = Math.min(res, variantArea(v) * 0.15);
        v.flBestand = num(v.flBestand) || variantArea(v);
        v.bgfZusatz = num(v.bgfZusatz) + add;
        if (v.incomeMode !== "operator" && v.incomeMode !== "segments")
          v.mietFl = num(v.mietFl) + add * 0.85;
        v.aufstockCostM2 = num(v.aufstockCostM2) || 2800;
      },
    },
    {
      id: "eg_handel",
      name: "EG-Umnutzung Einzelhandel/Gastro",
      desc: "EG-Zone zu Handelsmiete (gemittelt +6 % Mietaufschlag, Umbau +40 €/m²)",
      applicable: (v) => v.incomeMode !== "operator",
      apply: (v) => {
        adjRent(v, 1.06);
        v.c300 = num(v.c300) + 40 * variantArea(v);
      },
    },
    {
      id: "prelet",
      name: "Vorvermietung / Ankermieter",
      desc: "Vorvermietung +25 %-Pkt, Vermietungsanlauf −6 Mon., Ankerrabatt −2 % Miete",
      applicable: (v) =>
        v.strategy !== "sell" && incomeProfile(v, {}).usesLeasing,
      apply: (v) => {
        v.prelet = clamp(num(v.prelet) + 25, 0, 90);
        v.leaseMonths = Math.max(3, num(v.leaseMonths) - 6);
        adjRent(v, 0.98);
      },
    },
    {
      id: "phasing",
      name: "Phasing / Bauabschnitte",
      desc: "Teilinbetriebnahme senkt Peak Equity über früheren Ertrag (+3 Mon. Gesamtbauzeit)",
      applicable: (v) => num(v.currentNOI) > 0,
      apply: (v) => {
        v.retained = clamp(num(v.retained) + 15, 0, 60);
        v.devMonths = num(v.devMonths) + 3;
      },
    },
  ];
}

interface Contribution {
  id: string;
  name: string;
  desc: string;
  gain: number;
  r: ReturnType<typeof runModel>;
}

function greedyModules(
  baseVar: Variant,
  T: ReturnType<typeof getThresholds>,
  S: Settings,
): { variant: Variant; contributions: Contribution[]; score: number } {
  const mods = hybridModules(S);
  const active: string[] = [];
  const contributions: Contribution[] = [];
  let current = cloneVariant(baseVar);
  current.isHybrid = true;
  current.id = 9999;
  current.confidence = "niedrig";
  let curScore = benchmarkScore(runModel(current, {}, S), T, S);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 8) {
    improved = false;
    let bestMod: HybridModule | null = null;
    let bestGain = 1e-6;
    let bestVar: Variant | null = null;
    let bestR: ReturnType<typeof runModel> | null = null;
    for (const m of mods) {
      if (active.indexOf(m.id) > -1) continue;
      if (m.applicable && !m.applicable(current)) continue;
      const test = cloneVariant(current);
      try {
        m.apply(test);
      } catch {
        continue;
      }
      const tr = runModel(test, {}, S);
      const ts = benchmarkScore(tr, T, S);
      const gain = ts - curScore;
      if (gain > bestGain) {
        bestGain = gain;
        bestMod = m;
        bestVar = test;
        bestR = tr;
      }
    }
    if (bestMod && bestVar && bestR) {
      active.push(bestMod.id);
      contributions.push({
        id: bestMod.id,
        name: bestMod.name,
        desc: bestMod.desc,
        gain: bestGain,
        r: bestR,
      });
      current = bestVar;
      curScore += bestGain;
      improved = true;
    }
  }
  return { variant: current, contributions, score: curScore };
}

// Kandidaten-Allokationen über die realen Nutzungen
export function allocCandidates(bs: Variant[]): Record<number, number>[] {
  const ids = bs.map((v) => v.id);
  const n = ids.length;
  const cands: Record<number, number>[] = [];
  if (n === 1) {
    const a0: Record<number, number> = {};
    a0[ids[0]] = 100;
    return [a0];
  }
  if (n <= 3) {
    const rec = (i: number, rem: number, acc: Record<number, number>) => {
      if (i === n - 1) {
        acc[ids[i]] = rem;
        cands.push({ ...acc });
        return;
      }
      for (let s = 0; s <= rem; s += 25) {
        acc[ids[i]] = s;
        rec(i + 1, rem - s, acc);
      }
    };
    rec(0, 100, {});
  } else {
    bs.forEach((v) => {
      const a: Record<number, number> = {};
      a[v.id] = 100;
      cands.push(a);
    });
    const top = Math.min(4, n);
    for (let i = 0; i < top; i++)
      for (let j = i + 1; j < top; j++)
        for (let s = 25; s <= 75; s += 25) {
          const a: Record<number, number> = {};
          a[ids[i]] = s;
          a[ids[j]] = 100 - s;
          cands.push(a);
        }
  }
  return cands;
}

// Benchmark: automatische Flächenzusammensetzung × automatische Modulkombination
export function buildModularHybrid(
  variants: Variant[],
  hybridVar: Variant,
  S: Settings,
): Variant | null {
  let bs = baseVariants(variants).filter((v) => v.strategy === "income");
  if (!bs.length) bs = baseVariants(variants);
  if (!bs.length) return null;
  const T = getThresholds(S);
  const hybZeroed: Variant = {
    ...hybridVar,
    mietFl: 0,
    c100: 0,
    acqPct: 0,
  };
  // Referenz: beste Einzel-Basisvariante nach Anforderungsprofil
  const goScored = bs
    .map((v) => ({ v, ps: profileScore(runModel(v, {}, S), T, S) }))
    .sort((a, b) => b.ps - a.ps);
  const goBest = goScored[0];
  const edited = hybridVar.allocation || {};
  const editedSum = bs.reduce((a, v) => a + (edited[v.id] || 0), 0);
  const candidates =
    editedSum > 0.5 ? [edited] : allocCandidates(bs);
  let best: {
    alloc: Record<number, number>;
    allocBase: Variant;
    g: ReturnType<typeof greedyModules>;
  } | null = null;
  for (const alloc of candidates) {
    const allocBase = synthByAlloc(hybZeroed, alloc, variants, S);
    if (!allocBase) continue;
    const g = greedyModules(allocBase, T, S);
    if (!best || g.score > best.g.score) best = { alloc, allocBase, g };
  }
  if (!best) return cloneVariant(goBest.v);
  const picked = best;
  const current = picked.g.variant;
  const finalR = runModel(current, {}, S);
  current.name = "Benchmark / Stretch-Ziel";
  current.assetClass = "Mixed Use";
  current.projectType = "Mixed-Use-Konversion";
  current._modular = true;
  current._allocParts = ((picked.allocBase._modules ||
    []) as HybridModuleView[]).slice();
  current._activeModules = picked.g.contributions.map((c) => ({
    id: c.id,
    name: c.name,
    desc: c.desc,
    gain: c.gain,
  }));
  current._goBest = goBest.v.name;
  current._goScore = goBest.ps;
  current._baseScore = goBest.ps;
  current._hybScore = profileScore(finalR, T, S);
  current._econEff = S.evalMode === "bestand" ? finalR.vaPoc : finalR.poc;
  current._econIrr = finalR.levIRR;
  current._econEquity = finalR.peakEquity;
  current._modules = picked.g.contributions.map((c) => {
    const rr = c.r;
    return {
      k: c.name,
      v:
        S.evalMode === "bestand"
          ? "VA-PoC " +
            fmtPct(rr.vaPoc, 1) +
            " · IRR " +
            fmtPct(rr.levIRR, 1)
          : "PoC " + fmtPct(rr.poc, 1) + " · IRR " + fmtPct(rr.levIRR, 1),
      src: c.desc,
    };
  });
  current._allocText =
    (current._allocParts.length
      ? current._allocParts.map((p) => p.k + " " + p.v).join(" · ")
      : "") +
    (current._activeModules.length
      ? " + " +
        current._activeModules
          .map((c) => c.name.split("(")[0].trim())
          .join(" + ")
      : "");
  return current;
}

// Auto-Optimierung der Allokation (maximiert Levered IRR über 20%-Raster)
export function optimizeHybrid(
  hyb: Variant,
  variants: Variant[],
  S: Settings,
): Record<number, number> | null {
  let bs = baseVariants(variants).filter((v) => v.strategy === "income");
  if (bs.length < 1) return null;
  bs = bs
    .slice()
    .sort((a, b) => {
      const ra = runModel(a, {}, S);
      const rb = runModel(b, {}, S);
      return (rb.poc || -999) - (ra.poc || -999);
    })
    .slice(0, 4);
  const ids = bs.map((v) => v.id);
  let best: Record<number, number> | null = null;
  let bestIRR = -1e9;
  const evalAlloc = (acc: Record<number, number>) => {
    const a: Record<number, number> = { ...acc };
    const sv = synthByAlloc(hyb, a, variants, S);
    if (!sv) return;
    const r = runModel(sv, {}, S);
    if (isFinite(r.levIRR) && r.levIRR > bestIRR) {
      bestIRR = r.levIRR;
      best = { ...a };
    }
  };
  const rec = (i: number, rem: number, acc: Record<number, number>) => {
    if (i === ids.length - 1) {
      acc[ids[i]] = rem;
      evalAlloc(acc);
      return;
    }
    for (let s = 0; s <= rem; s += 20) {
      acc[ids[i]] = s;
      rec(i + 1, rem - s, acc);
    }
  };
  rec(0, 100, {});
  return best;
}

// Basisvarianten + (falls vorhanden) synthetisierte Hybridvariante
export function buildHybridSynthetic(
  hyb: Variant | null,
  variants: Variant[],
  hybridCache: Variant | null,
  S: Settings,
): Variant | null {
  if (!hyb) return null;
  if (hyb.hybridMode === "modular") {
    return hybridCache; // computed on demand via "Benchmark generieren"
  }
  let alloc = hyb.allocation || {};
  const any = Object.keys(alloc).some((k) => (alloc[Number(k)] || 0) > 0);
  if (!any) {
    const bs = baseVariants(variants);
    if (bs.length) {
      alloc = {};
      alloc[bs[0].id] = 100;
    }
  }
  return synthByAlloc(hyb, alloc, variants, S);
}
