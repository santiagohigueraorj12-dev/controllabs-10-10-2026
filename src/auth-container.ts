import { prisma } from './db/prisma';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { AuthService } from './services/auth.service';

const userRepository = new PrismaUserRepository(prisma);
export const authService = new AuthService(userRepository);
