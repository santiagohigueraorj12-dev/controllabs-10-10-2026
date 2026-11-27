import { PrismaClient } from '@prisma/client';
import { isUserRole } from '../auth/roles';
import { AuthUser, UserRepository } from './user.repository';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly database: PrismaClient) {}

  public async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.database.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }
    if (!isUserRole(user.rol)) {
      throw new Error(`Rol de usuario no reconocido en la base de datos: ${user.rol}`);
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      activo: user.activo,
      passwordHash: user.passwordHash
    };
  }
}
