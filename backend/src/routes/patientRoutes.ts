import { Router } from 'express';
import { createPatient, getPatientById, getPatients } from '../controllers/patientController.js';

const router = Router();

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);

export default router;
