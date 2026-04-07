import { randomUUID } from 'crypto';
import { Patient } from '../models/patient.js';

const patientStore: Patient[] = [
  { id: '1', name: 'John Doe', age: 45, condition: 'stable' },
  { id: '2', name: 'Jane Smith', age: 32, condition: 'under observation' },
];

export const getAllPatients = (): Patient[] => [...patientStore];

export const findPatientById = (id: string): Patient | undefined => {
  return patientStore.find((patient) => patient.id === id);
};

export const createPatientRecord = (data: Omit<Patient, 'id'>): Patient => {
  const patient: Patient = { id: randomUUID(), ...data };
  patientStore.push(patient);
  return patient;
};
