import { NextFunction, Request, Response } from 'express';
import { DomainError } from '../errors/domain.error';
import { authService } from '../auth-container';
import { LoginDTO } from '../dtos/auth.dto';

export class AuthController {
  public static login = async (
    req: Request<Record<string, string>, unknown, LoginDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public static me = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new DomainError('UNAUTHORIZED', 'Debes iniciar sesión para continuar.'));
      return;
    }
    res.status(200).json({ success: true, data: req.user });
  };
}
