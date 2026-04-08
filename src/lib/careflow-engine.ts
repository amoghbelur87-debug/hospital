/**
 * CareFlow Hospital Simulation Engine — API Integration with Hugging Face Space
 */

import { HospitalAPI, type HospitalState } from "./hospital-api";

// ---------- Types ----------
// Keep the same interface for compatibility
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
  severityStd: number;
  dischargeRate: number;
  deathRate: number;
  rewardWeights: {
    admission: number;
    discharge: number;
    death: number;
    waitTime: number;
    resourceUtil: number;
  };
  seed: number;
}

export interface SnapshotData {
  step: number;
  patients: Patient[];
  totalBeds: number;
  totalIcu: number;
  bedsUsed: number;
  icuUsed: number;
  waitQueue: number;
  totalAdmitted: number;
  totalDischarged: number;
  totalDeaths: number;
  reward: number;
  done: boolean;
}

// ---------- API-based Environment Class ----------
export class CareFlowEnv {
  private config: EnvConfig;
  private currentState: HospitalState | null = null;
  private episodeReward: number = 0;
  private done: boolean = false;

  constructor(config: EnvConfig) {
    this.config = config;
  }

  async reset(): Promise<HospitalState> {
    this.currentState = await HospitalAPI.reset();
    this.episodeReward = 0;
    this.done = false;
    return this.currentState!;
  }

  async step(action: number): Promise<[HospitalState, number, boolean, any]> {
    if (this.done) {
      throw new Error("Environment is done. Call reset() first.");
    }

    const result = await HospitalAPI.step(action);
    if (!result) {
      throw new Error("Failed to step environment");
    }

    this.currentState = result.state;
    this.episodeReward += result.reward;
    this.done = result.done;

    return [result.state, result.reward, result.done, result.info];
  }

  snapshot(): SnapshotData {
    if (!this.currentState) {
      throw new Error("Environment not initialized. Call reset() first.");
    }

    // Convert API state to snapshot format
    return {
      step: this.currentState.step,
      patients: this.currentState.patients || [],
      totalBeds: this.currentState.general_beds_available + this.currentState.general_beds_used,
      totalIcu: this.currentState.icu_beds_available + this.currentState.icu_beds_used,
      bedsUsed: this.currentState.general_beds_used,
      icuUsed: this.currentState.icu_beds_used,
      waitQueue: this.currentState.wait_queue_length,
      totalAdmitted: this.currentState.total_admitted,
      totalDischarged: this.currentState.total_discharged,
      totalDeaths: this.currentState.total_deaths,
      reward: this.episodeReward,
      done: this.done,
    };
  }

  getCurrentState(): HospitalState | null {
    return this.currentState;
  }

  isDone(): boolean {
    return this.done;
  }

  getEpisodeReward(): number {
    return this.episodeReward;
  }
}

// ---------- Presets ----------
// Simplified configs since the actual logic is in the Python backend
export const EASY_CONFIG: EnvConfig = {
  maxSteps: 100,
  totalBeds: 30,
  totalIcu: 10,
  totalStaff: 20,
  initialPatients: 3,
  arrivalRate: 1.0,
  arrivalStd: 0.3,
  severityIncreaseRate: 0.015,
  severityStd: 0.1,
  dischargeRate: 0.05,
  deathRate: 0.02,
  rewardWeights: {
    admission: 1.0,
    discharge: 1.5,
    death: -2.0,
    waitTime: -0.1,
    resourceUtil: 0.5,
  },
  seed: 42,
};

export const MEDIUM_CONFIG: EnvConfig = {
  maxSteps: 150,
  totalBeds: 25,
  totalIcu: 8,
  totalStaff: 18,
  initialPatients: 6,
  arrivalRate: 1.8,
  arrivalStd: 0.6,
  severityIncreaseRate: 0.025,
  severityStd: 0.15,
  dischargeRate: 0.04,
  deathRate: 0.03,
  rewardWeights: {
    admission: 1.0,
    discharge: 1.5,
    death: -2.0,
    waitTime: -0.1,
    resourceUtil: 0.5,
  },
  seed: 42,
};

export const HARD_CONFIG: EnvConfig = {
  maxSteps: 200,
  totalBeds: 20,
  totalIcu: 5,
  totalStaff: 15,
  initialPatients: 8,
  arrivalRate: 2.2,
  arrivalStd: 1.0,
  severityIncreaseRate: 0.03,
  severityStd: 0.2,
  dischargeRate: 0.03,
  deathRate: 0.04,
  rewardWeights: {
    admission: 1.0,
    discharge: 1.5,
    death: -2.0,
    waitTime: -0.1,
    resourceUtil: 0.5,
  },
  seed: 42,
};

// ---------- Actions ----------
// These are the action codes expected by the Python backend
export const ACTION_ASSIGN_BED = 0;
export const ACTION_SEND_ICU = 1;
export const ACTION_DELAY = 2;
export const ACTION_DISCHARGE = 3;
export const ACTION_CALL_STAFF = 4;

// ---------- Baseline Agent ----------
// Simplified baseline that works with the API
export async function runBaselineStep(env: CareFlowEnv): Promise<any> {
  // For now, just take a default action (delay)
  // In a real implementation, this would analyze the state and choose an action
  return await env.step(ACTION_DELAY);
}

// ---------- Grader ----------
// Simplified grading based on final state
export function grade(env: CareFlowEnv): number {
  const state = env.getCurrentState();
  if (!state) return 0;

  // Simple grading based on deaths and efficiency
  const deathPenalty = Math.min(state.total_deaths * 0.1, 1.0);
  const efficiency = Math.max(0, 1 - (state.wait_queue_length * 0.05));

  return Math.max(0, Math.min(1, efficiency - deathPenalty));
}
