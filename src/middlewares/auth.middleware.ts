import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
import { verifyAccessToken } from '../auth/jwt';
import { UserRole } from '../auth/roles';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.header('authorization');
  const bearerToken = /^Bearer\s+([^\s]+)$/i.exec(authorization ?? '');
  if (!bearerToken) {
    res.status(401).json({ success: false, error: 'Se requiere un token Bearer válido.' });
    return;
  }

  try {
    const user = verifyAccessToken(bearerToken[1]);
    if (!user) {
      res.status(401).json({ success: false, error: 'El token no es válido.' });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    if (
      error instanceof JsonWebTokenError ||
      error instanceof TokenExpiredError ||
      error instanceof NotBeforeError
    ) {
      res.status(401).json({ success: false, error: 'El token no es válido o ha expirado.' });
      return;
    }
    next(error);
  }
};

export const authorize = (...allowedRoles: UserRole[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Debes iniciar sesión para continuar.' });
    return;
  }
  if (!allowedRoles.includes(req.user.rol)) {
    res.status(403).json({ success: false, error: 'No tienes permiso para realizar esta acción.' });
    return;
  }
  next();
};
