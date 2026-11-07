import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../errors/domain.error';

const domainErrorStatus: Record<DomainError['code'], number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409
};

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof DomainError) {
    res.status(domainErrorStatus[err.code]).json({
      success: false,
      code: err.code,
      error: err.message
    });
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    err.type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      success: false,
      error: 'El cuerpo JSON está malformado.'
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor en ControlLabs',
    timestamp: new Date().toISOString()
  });
};
