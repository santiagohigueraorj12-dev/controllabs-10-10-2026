# Bitácora Sesión 6: Autenticación JWT y permisos RBAC

**Proyecto:** ControlLabs API
**Aprendiz:** Santiago Higuera
**Rama:** `feat/autenticacion-rbac`

## 1. Qué se construyó

La API ahora sabe **quién llama** (autenticación con JWT) y **qué puede hacer** (autorización por rol). Validar el token responde «¿quién eres?»; `authorize` responde «¿puedes hacer esto?».

| Etapa | Archivos | Responsabilidad |
|---|---|---|
| Datos | `prisma/schema.prisma`, `bd.sql`, `prisma/patches/add_user_password_hash.sql` | Columna `password_hash` nullable, para no romper las cuentas que todavía no tienen contraseña. |
| Identidad | `src/auth/roles.ts`, `src/auth/authenticated-user.ts` | Los únicos roles son `ADMIN`, `GUARDA` e `INSTRUCTOR`. `req.user` queda tipado. |
| Token | `src/auth/jwt.ts` | Firma y verifica JWT HS256 con emisor `controllabs-api`, audiencia `controllabs-client` y duración de 15 minutos. Rechaza secretos de menos de 32 bytes. |
| Credenciales | `src/repositories/user.repository.ts`, `prisma-user.repository.ts`, `src/services/auth.service.ts` | Busca al usuario por correo, rechaza cuentas inactivas o sin hash y compara la contraseña con `bcrypt.compare`. |
| HTTP de login | `validateAuth.middleware.ts`, `auth.controller.ts`, `auth.routes.ts`, `auth-container.ts` | `POST /auth/login` (público) y `GET /auth/me` (con token). |
| Protección | `src/middlewares/auth.middleware.ts` | `authenticate` responde 401 si el token falta, está alterado o expiró. `authorize(...roles)` responde 403 si el rol no tiene permiso. |
| Préstamos | `loan.routes.ts`, `loan.controller.ts`, `loan.service.ts`, `prisma-loan.repository.ts` | Aplica la matriz de permisos. El `guardaId` sale del token y el servicio valida que el instructor destinatario exista y esté activo. |
| Errores | `domain.error.ts`, `errorHandler.middleware.ts` | Nuevos códigos `UNAUTHORIZED` (401) y `FORBIDDEN` (403). |

### Matriz de permisos aplicada

| Acción | INSTRUCTOR | GUARDA | ADMIN |
|---|---|---|---|
| Generar un préstamo | No (403) | Sí; queda ligado al guarda del token | No (403) |
| Buscar préstamos | Solo los asignados a él | Solo los que él generó | Todos |
| Consultar por ID | Solo los asignados (si no, 403) | Solo los suyos (si no, 403) | Todos |
| Aceptar | Sí, solo los asignados a él | No (403) | No (403) |

## 2. Preparación

```powershell
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken
npx prisma db execute --schema prisma/schema.prisma --file prisma/patches/add_user_password_hash.sql
npm run db:generate
npm run build
```

- **`JWT_SECRET`:** se generó con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` y se guardó en `.env`, que no se sube a Git. `.env.example` solo trae el nombre de la variable.
- **Contraseñas:** la base semilla no trae contraseñas. Se generó un hash bcrypt (costo 12) de una contraseña temporal de prueba y se asignó con `UPDATE users SET password_hash = '<hash>' ...` a los usuarios. En Git no se guardan ni la contraseña ni el hash.
- **Usuarios extra para las pruebas negativas** (solo en la base local, no en `bd.sql`):
  - `instructor2.prueba@sena.edu.co`, un segundo instructor activo, para probar que un instructor no puede aceptar el préstamo de otro.
  - `guarda.inactivo@sena.edu.co`, un guarda con `activo = false`, para probar que una cuenta inactiva no recibe token.

## 3. Resultados de las pruebas

Servidor en `http://localhost:5000`, con los mismos datos de la Sesión 5 (sala `Sala 301`).

