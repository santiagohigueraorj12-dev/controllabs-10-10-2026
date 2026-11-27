import { UserRole } from '../auth/roles';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;
  passwordHash: string | null;
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
}
