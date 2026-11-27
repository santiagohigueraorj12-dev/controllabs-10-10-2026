import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from './authenticated-user';
import { isUserRole } from './roles';

const ISSUER = 'controllabs-api';
const AUDIENCE = 'controllabs-client';
const TOKEN_LIFETIME_SECONDS = 900;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET debe estar configurado con al menos 32 bytes.');
  }
  return secret;
};

export const createAccessToken = (user: AuthenticatedUser): string =>
  jwt.sign(
    { email: user.email, rol: user.rol },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      audience: AUDIENCE,
      expiresIn: TOKEN_LIFETIME_SECONDS,
      issuer: ISSUER,
      subject: user.id
    }
  );

export const verifyAccessToken = (token: string): AuthenticatedUser | null => {
  const payload = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    audience: AUDIENCE,
    issuer: ISSUER
  });
  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    !isUserRole(payload.rol)
  ) {
    return null;
  }

  return { id: payload.sub, email: payload.email, rol: payload.rol };
};

export { TOKEN_LIFETIME_SECONDS };
