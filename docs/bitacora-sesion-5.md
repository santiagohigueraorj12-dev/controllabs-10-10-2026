# Bitácora Sesión 5: PostgreSQL y Prisma ORM

**Proyecto:** ControlLabs API
**Aprendiz:** Santiago Higuera
**Rama:** `feat/persistencia-prisma`

## 1. Qué se construyó

El repositorio en memoria de la Sesión 4 se reemplazó por un repositorio que guarda los préstamos en PostgreSQL usando Prisma ORM. El middleware, el controlador, el servicio y el manejador de errores mantienen su responsabilidad.

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Esquema SQL | `bd.sql` | Crea las tablas `users`, `rooms`, `equipment`, `loans` e `incidents` con PK, FK y restricciones `CHECK`. Siembra 3 usuarios, 210 salas y sus equipos. |
| Esquema Prisma | `prisma/schema.prisma` | Describe los modelos y mapea camelCase a las columnas snake_case con `@map` y `@@map`. |
| Conexión | `src/db/database-url.ts` | Lee `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` y `PGPASSWORD` del `.env` y compone la URL en memoria. No se guarda `DATABASE_URL`. |
| Cliente | `src/db/prisma.ts` | Crea un único `PrismaClient` para todo el proceso. |
| CLI | `prisma.config.ts` | Usa la misma URL compuesta para `prisma validate` y `prisma generate`. |
| Repositorio | `src/repositories/prisma-loan.repository.ts` | Implementa `LoanRepository` con Prisma. Convierte el `BigInt` del id a texto y traduce los errores de FK y `CHECK` a `VALIDATION_ERROR`. |
| Middleware | `src/middlewares/validateLoan.middleware.ts` | Valida el body, el id de la ruta (BIGINT positivo) y el filtro `roomId` (UUID). |
| Servicio | `src/services/loan.service.ts` | Coordina con el repositorio. Ya no valida la cantidad: esa regla la hace cumplir PostgreSQL. |
| Controller | `src/controllers/loan.controller.ts` | Usa `try/catch` y `next(error)`. Pasa el id como texto, sin convertirlo a `Number`. |
| Composición | `src/container.ts` | Inyecta `PrismaLoanRepository` en el servicio. Se borró el repositorio en memoria. |
| Arranque | `server.ts` | Espera `prisma.$connect()` antes de abrir el puerto y ejecuta `$disconnect()` con Ctrl+C. |

El id del préstamo ahora es `string` porque la columna es `BIGINT` y JSON no puede representar todos sus valores como número sin perder precisión.

## 2. Cómo se preparó la base de datos

El computador del ambiente tiene PostgreSQL 18 instalado como servicio del SENA, pero no se conoce la contraseña del usuario `postgres`. Para no depender de ella se creó un servidor PostgreSQL propio con los programas ya instalados, en una carpeta del usuario y en el puerto **5433**:

```powershell
# Una sola vez: crear el servidor propio (pide una contraseña nueva)
& "C:\Program Files\PostgreSQL\18\bin\initdb.exe" -D C:\Users\SENA\pgdata-controllabs -U postgres -W -A scram-sha-256 -E UTF8 --locale=C

# Cada vez que se encienda el computador: iniciar el servidor
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D C:\Users\SENA\pgdata-controllabs -l C:\Users\SENA\pgdata-controllabs\server.log -o "-p 5433" start

# Una sola vez: crear la base y cargar el esquema
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U postgres -c "CREATE DATABASE controllabs;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U postgres -d controllabs -f .\bd.sql
```

En `.env` quedó `PGPORT=5433` y la contraseña elegida. El archivo no se sube a Git; `.env.example` solo trae valores de ejemplo.

Después: `npx prisma validate`, `npm run db:generate`, `npm run build` y `npm run dev`.

## 3. Resultados de las pruebas

Servidor en `http://localhost:5000`. La sala usada fue `Sala 301`, cuyo UUID se consultó con `SELECT id FROM rooms WHERE nombre = 'Sala 301';`. El instructor y el guarda son los usuarios sembrados por `bd.sql`.

