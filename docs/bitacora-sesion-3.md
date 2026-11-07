# Bitácora Sesión 3: Middlewares, DTO y manejo de errores

**Proyecto:** ControlLabs API
**Aprendiz:** Santiago Higuera
**Rama:** `feat/middlewares-dto`

## 1. Pregunta para el equipo

> ¿Qué problemas aparecerían si ControlLabs guardara un préstamo sin verificar el aula, el número del equipo y quién lo recibe?

- **Consecuencia para los datos:** quedarían préstamos incompletos o con datos incorrectos (por ejemplo, sin aula o con `numeroPC: "doce"`). Después no se podría saber qué equipo se prestó ni en qué ambiente está, y los reportes del dashboard mostrarían números equivocados.
- **Consecuencia para la persona que usa el sistema:** si falta un equipo, nadie sabe quién lo recibió, así que no hay a quién pedirle cuentas. El guarda o el instructor podrían terminar respondiendo por un equipo que no recibieron.

## 2. Pregunta guía: ¿qué fallo evita cada archivo?

| Archivo | Qué fallo evita | Cómo se comprueba |
|---|---|---|
| `src/middlewares/logger.middleware.ts` | Que no quede registro de qué peticiones llegaron, cuándo y a qué ruta. | En la consola aparece una línea `[AUDIT SENA]` por cada petición, también las inválidas. |
| `src/dtos/loan.dto.ts` | Que cada parte del código suponga una forma distinta del préstamo. Define un solo contrato compartido. | El validador lo usa como tipo y TypeScript compila sin errores (`npm run build`). |
| `src/middlewares/validateLoan.middleware.ts` | Que lleguen al controlador préstamos con campos faltantes o con tipos incorrectos. | Pruebas B y C responden 400 y el controlador no se ejecuta. |
| `src/middlewares/errorHandler.middleware.ts` | Que un error inesperado tumbe la respuesta o muestre el stack trace al cliente. | Prueba D responde 500 con un JSON genérico, sin el mensaje interno ni el stack. |
| Respuesta 404 en `src/app.ts` | Que una ruta inexistente responda con una página HTML en vez de JSON. | `GET /api/v1/nope` responde 404 con JSON. |

## 3. Resultados de las pruebas

Petición: `POST http://localhost:5000/api/v1/loans` con Body → JSON.

| Prueba | Body / petición | Status | Respuesta |
|---|---|---|---|
| **A · Datos válidos** | `{"aula":"301","numeroPC":12,"nombreGuardaEntrega":"Laura Gómez","instructorRecibe":"Carlos Ruiz"}` | **501** | `{"success":false,"message":"El registro de préstamos todavía no está implementado."}` |
| **B · Falta un campo** | `{"aula":"301","numeroPC":12,"instructorRecibe":"Carlos Ruiz"}` | **400** | `{"success":false,"error":"Datos del préstamo inválidos."}` |
| **C · Tipo incorrecto** | `{"aula":"301","numeroPC":"doce",...}` | **400** | `{"success":false,"error":"Datos del préstamo inválidos."}` |
| **D · Error del servidor** | `GET http://localhost:5000/__test/error` (ruta temporal) | **500** | `{"status":"error","message":"Error interno del servidor en ControlLabs","timestamp":"..."}` |
| Ruta inexistente | `GET http://localhost:5000/api/v1/nope` | **404** | `{"success":false,"error":"Ruta no encontrada."}` |
| JSON malformado | Body: `{"aula": ` | **400** | `{"success":false,"error":"El cuerpo JSON está malformado."}` |

Consola del servidor durante las pruebas:

```
[AUDIT SENA] [2026-11-07T12:07:46.718Z] POST /api/v1/loans
[AUDIT SENA] [2026-11-07T12:07:46.794Z] POST /api/v1/loans
[AUDIT SENA] [2026-11-07T12:07:46.838Z] POST /api/v1/loans
[AUDIT SENA] [2026-11-07T12:07:46.925Z] GET /__test/error
Error: Error de prueba
[AUDIT SENA] [2026-11-07T12:07:46.983Z] GET /api/v1/nope
```

## 4. Qué se observó

- **Una línea de auditoría por cada intento:** el logger aparece en todas las peticiones, incluso en B, C y en el JSON malformado. Esto pasa porque en `app.ts` el logger se registra **antes** que `express.json()` y que el validador.
- **Pruebas B y C:** responden 400 y no se crea ningún préstamo. El validador responde sin llamar a `next()`, así que el controlador nunca se ejecuta. En la B el campo que falta es `nombreGuardaEntrega`.
- **Prueba A:** los datos pasan el validador y llegan al controlador, que responde 501 porque el servicio de préstamos todavía no existe. Cuando se conecte el servicio, la respuesta será 201.
- **Prueba D:** el error llega al manejador global. El detalle (`Error de prueba` y el stack) solo se ve en la consola del servidor. Al cliente le llega un mensaje genérico. La ruta `/__test/error` se quitó al terminar la prueba.

## 5. ¿Por qué `12` y `"12"` dan resultados distintos?

En JSON, `12` es un **número** y `"12"` es un **texto (string)**, aunque los dos parezcan el doce. El validador revisa el tipo real con `typeof loan.numeroPC === 'number'` y `Number.isInteger(...)`, así que `"12"` no pasa y responde 400.

La interfaz `ICreateLoanDTO` dice que `numeroPC` es `number`, pero eso solo lo revisa TypeScript al compilar. Los tipos desaparecen cuando el código se ejecuta. Por eso hace falta el middleware: es el que revisa los datos que llegan de verdad por HTTP.

## 6. Orden de los middlewares en `app.ts`

1. `cors()`
2. `requestLogger`: antes del parser, para auditar también los JSON malformados.
3. `express.json()`: antes de las rutas, para que exista `req.body`.
4. Health check y `app.use('/api/v1', apiRoutes)`. El validador va solo en `POST /loans`, dentro del router.
5. Respuesta 404.
6. `globalErrorHandler`, siempre al final.
