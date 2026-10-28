# AutoTrib - No Residentes

Aplicación web (Google Apps Script + Google Sheets + Gmail) que automatiza el cálculo y la autorización de retenciones CDT para clientes no residentes en Banco Davivienda.

## Roles (qué existe y qué puede hacer cada uno)

Hay **3 roles**. También están en la hoja **ROLES** del Sheet y en la lista desplegable de la columna `rol` de **ACCESOS**, para que no se olviden.

| Rol | Quién | Qué puede hacer |
|---|---|---|
| **Oficina** | **Por defecto**: cualquier correo que entre y no esté en ACCESOS con otro rol | Ingresar CDT (los avisos le llegan a ella misma), ver solo los casos donde su correo es destinatario, ver instrucciones de pago, confirmar pago, editar la fecha de vencimiento |
| **Operativo** | Se asigna a mano en ACCESOS | Solo gestión: ver todos los casos, aprobar/rechazar (individual y por lote), cambiar tarifa %, alertas, reportes. No ingresa CDT |
| **Impuestos** | Leydi Y Librado Bernal y el equipo de Impuestos (a mano en ACCESOS) | **Las dos visuales**: ingresa CDT en nombre de una o varias oficinas y los gestiona como Operativo |

> El perfil **Contabilidad ya no existe**. Si en tu hoja ACCESOS quedó alguien con rol `Contabilidad`, entra con el rol por defecto (Oficina) hasta que le cambies el rol. Ya no se envían correos a Contabilidad.

**Rol por defecto.** Quien abre la app por primera vez y no está en ACCESOS entra como **Oficina**: se agrega solo a ACCESOS (activo = Sí, nombre sacado del correo, oficina vacía) para que luego completes su nombre y oficina. Para dar otro rol, cambia la columna `rol` de esa fila.
- Bloquear a alguien: pon `activo = No` en su fila.
- Quitar el rol por defecto (solo entra quien esté en ACCESOS): deja vacía la celda de CONFIG → *Rol por defecto*.
- El usuario que ejecuta `inicializarSistema()` queda como **Impuestos** (cambia su nombre en ACCESOS); la fila de ejemplo de Leydi queda como `Leydi Y Librado Bernal` con rol Impuestos (reemplaza su correo por el real).
- Como cualquier persona de la organización entra como Oficina, si necesitas lista cerrada usa la opción anterior o `APP.VALIDAR_DOMINIO` en Config.gs.
- Los nombres ya escritos en tu hoja ACCESOS **no se cambian solos**: corrige a mano el nombre de tu compañera a `Leydi Y Librado Bernal`.

## Ingreso en nombre de una oficina (perfil Impuestos)

Cuando alguien con perfil **Impuestos** ingresa un CDT, el formulario tiene el apartado **Destinatarios de las notificaciones**:

- **Correos de la(s) oficina(s)** (obligatorio, hasta 10; separados por coma, punto y coma, espacio o salto de línea) y **Nombre de la oficina** (opcional).
- Todos los correos del caso (recibido, aprobado con instrucciones de pago, rechazado, alerta de vencimiento) llegan a **esos correos**, **no** a quien lo digitó. Tampoco se le envía a quien digita el aviso de "caso nuevo".
- Cada oficina destinataria ve el caso en **Mis casos**, abre las instrucciones de pago, confirma el pago y edita el vencimiento. Quien no esté en la lista no lo ve.
- Si una Oficina ingresa su propio caso, el destinatario es ella misma (como antes).
- Se guarda en la columna **Correos Destino** de CASOS_CDT (se crea sola al re-ejecutar `inicializarSistema`; los casos anteriores usan su `Email Oficina`) y queda en la auditoría.

## Cambios del formulario y de los casos

