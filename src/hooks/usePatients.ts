import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsAPI } from '@/lib/api';
import type { Patient } from '@/lib/api';

export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const result = await patientsAPI.getAll();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
  });
};

export const usePatient = (id: string | undefined) => {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await patientsAPI.getById(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};
