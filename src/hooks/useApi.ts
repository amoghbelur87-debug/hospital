import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:4000/api';

export interface Patient {
  id: string;
  name: string;
  age: number;
  condition?: string;
}

export interface CreatePatientData {
  name: string;
  age: number;
  condition?: string;
}

// Fetch all patients
export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async (): Promise<Patient[]> => {
      const response = await fetch(`${API_BASE_URL}/patients`);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
};

// Fetch single patient
export const usePatient = (id: string) => {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async (): Promise<Patient> => {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient');
      }
      return response.json();
    },
    enabled: !!id,
  });
};

// Create new patient
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePatientData): Promise<Patient> => {
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create patient');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

// Health check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4000/health');
      if (!response.ok) {
        throw new Error('Backend not available');
      }
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
  });
};
