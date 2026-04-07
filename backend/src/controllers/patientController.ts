import { Request, Response } from 'express';
import { createPatientRecord, findPatientById, getAllPatients } from '../services/patientService.js';
import { z } from 'zod';

const patientSchema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
  condition: z.string().optional(),
});

type PatientInput = z.infer<typeof patientSchema>;

export const getPatients = (_req: Request, res: Response) => {
  res.json(getAllPatients());
};

export const getPatientById = (req: Request, res: Response) => {
  const patient = findPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  return res.json(patient);
};

export const createPatient = (req: Request, res: Response) => {
  const result = patientSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid patient payload', details: result.error.format() });
  }

  const patient = createPatientRecord(result.data as PatientInput);
  return res.status(201).json(patient);
};
