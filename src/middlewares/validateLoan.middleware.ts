import { Request, Response, NextFunction } from 'express';
import { ICreateLoanDTO } from '../dtos/loan.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const isCreateLoanDTO = (value: unknown): value is ICreateLoanDTO => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const loan = value as Record<string, unknown>;
  const allowedFields = new Set([
    'roomId',
    'instructorId',
    'guardaId',
    'numeroPc'
  ]);
  return (
    Object.keys(loan).every((key) => allowedFields.has(key)) &&
    isUuid(loan.roomId) &&
    isUuid(loan.instructorId) &&
    isUuid(loan.guardaId) &&
    typeof loan.numeroPc === 'number' &&
    Number.isInteger(loan.numeroPc)
  );
};

export const validateLoanPayload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body: unknown = req.body;

  if (!isCreateLoanDTO(body)) {
    res.status(400).json({
      success: false,
      error: 'Datos del préstamo inválidos.'
    });
    return;
  }

  next();
};

// El id de la ruta debe caber en un BIGINT positivo de PostgreSQL.
export const validateLoanIdParameter = (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;
  const isPositiveBigInt =
    /^[1-9]\d*$/.test(id) &&
    id.length <= 19 &&
    BigInt(id) <= 9223372036854775807n;

  if (!isPositiveBigInt) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      error: 'El identificador del préstamo debe ser un entero positivo.'
    });
    return;
  }

  next();
};

// El filtro roomId es opcional; si llega, debe ser un UUID.
export const validateLoanSearchQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { roomId } = req.query;

  if (roomId !== undefined && !isUuid(roomId)) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      error: 'El filtro roomId debe ser un UUID válido.'
    });
    return;
  }

  next();
};
