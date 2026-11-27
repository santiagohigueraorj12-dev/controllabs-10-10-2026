import { UserRole } from './roles';

export interface AuthenticatedUser {
  id: string;
  email: string;
  rol: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
