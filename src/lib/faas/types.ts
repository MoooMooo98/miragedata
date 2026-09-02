// Type definitions for the FaaS investment model.

export type IncomeMode = "standard" | "segments" | "operator";
export type OperatorModel = "pacht" | "unit";
export type Strategy = "income" | "sell";
export type Confidence = "niedrig" | "mittel" | "hoch";
export type RiskLevel = "niedrig" | "mittel" | "hoch";
export type Esg = "aligned" | "partial" | "none";
export type EvalMode = "bestand" | "development";
export type GateStatus = "go" | "conditional" | "nogo" | "benchmark";

export interface Segment {
  name: string;
  area: number;
  rent: number;
  leer: number;
  capexM2: number;
}

export interface Variant {
  id: number;
  name: string;
  assetClass: string;
  projectType: string;
  strategy: Strategy;
  bgf: number;
  mietFl: number;
  flBestand: number;
  bgfZusatz: number;
  aufstockCostM2: number;
  incomeMode: IncomeMode;
  mZiel: number;
  leer: number;
  segments: Segment[];
  operatorModel: OperatorModel;
  hotelRooms: number;
  hotelADR: number;
  hotelOcc: number;
  hotelPachtQuote: number;
  careUnits: number;
  carePachtUnitMonth: number;
  vorsteuer: boolean;
  ustPct: number;
  c100: number;
  acqPct: number;
  c200: number;
  c300: number;
  c400: number;
  c500: number;
  c600: number;
  c700: number;
  puf: number;
  foerderZuschuss: number;
  foerderDarlehen: number;
  currentNOI: number;
  retained: number;
  nuk: number;
  capex: number;
  ti: number;
  rentFree: number;
  leasingFee: number;
  exitYield: number;
  saleCosts: number;
  salesPrice: number;
  halt: number;
  devMonths: number;
  leaseMonths: number;
  saleMonths: number;
  prelet: number;
  risk: RiskLevel;
  riskNote: string;
  confidence: Confidence;
  esg: Esg;
  crremYear: number;
  energyTarget: number;
  isHybrid: boolean;
  allocation: Record<number, number>;
  hybridMode: string;
  // hybrid / benchmark meta (populated by the optimiser)
  _cachedVariant?: Variant | null;
  _isAlloc?: boolean;
  _modular?: boolean;
  _allocText?: string;
  _allocParts?: HybridModuleView[];
  _activeModules?: { id: string; name: string; desc: string; gain: number }[];
  _modules?: HybridModuleView[];
  _goBest?: string;
  _goScore?: number;
  _baseScore?: number;
  _hybScore?: number;
  _econEff?: number;
  _econIrr?: number;
  _econEquity?: number;
  _src?: Variant;
}

export interface HybridModuleView {
  k: string;
  v: string;
  src?: string;
  area?: number;
}

export interface ProjectMeta {
  name: string;
  ort: string;
  adresse: string;
  date: string;
  bgf: number;
  grund: number;
  gfz: number;
}

export interface FinanceSettings {
  fkq: number;
  zins: number;
  amort: number;
  fee: number;
  mstg: number;
  costg: number;
  disc: number;
  eqdisc: number;
  foZins: number;
  foUst: number;
}

export interface Thresholds {
  minirr: number;
  minuirr: number;
  minem: number;
  minpoc: number;
  minvapoc: number;
  mindscr: number;
  maxltc: number;
  minspread: number;
  maxpay: number;
  mindownirr: number;
  mincapexyield: number;
  buchwert: number;
  maxvac: number;
  minstartocc: number;
  maxlease: number;
}

export interface DownsideSettings {
  rent: number;
  cost: number;
  yield: number;
  delay: number;
  rate: number;
  vac: number;
}

export interface Weights {
  irr: number;
  margin: number;
  fin: number;
  down: number;
  lease: number;
  risk: number;
}

export interface Settings {
  project: ProjectMeta;
  fin: FinanceSettings;
  thresholds: Thresholds;
  downside: DownsideSettings;
  weights: Weights;
  evalMode: EvalMode;
  decisionKPIs: string[];
}

export interface Overrides {
  rentPct?: number;
  costPct?: number;
  rateBp?: number;
  vacancyPts?: number;
  exitYieldBp?: number;
  delayMonths?: number;
}

export interface IncomeProfile {
  area: number;
  potAnnual0: number;
  stabOcc: number;
  perM2Rent: number;
  usesLeasing: boolean;
  label: string;
}

export interface WorksBase {
  base: number;
  ust: number;
  total: number;
  aufstock: number;
  segCapex: number;
  flZusatz: number;
  flBestand: number;
}

export interface RunResult {
  v: Variant;
  projectCF: number[];
  equityCF: number[];
  tdc: number;
  gdv: number;
  ndv: number;
  devProfit: number;
  poc: number;
  vaPoc: number;
  capexNeu: number;
  pogdv: number;
  yoc: number;
  spread: number;
  exitYield: number;
  unlevIRR: number;
  levIRR: number;
  npv: number;
  eqNpv: number;
  em: number;
  peakDebt: number;
  peakEquity: number;
  ltc: number;
  dscr: number;
  payback: number | null;
  roiTotal: number;
  stabNOI: number;
  exitMonth: number;
  devMonths: number;
  stabMonth: number;
  financeToStab: number;
  nominalWorks: number;
  totalInterest: number;
  rate: number;
  facility: number;
  foerderLoan: number;
  grant: number;
  works: WorksBase;
  IP: IncomeProfile;
  area: number;
  riskScore: number;
  dataScore: number;
  esgScore: number;
  // added by calcVariant / scoreVariants
  downside?: RunResult;
  breakEvenRent?: number;
  leaseScore?: number;
  score?: number;
  gate?: GateReport;
}

export interface Gate {
  key: string;
  k: string;
  v: number | null;
  t: number;
  ok: boolean;
  unit: string;
  note?: string;
  lower?: boolean;
  dec2?: number;
  dec?: boolean;
}

export interface LeasingMetrics {
  stabilizedOcc: number;
  startOcc: number;
  leaseMonths: number;
  usesLeasing: boolean;
}

export interface GfzInfo {
  grund: number;
  gfzZul: number;
  bgfNach: number;
  gfzIst: number;
  ok: boolean;
  relevant: boolean;
}

export interface GateReport {
  gates: Gate[];
  fails: Gate[];
  decGates: Gate[];
  decFails: Gate[];
  status: GateStatus;
  leasing: LeasingMetrics;
  gfz: GfzInfo;
  isRefurb: boolean;
  bwOK: boolean;
  gdvStr: number;
}

export interface TerminEntry {
  label: string;
  ps: string;
  pe: string;
  fe: string;
  st: string;
  phase: string;
}

export interface RisikoEntry {
  label: string;
  kat: string;
  ew: number;
  ausw: string;
  level: RiskLevel;
}
