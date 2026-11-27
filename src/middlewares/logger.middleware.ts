import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT SENA] [${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};
