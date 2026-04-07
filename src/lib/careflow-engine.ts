/**
 * CareFlow Hospital Simulation Engine — TypeScript port.
 */

// ---------- Seeded RNG (mulberry32) ----------
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalRandom(rng: () => number, mean: number, std: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

function betaRandom(rng: () => number, a: number, b: number): number {
  // Approximate beta via Gamma using Marsaglia's method (simplified)
  let x = 0, y = 0;
  for (let i = 0; i < a; i++) x -= Math.log(rng() + 1e-10);
  for (let i = 0; i < b; i++) y -= Math.log(rng() + 1e-10);
  return x / (x + y + 1e-10);
}

// ---------- Types ----------
export interface Patient {
  id: number;
  severity: number;
  waitTime: number;
  assignedBed: boolean;
  assignedIcu: boolean;
  discharged: boolean;
  dead: boolean;
}

export interface EnvConfig {
  maxSteps: number;
  totalBeds: number;
  totalIcu: number;
  totalStaff: number;
  initialPatients: number;
  arrivalRate: number;
  arrivalStd: number;
  severityIncreaseRate: number;
  staffFatigueRate: number;
  criticalThreshold: number;
  deathThreshold: number;
  maxDeaths: number;
  seed: number;
  emergencyProb: number;
  emergencyExtra: number;
  staffShortageStep: number | null;
  staffShortageAmount: number;
}

export interface EnvState {
  time: number;
  patients: {
    id: number;
    severity: number;
    waitTime: number;
    assignedBed: boolean;
    assignedIcu: boolean;
  }[];
  bedsAvailable: number;
  icuAvailable: number;
  staffAvailable: number;
  staffFatigue: number;
  incomingPatientRate: number;
  emergencyFlag: boolean;
  totalDeaths: number;
  totalTreated: number;
}

export interface StepResult {
  state: EnvState;
  reward: number;
  done: boolean;
  info: Record<string, string>;
}

export interface SnapshotData {
  time: number;
  deaths: number;
  treated: number;
  bedsUsed: number;
  icuUsed: number;
  staffAvailable: number;
  staffFatigue: number;
  waitingPatients: number;
  avgWaitTime: number;
  avgSeverity: number;
  totalPatients: number;
  reward: number;
  emergency: boolean;
}

// ---------- Presets ----------
export const EASY_CONFIG: EnvConfig = {
  maxSteps: 100, totalBeds: 30, totalIcu: 8, totalStaff: 20,
  initialPatients: 3, arrivalRate: 1.0, arrivalStd: 0.3,
  severityIncreaseRate: 0.015, staffFatigueRate: 0.003,
  criticalThreshold: 0.85, deathThreshold: 1.0, maxDeaths: 10,
  seed: 42, emergencyProb: 0, emergencyExtra: 0,
  staffShortageStep: null, staffShortageAmount: 0,
};

export const MEDIUM_CONFIG: EnvConfig = {
  maxSteps: 150, totalBeds: 25, totalIcu: 5, totalStaff: 18,
  initialPatients: 6, arrivalRate: 1.8, arrivalStd: 0.6,
  severityIncreaseRate: 0.025, staffFatigueRate: 0.006,
  criticalThreshold: 0.80, deathThreshold: 1.0, maxDeaths: 8,
  seed: 42, emergencyProb: 0.08, emergencyExtra: 4,
  staffShortageStep: null, staffShortageAmount: 0,
};

export const HARD_CONFIG: EnvConfig = {
  maxSteps: 200, totalBeds: 20, totalIcu: 4, totalStaff: 15,
  initialPatients: 8, arrivalRate: 2.2, arrivalStd: 1.0,
  severityIncreaseRate: 0.03, staffFatigueRate: 0.008,
  criticalThreshold: 0.75, deathThreshold: 1.0, maxDeaths: 6,
  seed: 42, emergencyProb: 0.15, emergencyExtra: 6,
  staffShortageStep: 60, staffShortageAmount: 5,
};

// ---------- Actions ----------
export const ACTION_ASSIGN_BED = 0;
export const ACTION_SEND_ICU = 1;
export const ACTION_DELAY = 2;
export const ACTION_DISCHARGE = 3;
export const ACTION_CALL_STAFF = 4;

// ---------- Environment ----------
export class CareFlowEnv {
  config: EnvConfig;
  private rng: () => number;
  private nextId = 0;
  patients: Patient[] = [];
  bedsUsed = 0;
  icuUsed = 0;
  staffAvailable: number;
  staffFatigue = 0;
  stepCount = 0;
  done = false;
  totalDeaths = 0;
  totalTreated = 0;
  totalCriticalTreated = 0;
  cumulativeWait = 0;
  cumulativePatients = 0;
  emergencyFlag = false;
  history: number[] = [];

  constructor(config: EnvConfig) {
    this.config = config;
    this.rng = mulberry32(config.seed);
    this.staffAvailable = config.totalStaff;
  }

  reset(): EnvState {
    this.rng = mulberry32(this.config.seed);
    this.nextId = 0;
    this.patients = [];
    this.bedsUsed = 0;
    this.icuUsed = 0;
    this.staffAvailable = this.config.totalStaff;
    this.staffFatigue = 0;
    this.stepCount = 0;
    this.done = false;
    this.totalDeaths = 0;
    this.totalTreated = 0;
    this.totalCriticalTreated = 0;
    this.cumulativeWait = 0;
    this.cumulativePatients = 0;
    this.emergencyFlag = false;
    this.history = [];
    for (let i = 0; i < this.config.initialPatients; i++) this.addPatient();
    return this.state();
  }

  state(): EnvState {
    const active = this.getActive();
    return {
      time: this.stepCount,
      patients: active.map(p => ({
        id: p.id, severity: +p.severity.toFixed(4),
        waitTime: p.waitTime, assignedBed: p.assignedBed, assignedIcu: p.assignedIcu,
      })),
      bedsAvailable: this.config.totalBeds - this.bedsUsed,
      icuAvailable: this.config.totalIcu - this.icuUsed,
      staffAvailable: this.staffAvailable,
      staffFatigue: +this.staffFatigue.toFixed(4),
      incomingPatientRate: this.config.arrivalRate,
      emergencyFlag: this.emergencyFlag,
      totalDeaths: this.totalDeaths,
      totalTreated: this.totalTreated,
    };
  }

  step(action: number, patientId?: number): StepResult {
    if (this.done) return { state: this.state(), reward: 0, done: true, info: { msg: "finished" } };
    let reward = this.executeAction(action, patientId);
    reward += this.tick();
    this.stepCount++;
    this.history.push(reward);
    const info: Record<string, string> = {};
    if (this.stepCount >= this.config.maxSteps) { this.done = true; info.reason = "time_limit"; }
    if (this.totalDeaths >= this.config.maxDeaths) { this.done = true; info.reason = "system_collapse"; reward -= 5; }
    return { state: this.state(), reward, done: this.done, info };
  }

  snapshot(): SnapshotData {
    const active = this.getActive();
    const waiting = active.filter(p => !p.assignedBed && !p.assignedIcu);
    return {
      time: this.stepCount,
      deaths: this.totalDeaths,
      treated: this.totalTreated,
      bedsUsed: this.bedsUsed,
      icuUsed: this.icuUsed,
      staffAvailable: this.staffAvailable,
      staffFatigue: +this.staffFatigue.toFixed(3),
      waitingPatients: waiting.length,
      avgWaitTime: waiting.length ? +(waiting.reduce((s, p) => s + p.waitTime, 0) / waiting.length).toFixed(1) : 0,
      avgSeverity: active.length ? +(active.reduce((s, p) => s + p.severity, 0) / active.length).toFixed(3) : 0,
      totalPatients: active.length,
      reward: this.history.length ? +this.history[this.history.length - 1].toFixed(3) : 0,
      emergency: this.emergencyFlag,
    };
  }

  private addPatient(severity?: number) {
    const sev = severity ?? Math.min(0.95, Math.max(0.05, betaRandom(this.rng, 2, 5)));
    this.patients.push({
      id: this.nextId++, severity: sev, waitTime: 0,
      assignedBed: false, assignedIcu: false, discharged: false, dead: false,
    });
    this.cumulativePatients++;
  }

  private getActive(): Patient[] {
    return this.patients.filter(p => !p.discharged && !p.dead);
  }

  private findPatient(pid: number): Patient | undefined {
    return this.patients.find(p => p.id === pid && !p.discharged && !p.dead);
  }

  private executeAction(action: number, patientId?: number): number {
    if (action === ACTION_CALL_STAFF) {
      if (this.staffAvailable < this.config.totalStaff) {
        this.staffAvailable = Math.min(this.staffAvailable + 2, this.config.totalStaff);
        this.staffFatigue = Math.max(this.staffFatigue - 0.05, 0);
        return 0.05;
      }
      return 0;
    }
    if (patientId == null) return -0.1;
    const p = this.findPatient(patientId);
    if (!p) return -0.1;

    if (action === ACTION_ASSIGN_BED) {
      if (p.assignedBed || p.assignedIcu) return -0.05;
      if (this.bedsUsed >= this.config.totalBeds) return -0.2;
      if (this.staffAvailable <= 0) return -0.15;
      p.assignedBed = true; this.bedsUsed++; this.staffAvailable--; this.staffFatigue += this.config.staffFatigueRate;
      return 0.1 + p.severity * 0.3;
    }
    if (action === ACTION_SEND_ICU) {
      if (p.assignedIcu) return -0.05;
      if (this.icuUsed >= this.config.totalIcu) return -0.3;
      if (this.staffAvailable <= 1) return -0.15;
      if (p.assignedBed) { p.assignedBed = false; this.bedsUsed--; }
      p.assignedIcu = true; this.icuUsed++; this.staffAvailable -= 2; this.staffFatigue += this.config.staffFatigueRate * 3;
      return 0.2 + p.severity * 0.5;
    }
    if (action === ACTION_DELAY) {
      return p.severity > this.config.criticalThreshold ? -0.4 : 0.02;
    }
    if (action === ACTION_DISCHARGE) {
      if (p.severity > 0.5 && !p.assignedBed && !p.assignedIcu) return -0.3;
      if (p.assignedBed) { this.bedsUsed--; this.staffAvailable = Math.min(this.staffAvailable + 1, this.config.totalStaff); }
      if (p.assignedIcu) { this.icuUsed--; this.staffAvailable = Math.min(this.staffAvailable + 2, this.config.totalStaff); }
      p.discharged = true; this.totalTreated++;
      if (p.severity >= this.config.criticalThreshold) this.totalCriticalTreated++;
      return 0.15;
    }
    return 0;
  }

  private tick(): number {
    let r = 0;
    let nNew = Math.max(0, Math.round(normalRandom(this.rng, this.config.arrivalRate, this.config.arrivalStd)));
    this.emergencyFlag = this.rng() < this.config.emergencyProb;
    if (this.emergencyFlag) nNew += this.config.emergencyExtra;
    for (let i = 0; i < nNew; i++) {
      let sev = Math.min(0.95, Math.max(0.05, betaRandom(this.rng, 2, 5)));
      if (this.emergencyFlag) sev = Math.min(0.99, Math.max(0.05, sev + 0.3));
      this.addPatient(sev);
    }
    if (this.config.staffShortageStep != null && this.stepCount === this.config.staffShortageStep) {
      this.staffAvailable = Math.max(1, this.staffAvailable - this.config.staffShortageAmount);
    }
    for (const p of this.getActive()) {
      if (!p.assignedBed && !p.assignedIcu) {
        p.waitTime++; p.severity = Math.min(p.severity + this.config.severityIncreaseRate, 1.0);
        this.cumulativeWait++;
      } else if (p.assignedBed) {
        p.severity = Math.max(p.severity - 0.03, 0);
      } else if (p.assignedIcu) {
        p.severity = Math.max(p.severity - 0.06, 0);
      }
      if (p.severity >= this.config.deathThreshold && !p.assignedIcu) {
        p.dead = true;
        if (p.assignedBed) { this.bedsUsed--; this.staffAvailable = Math.min(this.staffAvailable + 1, this.config.totalStaff); }
        this.totalDeaths++; r -= 2;
      }
    }
    const activeAfter = this.getActive();
    const waiting = activeAfter.filter(p => !p.assignedBed && !p.assignedIcu);
    for (const p of waiting) { if (p.severity > this.config.criticalThreshold) r -= 0.3; }
    if (waiting.length) { r -= 0.01 * (waiting.reduce((s, p) => s + p.waitTime, 0) / waiting.length); }
    const occ = (this.bedsUsed + this.icuUsed) / (this.config.totalBeds + this.config.totalIcu);
    if (occ > 0.9) r -= 0.2 * (occ - 0.9) * 10;
    if (this.staffFatigue > 0.5) r -= 0.1 * (this.staffFatigue - 0.5);
    if (activeAfter.length > 0) {
      r += 0.05 * (activeAfter.filter(p => p.assignedBed || p.assignedIcu).length / activeAfter.length);
    }
    return r;
  }
}

// ---------- Baseline Agent ----------
export function runBaselineStep(env: CareFlowEnv): StepResult {
  const s = env.state();
  const waiting = s.patients.filter(p => !p.assignedBed && !p.assignedIcu).sort((a, b) => b.severity - a.severity);
  
  for (const p of waiting) {
    if (p.severity >= env.config.criticalThreshold && s.icuAvailable > 0 && s.staffAvailable >= 2) {
      return env.step(ACTION_SEND_ICU, p.id);
    }
    if (s.bedsAvailable > 0 && s.staffAvailable >= 1) {
      return env.step(ACTION_ASSIGN_BED, p.id);
    }
  }

  const inCare = s.patients.filter(p => p.assignedBed || p.assignedIcu).sort((a, b) => a.severity - b.severity);
  for (const p of inCare) {
    if (p.severity < 0.15) return env.step(ACTION_DISCHARGE, p.id);
  }

  if (s.staffAvailable < 3) return env.step(ACTION_CALL_STAFF);
  if (waiting.length) return env.step(ACTION_DELAY, waiting[waiting.length - 1].id);
  return env.step(ACTION_CALL_STAFF);
}

// ---------- Grader ----------
export function grade(env: CareFlowEnv): number {
  const survival = Math.max(0, 1 - env.totalDeaths / Math.max(env.config.maxDeaths, 1));
  const treatment = env.totalTreated / Math.max(env.cumulativePatients, 1);
  const totalCritical = env.totalCriticalTreated + env.totalDeaths;
  const criticalScore = env.totalCriticalTreated / Math.max(totalCritical, 1);
  const avgWait = env.cumulativeWait / Math.max(env.cumulativePatients, 1);
  const efficiency = Math.max(0, 1 - avgWait / 20);
  const score = 0.35 * survival + 0.25 * treatment + 0.25 * criticalScore + 0.15 * efficiency;
  return +Math.min(1, Math.max(0, score)).toFixed(4);
}
