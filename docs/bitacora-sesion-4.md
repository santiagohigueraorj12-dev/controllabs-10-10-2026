# Bitácora Sesión 4: Capa de servicios y modelo relacional

**Proyecto:** ControlLabs API
**Aprendiz:** Santiago Higuera
**Rama:** `feat/capa-servicios`

## 1. Qué se construyó

Cada capa del flujo de préstamos tiene una sola responsabilidad:

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Middleware | `src/middlewares/validateLoan.middleware.ts` | Valida la **forma** del JSON: campos permitidos, UUID válidos, `numeroPc` entero. |
| Controller | `src/controllers/loan.controller.ts` | Toma `req.body`, `req.params` y `req.query`, llama al servicio y responde 201/200. No tiene reglas de negocio. |
| Service | `src/services/loan.service.ts` | Aplica las **reglas de negocio**: cantidad positiva, id válido, préstamo existente y aceptar solo una vez. No conoce Express. |
| Repository | `src/repositories/loan.repository.ts` + `in-memory-loan.repository.ts` | Guarda y consulta préstamos. Hoy en un `Map` en memoria; mañana en PostgreSQL con el mismo contrato. |
| Errores | `src/errors/domain.error.ts` | El servicio lanza `DomainError` con un código (`VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`) sin saber de HTTP. |
| Composición | `src/container.ts` | Crea el repositorio una sola vez y lo inyecta en el servicio. |
| Errores HTTP | `src/middlewares/errorHandler.middleware.ts` | Traduce `DomainError` a HTTP: 400, 404 y 409. |

El DTO cambió respecto a la Sesión 3 para alinearse con la tabla `loans`. Ahora es `roomId`, `instructorId`, `guardaId` y `numeroPc`. El script del modelo relacional quedó en `docs/db/controllabs.sql`. Es una proyección: todavía no está conectado al backend.

## 2. Resultados de las pruebas

Servidor: `npm run dev` en `http://localhost:5000`. Body del POST válido:

```json
{
  "roomId": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44",
  "instructorId": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33",
  "guardaId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
  "numeroPc": 1
}
```

| # | Petición | Esperado | Obtenido | Quién responde |
|---|---|---|---|---|
| 1 | `POST /api/v1/loans` (válido) | 201 y `data.id` | **201**, `id: 1`, `estado: PENDIENTE_APROBACION` | Repositorio crea el préstamo |
| 2 | `GET /loans/search?roomId=d3ee...` | 200 | **200**, lista con el préstamo 1 | Servicio → repositorio |
| 3 | `GET /loans/1` | 200 | **200** | Servicio → repositorio |
| 4 | `GET /loans/999` | 404 | **404** `NOT_FOUND` | Servicio |
| 5 | `PUT /loans/1/accept` | 200 | **200**, `estado: APROBADO_Y_FIRMADO` y `acceptedAt` con fecha | Servicio + `updateStatus` condicional |
| 6 | `PUT /loans/1/accept` (otra vez) | 409 | **409** `CONFLICT` | Servicio |
| 7 | `POST` con `numeroPc: 0` | 400 | **400** `VALIDATION_ERROR` | Servicio (regla de negocio) |
| 8 | `POST` con `roomId: "301"` | 400 | **400** | Middleware (no es UUID) |
| 9 | `POST` con un campo extra | 400 | **400** | Middleware (campo no permitido) |
| 10 | `POST` con el formato viejo de la Sesión 3 | 400 | **400** | Middleware |
| 11 | `GET /loans/abc` | 400 | **400** `VALIDATION_ERROR` | Servicio (id no es entero) |
| 12 | `GET /loans/search?roomId=xyz` | 400 | **400** `VALIDATION_ERROR` | Servicio |
| 13 | `PUT /loans/999/accept` | 404 | **404** `NOT_FOUND` | Servicio |
| 14 | JSON malformado | 400 | **400** | Parser de Express |
| 15 | `GET /__test/error` (ruta temporal) | 500 | **500** genérico, sin stack | Manejador global |
| 16 | Reiniciar el servidor y `GET /loans/search` | lista vacía | **200**, `data: []` | El `Map` en memoria empieza vacío |

## 3. Qué se observó

- **Las peticiones inválidas no crean registros.** Después de las pruebas 7 a 10, `GET /loans/search` sigue mostrando un solo préstamo.
- **El logger de la Sesión 3 corre antes que todo.** En la consola aparece una línea `[AUDIT SENA]` por cada petición, incluidas las rechazadas.
- **Middleware vs. servicio:** `numeroPc: "1"` lo rechaza el middleware (tipo incorrecto). `numeroPc: 0` pasa el middleware porque es un entero, pero lo rechaza el servicio porque la regla de negocio exige que sea mayor que cero.
- **404 vs. 409 al aceptar:** si `updateStatus` no actualiza nada, el servicio vuelve a buscar el préstamo. Si no existe responde 404; si existe pero ya fue aceptado, responde 409.
- **La memoria es temporal:** al reiniciar el servidor los préstamos se pierden. Por eso más adelante se cambiará a PostgreSQL. Bastará con crear otro repositorio que cumpla el mismo contrato y cambiarlo en `container.ts`, sin tocar el servicio ni el controlador.

## 4. Pendiente (según la guía)

- **Verificar que el ambiente, el instructor y el guarda existan y estén activos.** Hacen falta los repositorios de usuarios y ambientes.
- **Saber qué equipos concretos se prestaron.** El modelo actual guarda la cantidad, no los activos.
- **Autenticación.** El `guardaId` debe salir de la identidad verificada, no del body.
- **Conectar PostgreSQL** con el script de `docs/db/controllabs.sql`.

Nota: la colección de pruebas de la Sesión 3 usa el formato viejo del préstamo (`aula`, `numeroPC`...). Para esta sesión hay que usar `docs/ControlLabs-Sesion4.postman_collection.json`.
