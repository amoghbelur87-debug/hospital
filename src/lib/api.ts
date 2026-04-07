import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Patient {
  id: string;
  name: string;
  age: number;
  condition?: string;
}

interface CreatePatientPayload {
  name: string;
  age: number;
  condition?: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Patients API
export const patientsAPI = {
  getAll: async (): Promise<ApiResponse<Patient[]>> => {
    try {
      const response = await apiClient.get('/api/patients');
      return { data: response.data, error: null };
    } catch (err) {
      const error = err as AxiosError;
      return { data: null, error: error.message };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    try {
      const response = await apiClient.get(`/api/patients/${id}`);
      return { data: response.data, error: null };
    } catch (err) {
      const error = err as AxiosError;
      return { data: null, error: error.message };
    }
  },

  create: async (payload: CreatePatientPayload): Promise<ApiResponse<Patient>> => {
    try {
      const response = await apiClient.post('/api/patients', payload);
      return { data: response.data, error: null };
    } catch (err) {
      const error = err as AxiosError;
      return { data: null, error: error.message };
    }
  },
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch {
    return false;
  }
};