- **País opcional y con autocompletado.** Se puede dejar vacío. Al escribir, la lista sugiere sin importar mayúsculas ni tildes (`mexico` → *México*, `espana` → *España*, `estados` → *Estados Unidos*); con Enter, Tab o clic se completa, y al salir del campo se corrige al nombre oficial. Un país que no esté en la lista también se acepta tal cual (la lista está en `PAISES`, Config.gs).
- **Formas de pago:** solo **Débito de cuenta** y **Efectivo**. *Transferencia* se eliminó (era lo mismo que débito); los casos viejos con "Débito" o "Transferencia" se muestran como *Débito de cuenta*.
- **Editar la fecha de vencimiento después de enviar.** En **Mis casos** (y en el panel de gestión) el detalle del caso trae *Editar fecha de vencimiento* mientras el caso esté **Pendiente o Aprobado**. La puede cambiar cualquier destinatario o gestor; no puede ser anterior a hoy. Se audita, se reinicia la alerta de 5 días para la nueva fecha y, si la cambia una oficina, se avisa a los gestores.
- **Instrucciones de Débito de cuenta** (pantalla que abre el correo de aprobación):
  1. *Nota débito a la cuenta de ahorros:* ubicar la cuenta, generar nota débito (ND) **concepto 18**, **contrapartida ingreso 25**, aplicarla por cada uno de los valores del caso (se listan retención requerida, ya pagada y diferencia).
  2. *Registro del egreso:* **Egreso 25 en efectivo** por el valor de la diferencia.
  3. *Cierre y soportes:* verificar comprobantes, guardar la referencia `REC-<caso>` y marcar el caso completado.
  Para cambiar la redacción, edita `pasosPago()` en `src/Cliente.html`.

## Correos: remitente noreply

Todos los correos salen con el nombre **AutoTrib | Impuestos Davivienda** y con la opción `noReply: true` de Apps Script, que usa una dirección genérica *noreply* para que no aparezca tu foto ni tu correo. Se configura en `APP.NOMBRE_REMITENTE` (Config.gs). Limitaciones: `noReply` solo funciona en **Google Workspace**; en una cuenta Gmail personal Google la ignora y el sistema reintenta el envío sin esa opción (saldrá con el correo de quien despliega). Los destinatarios no pueden responder.

## Imágenes de marca (por ID de Drive)

En la hoja **CONFIG** (o, alternativamente, en *Propiedades de script* del editor de Apps Script, con el mismo nombre del parámetro) pega el **ID** (o el enlace completo) de cada archivo de Google Drive; si queda vacío se usan el diseño rojo y triángulos por defecto.

| Parámetro en CONFIG | Dónde se ve |
|---|---|
| ID Imagen Logo | Cabecera, pantalla de carga y correos |
| ID Imagen Triángulos | Triángulos decorativos (cabecera, bienvenida, carga) |
| ID Imagen Fondo Bienvenida | Fondo de la tarjeta "Hola, ..." |
| ID Imagen Fondo Carga | Fondo de la pantalla que carga al abrir |

El ID es el texto entre `/d/` y `/view` del enlace del archivo. **Si no cargan: menú `AutoTrib → Diagnosticar imágenes`** (o ejecuta `diagnosticarImagenes` en el editor) y dice, imagen por imagen, qué leyó y por qué falló. Detalles: la cuenta que despliega la app debe poder abrir el archivo (los usuarios no necesitan permiso); las fotos pesadas (más de 700 KB) se reducen solas con la miniatura de Drive (máximo 2 MB tras reducir; PNG/JPG/SVG); se guardan en caché 6 horas, así que un cambio puede tardar en verse. Al actualizar el código, vuelve a autorizar los permisos (se agregó lectura de Drive) y ejecuta `inicializarSistema` otra vez: es seguro y solo agrega los parámetros nuevos.

## Instalación (5 archivos, ≈10 min)

**Todo lo que necesitas está en la carpeta `dist/`** (no uses `src/`, es el código fuente). Tiene exactamente 5 archivos:

| Archivo en `dist/` | Cómo crearlo en el editor de Apps Script |
|---|---|
| `Codigo.gs` | Pega todo su contenido en el archivo `Código.gs` que ya existe (borra lo que traía) |
| `Index.html` | `+` → HTML → nombre `Index` |
| `Estilos.html` | `+` → HTML → nombre `Estilos` |
| `Cliente.html` | `+` → HTML → nombre `Cliente` |
| `appsscript.json` | Configuración del proyecto → marca *Mostrar "appsscript.json"* → pega su contenido |

Si falta alguno aparece un error del tipo `... is not defined` o `No se encontró el archivo`. En el editor deben verse **exactamente** 4 archivos más el manifiesto: `Código.gs`, `Index`, `Estilos`, `Cliente`.

