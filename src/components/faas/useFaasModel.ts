"use client";

import { useCallback, useMemo, useState } from "react";

import { calcVariant, scoreVariants } from "@/lib/faas/engine";
import {
  buildHybridSynthetic,
  buildModularHybrid,
} from "@/lib/faas/hybrid";
import {
  defVariant,
  defaultSettings,
  initialRisiken,
  initialTermine,
  initialVariants,
} from "@/lib/faas/defaults";
import type {
  RisikoEntry,
  RunResult,
  Settings,
  TerminEntry,
  Variant,
} from "@/lib/faas/types";

const rank: Record<string, number> = {
  go: 3,
  conditional: 2,
  nogo: 1,
  benchmark: 0,
};

export interface FaasModel {
  settings: Settings;
  setSettings: (s: Settings | ((p: Settings) => Settings)) => void;
  variants: Variant[];
  setVariants: (v: Variant[] | ((p: Variant[]) => Variant[])) => void;
  updateVariant: (id: number, patch: Partial<Variant>) => void;
  addVariant: () => void;
  deleteVariant: (id: number) => void;
  hybrid: Variant | null;
  setHybrid: (h: Variant | null | ((p: Variant | null) => Variant | null)) => void;
  ensureHybrid: () => Variant;
  generateBenchmark: () => void;
  removeHybrid: () => void;
  termine: TerminEntry[];
  setTermine: (t: TerminEntry[] | ((p: TerminEntry[]) => TerminEntry[])) => void;
  risiken: RisikoEntry[];
  setRisiken: (r: RisikoEntry[] | ((p: RisikoEntry[]) => RisikoEntry[])) => void;
  results: RunResult[];
  baseResults: RunResult[];
  benchResults: RunResult[];
  icBest: RunResult | null;
}

export function newHybrid(id = 9999): Variant {
  return defVariant({
    id,
    name: "Hybrid-Vorschlag (modular)",
    isHybrid: true,
    hybridMode: "modular",
    allocation: {},
    halt: 7,
    saleMonths: 6,
    acqPct: 0,
    c100: 0,
    mietFl: 0,
    foerderZuschuss: 0,
    foerderDarlehen: 0,
    bgfZusatz: 0,
  });
}

export function useFaasModel(): FaasModel {
  const [settings, setSettings] = useState<Settings>(() => defaultSettings());
  const [variants, setVariants] = useState<Variant[]>(() => initialVariants());
  const [nextId, setNextId] = useState(4);
  const [hybrid, setHybrid] = useState<Variant | null>(null);
  const [hybridCache, setHybridCache] = useState<Variant | null>(null);
  const [termine, setTermine] = useState<TerminEntry[]>(() => initialTermine());
  const [risiken, setRisiken] = useState<RisikoEntry[]>(() => initialRisiken());

  const updateVariant = useCallback((id: number, patch: Partial<Variant>) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    );
  }, []);

  const addVariant = useCallback(() => {
    setVariants((prev) => {
      const bases = prev.filter((v) => !v.isHybrid);
      if (bases.length >= 6) return prev;
      return [
        ...prev,
        defVariant({ id: nextId, name: "Variante " + (bases.length + 1) }),
      ];
    });
    setNextId((n) => n + 1);
  }, [nextId]);

  const deleteVariant = useCallback((id: number) => {
    setVariants((prev) => {
      const bases = prev.filter((v) => !v.isHybrid);
      if (bases.length <= 1) return prev;
      return prev.filter((v) => v.id !== id);
    });
    setHybrid((h) => {
      if (!h) return h;
      const alloc = { ...h.allocation };
      delete alloc[id];
      return { ...h, allocation: alloc };
    });
  }, []);

  const ensureHybrid = useCallback((): Variant => {
    if (hybrid) return hybrid;
    const h = newHybrid();
    setHybrid(h);
    return h;
  }, [hybrid]);

  const generateBenchmark = useCallback(() => {
    const h = hybrid ?? newHybrid();
    const modular: Variant = { ...h, hybridMode: "modular", name: "Benchmark / Stretch-Ziel" };
    const built = buildModularHybrid(variants, modular, settings);
    setHybrid(modular);
    setHybridCache(built);
  }, [hybrid, variants, settings]);

  const removeHybrid = useCallback(() => {
    setHybrid(null);
    setHybridCache(null);
  }, []);

  const { results, baseResults, benchResults, icBest } = useMemo(() => {
    const synth = buildHybridSynthetic(hybrid, variants, hybridCache, settings);
    const models: Variant[] = [
      ...variants.filter((v) => !v.isHybrid),
      ...(synth ? [synth] : []),
    ];
    const res = scoreVariants(
      models.map((m) => calcVariant(m, settings)),
      settings,
    );
    const base = res.filter((r) => !r.v.isHybrid);
    const bench = res.filter((r) => r.v.isHybrid);
    const pool = base.length ? base : res;
    const best =
      pool.reduce<RunResult | null>((a, b) => {
        if (!a) return b;
        const ra = rank[a.gate?.status ?? "nogo"] ?? 0;
        const rb = rank[b.gate?.status ?? "nogo"] ?? 0;
        return rb > ra || (rb === ra && (b.score ?? 0) > (a.score ?? 0))
          ? b
          : a;
      }, null) ?? null;
    return {
      results: res,
      baseResults: base,
      benchResults: bench,
      icBest: best,
    };
  }, [variants, hybrid, hybridCache, settings]);

  return {
    settings,
    setSettings,
    variants,
    setVariants,
    updateVariant,
    addVariant,
    deleteVariant,
    hybrid,
    setHybrid,
    ensureHybrid,
    generateBenchmark,
    removeHybrid,
    termine,
    setTermine,
    risiken,
    setRisiken,
    results,
    baseResults,
    benchResults,
    icBest,
  };
}
