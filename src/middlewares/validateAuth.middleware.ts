import { NextFunction, Request, Response } from 'express';

const isLoginPayload = (
  value: unknown
): value is { email: string; password: string } => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    Object.keys(payload).every((key) => key === 'email' || key === 'password') &&
    typeof payload.email === 'string' &&
    payload.email.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) &&
    typeof payload.password === 'string' &&
    Buffer.byteLength(payload.password, 'utf8') > 0 &&
    Buffer.byteLength(payload.password, 'utf8') <= 72
  );
};

export const validateLoginPayload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!isLoginPayload(req.body)) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      error: 'Debes enviar un correo válido y una contraseña de hasta 72 bytes.'
    });
    return;
  }
  next();
};
