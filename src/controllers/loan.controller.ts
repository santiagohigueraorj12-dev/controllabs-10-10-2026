import { NextFunction, Request, Response } from 'express';
import { loanService } from '../container';
import { ICreateLoanRequestDTO } from '../dtos/loan.dto';
import { DomainError } from '../errors/domain.error';

export class LoanController {
  public static createLoan = async (
    req: Request<Record<string, string>, unknown, ICreateLoanRequestDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new DomainError('UNAUTHORIZED', 'Debes iniciar sesión para continuar.');
      }
      // El guarda autenticado es el creador; nunca se toma guardaId del body.
      const loan = await loanService.createLoan({
        ...req.body,
        guardaId: req.user.id
      });
      res.status(201).json({ success: true, data: loan });
    } catch (error) {
      next(error);
    }
  };

  public static getLoansByFilter = async (
    req: Request<Record<string, string>, unknown, unknown, { roomId?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Guarda e instructor solo ven los suyos; el administrador ve todos.
      const loans = await loanService.getLoans({
        roomId: req.query.roomId,
        ...(req.user?.rol === 'INSTRUCTOR' ? { instructorId: req.user.id } : {}),
        ...(req.user?.rol === 'GUARDA' ? { guardaId: req.user.id } : {})
      });
      res.status(200).json({ success: true, data: loans });
    } catch (error) {
      next(error);
    }
  };

  public static getLoanById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const loan = await loanService.getLoanDetail(
        req.params.id,
        req.user?.rol === 'INSTRUCTOR'
          ? { instructorId: req.user.id }
          : req.user?.rol === 'GUARDA'
            ? { guardaId: req.user.id }
            : {}
      );
      res.status(200).json({ success: true, data: loan });
    } catch (error) {
      next(error);
    }
  };

  public static acceptLoanInventory = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new DomainError('UNAUTHORIZED', 'Debes iniciar sesión para continuar.');
      }
      const loan = await loanService.acceptLoan(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: loan });
    } catch (error) {
      next(error);
    }
  };
}