| # | Petición | Esperado | Obtenido | Qué demuestra |
|---|---|---|---|---|
| 1 | Login del guarda | 200 y token | **200**, `accessToken`, `expiresIn: 900` | Credenciales correctas |
| 2 | `GET /auth/me` con el token del guarda | 200 | **200**, id, correo y rol `GUARDA`, sin hash | El token identifica al usuario |
| 3 | Login con contraseña incorrecta | 401 | **401** "Correo o contraseña incorrectos." | bcrypt rechaza la contraseña |
| 4 | Login de una cuenta inactiva con la contraseña correcta | 401 | **401**, el mismo mensaje | No se revela si la cuenta existe |
| 5 | Login con JSON inválido | 400 | **400** `VALIDATION_ERROR` | Se valida antes del servicio |
| 6 | `GET /loans/search` sin `Authorization` | 401 | **401** | La ruta exige identidad |
| 7 | Token alterado | 401 | **401** "El token no es válido o ha expirado." | Se verifica la firma |
| 8 | Token expirado | 401 | **401** | Se verifica el vencimiento |
| 9 | Guarda crea un préstamo sin enviar `guardaId` | 201 | **201**, `guardaId` = id del guarda del token | El creador sale del JWT |
| 10 | Guarda envía `guardaId` en el body | 400 | **400** | No se acepta `guardaId` del cliente |
| 11 | Guarda indica como instructor a un usuario que no es instructor | 400 | **400** "El instructor seleccionado no existe o no está activo." | El servicio valida al destinatario |
| 12 | Instructor intenta crear un préstamo | 403 | **403** | Solo el guarda crea |
| 13 | Guarda lista préstamos | Solo los suyos | **200**, solo préstamos con su `guardaId` | Alcance del guarda |
| 14 | Instructor asignado lista préstamos | Solo los asignados | **200**, solo los asignados a él | Alcance del instructor |
| 15 | Otro instructor lista préstamos | Solo los suyos | **200**, ve solo el que le asignaron y ninguno del otro | Un instructor no ve los ajenos |
| 16 | Admin lista préstamos | Todos | **200**, todos los préstamos | El admin no tiene filtro |
| 17 | Otro instructor consulta el préstamo por ID | 403 | **403** `FORBIDDEN` | Se valida la propiedad, no solo el rol |
| 18 | Admin consulta el préstamo por ID | 200 | **200** | El admin consulta todo |
| 19 | Guarda intenta aceptar | 403 | **403** | El guarda genera, el instructor acepta |
| 20 | Otro instructor intenta aceptar | 403 | **403** `FORBIDDEN` | Solo acepta el instructor asignado |
| 21 | El instructor asignado acepta | 200 | **200**, `APROBADO_Y_FIRMADO` | Rol correcto y préstamo asignado |
| 22 | El mismo instructor acepta otra vez | 409 | **409** `CONFLICT` | La transición solo ocurre una vez |
| 23 | `GET /auth/me` sin token | 401 | **401** | El perfil también está protegido |

Colección para repetir las pruebas: `docs/ControlLabs-Sesion6.postman_collection.json`. Antes de usarla hay que poner la contraseña de prueba en la variable `password` y el UUID real de la sala en `roomId`. Los logins guardan los tokens y la creación guarda `loanId`.

## 4. Qué se observó

- **401 y 403 no son lo mismo.** 401 significa que no se sabe quién llama (sin token, token alterado o vencido). 403 significa que sí se sabe, pero no tiene permiso.
- **Tener el rol correcto no basta.** El otro instructor tiene rol `INSTRUCTOR` y pasa `authorize('INSTRUCTOR')`, pero el servicio lo rechaza con 403 porque el préstamo está asignado a otra persona.
- **El orden de los middlewares importa.** Cuando el guarda intenta aceptar, `authorize` responde 403 antes de llegar al validador del id y al controlador.
- **Mismo mensaje para todos los fallos de login:** contraseña incorrecta, cuenta inactiva o correo inexistente responden igual. Así nadie puede averiguar qué correos están registrados.
- **El token no está cifrado.** Su contenido se puede leer en base64 (correo y rol), por eso nunca lleva la contraseña ni el hash. La firma solo impide que lo modifiquen: al cambiar un carácter, la API respondió 401.
- **Un token sigue sirviendo hasta que vence.** Si se desactiva una cuenta, su token funciona hasta 15 minutos más. Por eso la duración es corta.

## 5. Pendiente

- Endpoint o herramienta de administración para asignar contraseñas sin usar SQL directo.
- Login con Google (OAuth) que pide la HU-01 de la Sesión 1.
- Para producción: HTTPS, CORS limitado, un secreto distinto por entorno y renovación o revocación de tokens.
- Aplicar `authenticate` y `authorize` a los demás módulos (usuarios, ambientes, equipos, novedades y panel) cuando tengan su servicio.