| # | Petición | Esperado | Obtenido | Quién responde |
|---|---|---|---|---|
| 1 | `POST /api/v1/loans` (válido) | 201 y `data.id` | **201**, `id: "1"` (texto), `estado: PENDIENTE_APROBACION` | PostgreSQL genera id, estado y fecha |
| 2 | `GET /loans/search?roomId=<Sala 301>` | 200 | **200**, lista con el préstamo 1 | Servicio → repositorio Prisma |
| 3 | `GET /loans/1` | 200 | **200** | Servicio → repositorio Prisma |
| 4 | `GET /loans/99999` | 404 | **404** `NOT_FOUND` | Servicio |
| 5 | `PUT /loans/1/accept` | 200 | **200**, `APROBADO_Y_FIRMADO` y `acceptedAt` con fecha | `updateMany` condicional |
| 6 | `PUT /loans/1/accept` (otra vez) | 409 | **409** `CONFLICT` | Servicio |
| 7 | `POST` con `numeroPc: 0` | 400 | **400** `VALIDATION_ERROR` (primero dio 500, ver sección 4) | `CHECK` de PostgreSQL traducido por el repositorio |
| 8 | `POST` con una sala que no existe | 400 | **400** "La sala, el instructor o el guarda indicados no existen." | FK de PostgreSQL (`P2003`) |
| 9 | `POST` con `roomId: "301"` | 400 | **400** | Middleware (no es UUID) |
| 10 | `POST` con un campo extra | 400 | **400** | Middleware |
| 11 | `GET /loans/abc` | 400 | **400** `VALIDATION_ERROR` | `validateLoanIdParameter` |
| 12 | `GET /loans/search?roomId=xyz` | 400 | **400** `VALIDATION_ERROR` | `validateLoanSearchQuery` |
| 13 | `PUT /loans/99999/accept` | 404 | **404** `NOT_FOUND` | Servicio |
| 14 | JSON malformado | 400 | **400** | Parser de Express |
| 15 | `GET /__test/error` | 500 | **500** genérico, sin stack | Manejador global |
| 16 | `GET /api/v1/no-existe` | 404 | **404** | Respuesta 404 de `app.ts` |
| 17 | Reiniciar el servidor y `GET /loans/1` | sigue existiendo | **200**, el préstamo sigue ahí | PostgreSQL conserva los datos |

Colección para repetir las pruebas: `docs/ControlLabs-Sesion5.postman_collection.json`. Antes de usarla hay que cambiar la variable `roomId` por el UUID real de una sala; la petición 1 guarda `loanId` automáticamente.

## 4. Qué se observó

- **La diferencia más importante con la Sesión 4:** al reiniciar el servidor el préstamo sigue existiendo. Antes el `Map` en memoria empezaba vacío.
- **El `CHECK` de `numero_pc` daba 500.** La guía dice que el repositorio traduce `P2004`, pero Prisma 6 entrega la violación de un `CHECK` de PostgreSQL como `PrismaClientUnknownRequestError` con el código `23514`, no como `P2004`. Se corrigió el repositorio para reconocer las dos formas y responder 400 (commit `fix(loans): traduce la violacion de CHECK de PostgreSQL a 400`).
- **La validación cambió de capa.** En la Sesión 4 el servicio rechazaba `numeroPc: 0` y los ids no numéricos. Ahora el id y el filtro los rechaza el middleware antes del controlador, y la cantidad la rechaza PostgreSQL.
- **Los UUID de ejemplo de la guía no sirven tal cual.** `bd.sql` genera UUID aleatorios para las salas, así que hay que consultar el de la base propia. Los del instructor y el guarda sí son fijos.
- **Los ids pueden saltar números.** Cuando un `INSERT` falla por el `CHECK` o la FK, PostgreSQL ya gastó ese número de la secuencia. Por eso, después de las pruebas fallidas, el siguiente préstamo válido no fue el 2. Es normal y no significa que se haya guardado un registro inválido: `GET /loans/search` solo mostró los préstamos válidos.
- **El logger de la Sesión 3 sigue corriendo primero:** aparece `[AUDIT SENA]` en consola en cada petición, incluso en las rechazadas.

## 5. Pendiente

- **Autenticación y roles:** hoy `guardaId` llega en el body y cualquiera puede aceptar. Se resuelve en la Sesión 6 con JWT y RBAC.
- Verificar que la sala y el guarda existan y estén activos antes de guardar (hoy solo se apoya en la FK).
- Repositorios para usuarios, ambientes, equipos y novedades.
- La relación préstamo-equipo para saber qué activos concretos se prestan.
