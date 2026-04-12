import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import patientRoutes from './routes/patientRoutes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/patients', patientRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
