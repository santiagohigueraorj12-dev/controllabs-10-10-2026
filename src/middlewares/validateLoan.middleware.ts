import { Request, Response, NextFunction } from 'express';
import { ICreateLoanDTO } from '../dtos/loan.dto';

const isCreateLoanDTO = (value: unknown): value is ICreateLoanDTO => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const loan = value as Record<string, unknown>;
  return (
    typeof loan.aula === 'string' && loan.aula.trim() !== '' &&
    typeof loan.numeroPC === 'number' && Number.isInteger(loan.numeroPC) &&
    typeof loan.nombreGuardaEntrega === 'string' && loan.nombreGuardaEntrega.trim() !== '' &&
    typeof loan.instructorRecibe === 'string' && loan.instructorRecibe.trim() !== ''
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
