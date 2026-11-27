import express, { Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { requestLogger } from './middlewares/logger.middleware';
import { globalErrorHandler } from './middlewares/errorHandler.middleware';

const app = express();

app.use(cors());
app.use(requestLogger);
app.use(express.json());

// Health Check Endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'ControlLabs API operando correctamente',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1', apiRoutes);

// Ruta temporal para comprobar el 500 genérico; no existe en producción.
if (process.env.NODE_ENV !== 'production') {
  app.get('/__test/error', (_req, _res, next) => {
    next(new Error('Error de prueba'));
  });
}

// Ninguna ruta coincidió
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada.' });
});

app.use(globalErrorHandler);

export default app;
