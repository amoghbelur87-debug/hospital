/**
 * API Client for Hospital Guardian AI Hugging Face Space
 */

const HF_SPACE_URL = "https://amogh2005-hospital-guardian-ai.hf.space";

export interface HospitalState {
  step: number;
  total_patients: number;
  icu_beds_used: number;
  icu_beds_available: number;
  general_beds_used: number;
  general_beds_available: number;
  wait_queue_length: number;
  total_admitted: number;
  total_discharged: number;
  total_deaths: number;
  patients: any[];
}

export interface InferenceResponse {
  status: "success" | "error";
  state?: HospitalState;
  reward?: number;
  done?: boolean;
  info?: any;
  message?: string;
}

export class HospitalAPI {
  private static async makeRequest(endpoint: string, data: any): Promise<InferenceResponse> {
    try {
      const response = await fetch(`${HF_SPACE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async reset(): Promise<HospitalState | null> {
    const response = await this.makeRequest("/inference", { action: "reset" });
    return response.status === "success" && response.state ? response.state : null;
  }

  static async step(action: number): Promise<{
    state: HospitalState;
    reward: number;
    done: boolean;
    info: any;
  } | null> {
    const response = await this.makeRequest("/inference", {
      action: "step",
      data: { action }
    });

    if (response.status === "success" && response.state) {
      return {
        state: response.state,
        reward: response.reward || 0,
        done: response.done || false,
        info: response.info || {},
      };
    }

    return null;
  }

  static async getState(): Promise<HospitalState | null> {
    const response = await this.makeRequest("/inference", { action: "get_state" });
    return response.status === "success" && response.state ? response.state : null;
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${HF_SPACE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}