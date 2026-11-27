import bcrypt from 'bcryptjs';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { createAccessToken, TOKEN_LIFETIME_SECONDS } from '../auth/jwt';
import { DomainError } from '../errors/domain.error';
import { UserRepository } from '../repositories/user.repository';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  public async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; expiresIn: number; user: AuthenticatedUser }> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    const passwordMatches =
      user?.passwordHash !== null &&
      user?.passwordHash !== undefined &&
      (await bcrypt.compare(password, user.passwordHash));

    if (!user || !user.activo || !passwordMatches) {
      throw new DomainError('UNAUTHORIZED', 'Correo o contraseña incorrectos.');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      rol: user.rol
    };
    return {
      accessToken: createAccessToken(authenticatedUser),
      expiresIn: TOKEN_LIFETIME_SECONDS,
      user: authenticatedUser
    };
  }
}