1. Crea un **Google Sheet** vacío y abre `Extensiones → Apps Script`.
2. Copia los 5 archivos de `dist/` como indica la tabla.
3. Ejecuta **`inicializarSistema`** y acepta los permisos (Sheets, correo, Drive, activadores; el manifiesto no fija permisos, Apps Script los detecta solo). Crea las 6 hojas, datos base y el trigger diario.
4. Hoja **ACCESOS**: deja a Leydi con rol Impuestos y ajusta tu nombre. Hoja **CONFIG**: tarifas, correos e imágenes.
5. `Implementar → Nueva implementación → Aplicación web`: ejecutar como **Yo**, acceso **Cualquier usuario de tu organización**.
6. Cada vez que cambies código: `Implementar → Administrar implementaciones → Editar → Nueva versión`.

*Con clasp:* `npm run build && clasp push --rootDir dist`.

## Para desarrolladores

`src/` es el código fuente (varios `.gs`). `npm run build` lo une en `dist/Codigo.gs` y copia el resto; **siempre ejecuta el build y sube `dist/`** después de editar `src/`. `tests/` prueba la lógica y la interfaz, `docs/` tiene el manual.

## Triggers (alertas de vencimiento)

`inicializarSistema()` crea el trigger `triggerDiarioAlertas` (todos los días ~8 AM, zona Bogotá). Para recrearlo: menú `AutoTrib → 2. Instalar alertas diarias` o ejecuta `instalarTriggerDiario()`. Verifica en `Activadores` (reloj) del editor de Apps Script. `AutoTrib → Ejecutar alertas ahora` fuerza una revisión.

Regla: se avisa **una vez por fecha de vencimiento** cuando faltan ≤ 5 días (`APP.DIAS_ALERTA` en Config.gs), para casos no rechazados ni pagados. Si la oficina cambia la fecha, se reinicia el aviso.

## Reglas de negocio

```
Rete4%     = Rendimientos × Tarifa Sistema (4 %)       ← se fija en la ingesta
Rete20%    = Rendimientos × Tarifa (20 % por defecto; Impuestos/Operativo pueden cambiarla 0–100 %)
Diferencia = Rete20% − Rete4%
Saldo Neto = Valor CDT − Rete20%
```
Con rendimientos de $5.000.000: 200.000 / 1.000.000 / 800.000 / saldo 4.000.000 (si el valor del CDT es igual a los rendimientos). Con tarifa 15 %: 750.000 / 550.000.

Estados: `Pendiente → Aprobado → Pagado` o `Pendiente → Rechazado`. Nunca se borran casos.

## Seguridad

- Solo correos activos en **ACCESOS**; el **rol se valida en el servidor en cada llamada** (la interfaz no es la barrera).
- Oficina solo ve y opera sus propios casos; solo `Operativo` e `Impuestos` aprueban/rechazan/ajustan tarifa; solo `Impuestos` y `Oficina` ingresan CDT.
- Auditoría en la hoja `AUDITORÍA`: timestamp, usuario, acción, caso y `campo: antes → después`.
- Texto que empieza por `= + - @` se neutraliza (inyección de fórmulas) y todo valor se escapa en correos y pantallas.
- Dominio opcional: `APP.VALIDAR_DOMINIO = true` en Config.gs restringe a `@dav.com.co`.
- Bloqueos (`LockService`) para IDs consecutivos y escrituras concurrentes.

## Pruebas

```bash
npm install            # solo para la prueba de UI (Playwright)
npm test               # 43 pruebas de lógica del servidor (roles, cálculo, correos, alertas)
npm run test:ui        # formulario, validación en vivo y panel en Chromium (desktop + móvil)
npm run manual         # regenera docs/Manual_Usuario_AutoTrib.pdf
```

## Notas y límites conocidos

- **Logo y triángulos:** no se incluyen activos oficiales; sube los tuyos a Drive y pon el ID en CONFIG (ver arriba). Sin imágenes se usa la marca tipográfica y triángulos CSS.
- **Formularios en correo:** Gmail no ejecuta formularios HTML; el botón "Editar datos" abre una pantalla de la propia aplicación (autenticada) con los campos editables.
- **Cuota de correo:** `MailApp` permite ~1.500 destinatarios/día en Workspace (100 en cuentas gratuitas).
- **Video demo** de 5 min: no se genera desde este repositorio.
