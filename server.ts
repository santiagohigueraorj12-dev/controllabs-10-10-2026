import 'dotenv/config'; // Forma recomendada en TS para reemplazar require('dotenv').config()
import app from './src/app';
import { prisma } from './src/db/prisma';

const port = Number(process.env.PORT ?? 5000);
const describeStartupError = (error: unknown): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }
  return error instanceof Error ? error.name : 'Unknown error';
};

const startServer = async (): Promise<void> => {
  await prisma.$connect();
  const server = app.listen(port, () => {
    console.log(`Servidor ControlLabs corriendo en http://localhost:${port}`);
  });
  server.once('error', (error: NodeJS.ErrnoException) => {
    console.error('No se pudo abrir el puerto HTTP:', error.code ?? error.name);
    process.exitCode = 1;
    void prisma.$disconnect().catch((disconnectError: unknown) => {
      console.error('Error al cerrar la conexión de Prisma:', disconnectError);
      process.exitCode = 1;
    });
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`Señal ${signal}: cerrando servidor y conexión a PostgreSQL.`);
    server.close((error) => {
      if (error) {
        console.error('Error al cerrar el servidor HTTP:', error);
        process.exitCode = 1;
      }
      void prisma.$disconnect().catch((disconnectError: unknown) => {
        console.error('Error al cerrar la conexión de Prisma:', disconnectError);
        process.exitCode = 1;
      });
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

void startServer().catch((error: unknown) => {
  console.error(
    'No se pudo iniciar ControlLabs o conectar con PostgreSQL. Revisa PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD y la disponibilidad del servidor.',
    describeStartupError(error)
  );
  process.exitCode = 1;
  void prisma.$disconnect().catch((disconnectError: unknown) => {
    console.error('Error al cerrar la conexión de Prisma:', disconnectError);
    process.exitCode = 1;
  });
});