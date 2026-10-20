# 🏦 AutoTrib - No Residentes

Aplicación web (Google Apps Script + Google Sheets + Gmail) que automatiza el cálculo y la autorización de retenciones CDT para clientes no residentes en Banco Davivienda.

| Actor | Rol en ACCESOS | Qué hace |
|---|---|---|
| Subdirectores de oficina | `Oficina` | Ingresan el CDT; el sistema calcula Rete 4 % / Rete 20 % / diferencia / saldo neto en vivo |
| Leydi Bernal | `Operativo` | Revisa, ajusta la tarifa %, aprueba/rechaza (individual o por lote), cruce Leasing, alertas, reportes |
| Contabilidad | `Contabilidad` | Solo lectura de casos aprobados/pagados para registro |

## Estructura

```
src/
├── appsscript.json   manifiesto (zona America/Bogota, web app DOMAIN / USER_DEPLOYING)
├── Config.gs         constantes, colores, cabeceras de hojas, países
├── Code.gs           doGet, inicializarSistema, autenticación, API (ingesta, aprobación, pagos)
├── Sheets.gs         CRUD sobre Sheets + auditoría (no existe función de borrado)
├── Email.gs          correos HTML con branding
├── Alertas.gs        trigger diario 8 AM + edición/confirmación desde el enlace del correo
├── Leasing.gs        cruce por # Recibo, reporte de discrepancias, cierre del lote
├── UI.gs             include() para ensamblar la interfaz
├── Index.html        contenedor de la SPA
├── Estilos.html      CSS (azul #003D82, rojo #E41F13, responsivo)
└── Cliente.html      pantallas y validación en tiempo real
tests/                pruebas del servidor (Node, Sheets simulado) y de UI (Playwright)
docs/                 manual de usuario (PDF/MD)
```

## Instalación en otro Google Workspace (≈10 min)

1. Crea un **Google Sheet** vacío (ej. `AutoTrib-NoResidentes`). `Extensiones → Apps Script`.
2. Copia cada archivo de `src/` al proyecto (`.gs` como script, `.html` como HTML con el mismo nombre sin extensión). En `Configuración del proyecto` marca **Mostrar "appsscript.json"** y pega el de `src/`.
   *Alternativa con [clasp](https://github.com/google/clasp):* `clasp login && clasp create --type sheets --rootDir src && clasp push`.
3. Ejecuta **`inicializarSistema`** (o el menú `AutoTrib → 1. Inicializar sistema` al recargar el Sheet) y acepta los permisos. Esto crea las 6 hojas, datos base y el trigger diario.
4. Hoja **ACCESOS**: reemplaza los usuarios de ejemplo por los reales (`email | nombre | rol | activo | oficina`). Roles: `Oficina`, `Operativo`, `Contabilidad`; activo: `Sí`.
5. Hoja **CONFIG**: ajusta tarifas, `Correo Admin`, `Correo Contabilidad` y extensiones telefónicas.
6. `Implementar → Nueva implementación → Aplicación web`:
   - Ejecutar como: **Yo** (propietario).
   - Quién tiene acceso: **Cualquier usuario de tu organización** (necesario para que `Session.getActiveUser()` devuelva el correo del visitante).
7. Comparte la URL `/exec` con los usuarios. Los enlaces de los correos usan esa misma URL automáticamente.

> Cada vez que cambies código: `Implementar → Administrar implementaciones → Editar → Nueva versión`, para que los usuarios vean el cambio con la misma URL.

## Triggers (alertas de vencimiento)

`inicializarSistema()` crea el trigger `triggerDiarioAlertas` (todos los días ~8 AM, zona Bogotá). Para recrearlo: menú `AutoTrib → 2. Instalar alertas diarias` o ejecuta `instalarTriggerDiario()`. Verifica en `Activadores` (reloj) del editor de Apps Script. `AutoTrib → Ejecutar alertas ahora` fuerza una revisión.

Regla: se avisa **una vez por fecha de vencimiento** cuando faltan ≤ 5 días (`APP.DIAS_ALERTA` en Config.gs), para casos no rechazados ni pagados. Si la oficina cambia la fecha, se reinicia el aviso.

## Reglas de negocio

```
Rete4%     = Rendimientos × Tarifa Sistema (4 %)       ← se fija en la ingesta
Rete20%    = Rendimientos × Tarifa (20 % por defecto; Leydi puede cambiarla 0–100 %)
Diferencia = Rete20% − Rete4%
Saldo Neto = Valor CDT − Rete20%
```
Con rendimientos de $5.000.000: 200.000 / 1.000.000 / 800.000 / saldo 4.000.000 (si el valor del CDT es igual a los rendimientos). Con tarifa 15 %: 750.000 / 550.000.

Estados: `Pendiente → Aprobado → Pagado` o `Pendiente → Rechazado`. Nunca se borran casos.

## Seguridad

- Solo correos activos en **ACCESOS**; el **rol se valida en el servidor en cada llamada** (la interfaz no es la barrera).
- Oficina solo ve y opera sus propios casos; solo `Operativo` aprueba/rechaza/ajusta tarifa; `Contabilidad` solo ve aprobados/pagados.
- Auditoría en la hoja `AUDITORÍA`: timestamp, usuario, acción, caso y `campo: antes → después`.
- Texto que empieza por `= + - @` se neutraliza (inyección de fórmulas) y todo valor se escapa en correos y pantallas.
- Dominio opcional: `APP.VALIDAR_DOMINIO = true` en Config.gs restringe a `@dav.com.co`.
- Bloqueos (`LockService`) para IDs consecutivos y escrituras concurrentes.

## Pruebas

```bash
npm install            # solo para la prueba de UI (Playwright)
npm test               # 24 pruebas de lógica del servidor (roles, cálculo, correos, alertas, leasing)
npm run test:ui        # formulario, validación en vivo y panel en Chromium (desktop + móvil)
npm run manual         # regenera docs/Manual_Usuario_AutoTrib.pdf
```

## Notas y límites conocidos

- **Logo:** se usa una marca tipográfica (🏦 DAVIVIENDA) porque no se incluyen activos oficiales. Para el logo real en correos define `APP.LOGO_URL` (URL pública) en Config.gs; en la interfaz cambia el bloque `.logo-marca` de `Cliente.html`.
- **Formularios en correo:** Gmail no ejecuta formularios HTML; el botón "Editar datos" abre una pantalla de la propia aplicación (autenticada) con los campos editables.
- **Excel de Leasing:** se lee en el navegador con SheetJS (cdnjs). Acepta `.xlsx/.xls/.csv`. Si el archivo no trae `Valor Contabilidad`, se usa el ya cargado para ese `# Recibo`.
- **Cuota de correo:** `MailApp` permite ~1.500 destinatarios/día en Workspace (100 en cuentas gratuitas).
- **Video demo** de 5 min: no se genera desde este repositorio.
