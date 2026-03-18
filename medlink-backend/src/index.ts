import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './services/socket';

import authRoutes from './routes/auth';
import patientRoutes from './routes/patient';
import accessRoutes from './routes/access';
import consentRoutes from './routes/consent';
import notificationRoutes from './routes/notifications';
import recordsRoutes from './routes/records';
import doctorsRoutes from './routes/doctors';
import hospitalsRoutes from './routes/hospitals';

config();

const app = express();
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
initSocket(httpServer);

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/patient/records', recordsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/hospitals', hospitalsRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`MedLinkID API running on port ${PORT}`);
});

export default app;
