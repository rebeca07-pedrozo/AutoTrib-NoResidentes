/**
 * Sheets.gs — Acceso a datos (CRUD) sobre Google Sheets.
 * No existe ninguna función de borrado: los casos solo cambian de estado.
 */

/** Devuelve el libro de trabajo (vinculado al script o por propiedad SPREADSHEET_ID). */
function libro() {
  var activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Sistema no inicializado. Ejecuta inicializarSistema().');
  return SpreadsheetApp.openById(id);
}

function hoja(nombre) {
  var h = libro().getSheetByName(nombre);
  if (!h) throw new Error('Falta la hoja ' + nombre + '. Ejecuta inicializarSistema().');
  return h;
}

/** Crea las pestañas base con cabeceras, formato y datos de ejemplo mínimos. */
function crearPestañas() {
  var wb = libro();
  var defs = [
    [HOJAS.CONFIG, ['Parámetro', 'Valor']],
    [HOJAS.ACCESOS, CABECERAS.ACCESOS],
    [HOJAS.CDT, CABECERAS.CDT],
    [HOJAS.LEASING, CABECERAS.LEASING],
    [HOJAS.ALERTAS, CABECERAS.ALERTAS],
    [HOJAS.AUDITORIA, CABECERAS.AUDITORIA],
    [HOJAS.ROLES, ['Rol', 'Quién lo tiene', 'Qué puede hacer']]
  ];
  defs.forEach(function (d) {
    var h = wb.getSheetByName(d[0]) || wb.insertSheet(d[0]);
    if (h.getLastRow() === 0) {
      h.getRange(1, 1, 1, d[1].length).setValues([d[1]])
        .setBackground(COLORES.AZUL).setFontColor(COLORES.BLANCO).setFontWeight('bold');
      h.setFrozenRows(1);
      h.autoResizeColumns(1, d[1].length);
    }
  });

  // CONFIG: agrega los parámetros que falten (seguro de re-ejecutar tras una actualización)
  var cfg = hoja(HOJAS.CONFIG);
  var existentes = cfg.getLastRow() > 1 ? cfg.getRange(2, 1, cfg.getLastRow() - 1, 1).getValues().map(function (f) { return String(f[0]).trim(); }) : [];
  var faltan = CONFIG_BASE.filter(function (c) { return existentes.indexOf(c[0]) < 0; });
  if (faltan.length) cfg.getRange(cfg.getLastRow() + 1, 1, faltan.length, 2).setValues(faltan.map(function (c) { return [c[0], c[1]]; }));
  cfg.setColumnWidth(1, 240);

  // ROLES: referencia para no olvidar qué hace cada rol
  var hr = hoja(HOJAS.ROLES);
  hr.getRange(2, 1, ROLES_DEFINICION.length, 3).setValues(ROLES_DEFINICION);
  hr.setColumnWidth(1, 120); hr.setColumnWidth(2, 380); hr.setColumnWidth(3, 620);

  var acc = hoja(HOJAS.ACCESOS);
  if (acc.getLastRow() < 2) {
    var yo = Session.getEffectiveUser().getEmail();
    acc.getRange(2, 1, 3, 5).setValues([
      [yo, 'Administrador (cambiar)', ROLES.OPERATIVO, 'Sí', 'Operaciones Tributarias'],
      ['leydi@dav.com.co', 'Leydi Bernal', ROLES.OPERATIVO, 'Sí', 'Operaciones Tributarias'],
      ['pepito@dav.com.co', 'Pepito García', ROLES.OFICINA, 'Sí', 'Bogotá Centro']
    ]);
  }

  acc.getRange(2, 3, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList([ROLES.OFICINA, ROLES.OPERATIVO, ROLES.CONTABILIDAD], true).setAllowInvalid(false).build());
  acc.getRange(2, 4, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Sí', 'No'], true).setAllowInvalid(false).build());
  acc.getRange(1, 3).setNote('Roles: Oficina (por defecto), Operativo (aprueba), Contabilidad (solo lectura). Ver hoja ROLES.');

  var fmtMoneda = '#,##0';
  var cdt = hoja(HOJAS.CDT);
  [6, 7, 8, 9, 10, 11].forEach(function (c) { cdt.getRange(2, c, 2000, 1).setNumberFormat(fmtMoneda); });
  [2, 12, 18, 23].forEach(function (c) { cdt.getRange(2, c, 2000, 1).setNumberFormat('dd/MM/yyyy'); });
  [HOJAS.CDT, HOJAS.AUDITORIA].forEach(function (n) {
    var p = hoja(n).protect();
    p.setDescription('Gestionada por AutoTrib');
    p.setWarningOnly(true);
  });
}

/* ------------------------------ Utilidades ------------------------------ */

/** Evita inyección de fórmulas: texto que empieza por = + - @ se guarda como texto. */
function limpiarTexto(valor, max) {
  var s = String(valor === null || valor === undefined ? '' : valor).replace(/[\u0000-\u001f]/g, ' ').trim();
  if (max) s = s.substring(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Date → 'yyyy-MM-dd' (vacío si no hay fecha). */
function fechaIso(d) {
  return d instanceof Date && !isNaN(d) ? Utilities.formatDate(d, APP.ZONA, 'yyyy-MM-dd') : '';
}

/** Date → 'dd/MM/yyyy HH:mm'. */
function fechaHora(d) {
  return d instanceof Date && !isNaN(d) ? Utilities.formatDate(d, APP.ZONA, 'dd/MM/yyyy HH:mm') : '';
}

function fechaCorta(d) {
  return d instanceof Date && !isNaN(d) ? Utilities.formatDate(d, APP.ZONA, 'dd/MM/yyyy') : '';
}

/** 'yyyy-MM-dd' → Date al mediodía (evita saltos por zona horaria). */
function parseFechaIso(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

function hoyIso() { return Utilities.formatDate(new Date(), APP.ZONA, 'yyyy-MM-dd'); }

/** Días enteros entre hoy y una fecha (negativo si ya pasó). */
function diasHasta(d) {
  var hoy = parseFechaIso(hoyIso());
  return Math.round((parseFechaIso(fechaIso(d)).getTime() - hoy.getTime()) / 86400000);
}

/* ------------------------------ CONFIG / ACCESOS ------------------------------ */

/** Lee CONFIG como objeto con claves internas; usa defaults si falta algo. */
function obtenerConfig() {
  var filas = hoja(HOJAS.CONFIG).getDataRange().getValues().slice(1);
  var porNombre = {};
  filas.forEach(function (f) { porNombre[String(f[0]).trim()] = f[1]; });
  var out = {};
  CONFIG_BASE.forEach(function (c) {
    var v = porNombre[c[0]];
    if (typeof c[1] === 'number') out[c[2]] = (v === undefined || v === '') ? c[1] : Number(v);
    else out[c[2]] = v === undefined ? c[1] : String(v).trim();   // texto vacío es válido (p. ej. sin imagen)
  });
  return out;
}

function esActivo_(v) {
  var a = String(v).trim().toLowerCase();
  return ['no', 'false', 'inactivo', '0'].indexOf(a) < 0;   // solo un "No" explícito bloquea
}

/** Busca un usuario en ACCESOS. Devuelve null si no existe o está bloqueado (activo = No). */
function obtenerAcceso(email) {
  if (!email) return null;
  var buscado = String(email).trim().toLowerCase();
  var filas = hoja(HOJAS.ACCESOS).getDataRange().getValues().slice(1);
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    if (String(f[0]).trim().toLowerCase() === buscado) {
      if (!esActivo_(f[3])) return null;
      var rol = normalizarRol(f[2]) || normalizarRol(obtenerConfig().rolDefecto);
      if (!rol) return null;
      return { email: buscado, nombre: String(f[1]).trim() || nombreDesdeCorreo_(buscado), rol: rol, oficina: String(f[4] || '').trim() };
    }
  }
  return null;
}

/**
 * Acceso para el login: si el correo no está en ACCESOS recibe el rol por defecto
 * (CONFIG → "Rol por defecto", normalmente Oficina) y se registra en ACCESOS para
 * que el administrador pueda ajustar nombre y oficina. Un "No" explícito sigue bloqueado.
 */
function obtenerOCrearAcceso(email) {
  var u = obtenerAcceso(email);
  if (u) return u;
  var buscado = String(email).trim().toLowerCase();
  var h = hoja(HOJAS.ACCESOS);
  var existe = h.getDataRange().getValues().slice(1).some(function (f) { return String(f[0]).trim().toLowerCase() === buscado; });
  if (existe) return null;                                   // bloqueado explícitamente
  var rol = normalizarRol(obtenerConfig().rolDefecto);
  if (!rol) return null;                                     // rol por defecto vacío = solo lista cerrada
  var nombre = nombreDesdeCorreo_(buscado);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    h.appendRow([buscado, nombre, rol, 'Sí', '']);
  } finally {
    lock.releaseLock();
  }
  registrarAuditoria(nombre, 'alta_automatica', '', 'Rol por defecto: ' + rol);
  return { email: buscado, nombre: nombre, rol: rol, oficina: '' };
}

/** 'maria.lopez@dav.com.co' → 'Maria Lopez'. */
function nombreDesdeCorreo_(email) {
  return String(email).split('@')[0].split(/[._\-]+/).filter(String)
    .map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join(' ') || email;
}

function normalizarRol(r) {
  var s = String(r).trim().toLowerCase();
  if (s === 'oficina') return ROLES.OFICINA;
  if (s === 'operativo') return ROLES.OPERATIVO;
  if (s === 'contabilidad') return ROLES.CONTABILIDAD;
  return null;
}

/** Correos de usuarios activos con un rol dado. */
function correosPorRol(rol) {
  return hoja(HOJAS.ACCESOS).getDataRange().getValues().slice(1)
    .filter(function (f) {
      return normalizarRol(f[2]) === rol && esActivo_(f[3]) && f[0];
    })
    .map(function (f) { return String(f[0]).trim(); });
}

/* ------------------------------ CASOS CDT ------------------------------ */

function filaACaso(fila) {
  var c = {};
  CDT_CLAVES.forEach(function (k, i) {
    var v = fila[i];
    c[k] = CDT_FECHAS.indexOf(k) >= 0 ? fechaIso(v) : (v instanceof Date ? fechaIso(v) : v);
  });
  if (fila[1] instanceof Date) c.fechaIngestaHora = fechaHora(fila[1]);
  return c;
}

function casoAFila(c) {
  return CDT_CLAVES.map(function (k) {
    var v = c[k];
    if (CDT_FECHAS.indexOf(k) >= 0) {
      if (v instanceof Date) return v;
      return parseFechaIso(v) || '';
    }
    return v === undefined || v === null ? '' : v;
  });
}

/** SELECT: todos los casos (opcionalmente filtrados por una función). */
function obtenerCasos(filtro) {
  var h = hoja(HOJAS.CDT);
  var n = h.getLastRow() - 1;
  if (n < 1) return [];
  var casos = h.getRange(2, 1, n, CDT_CLAVES.length).getValues()
    .filter(function (f) { return f[0]; }).map(filaACaso);
  return filtro ? casos.filter(filtro) : casos;
}

/** Devuelve { caso, fila } o null. */
function buscarCaso(id) {
  var h = hoja(HOJAS.CDT);
  var n = h.getLastRow() - 1;
  if (n < 1) return null;
  var ids = h.getRange(2, 1, n, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      return { caso: filaACaso(h.getRange(i + 2, 1, 1, CDT_CLAVES.length).getValues()[0]), fila: i + 2 };
    }
  }
  return null;
}

/** INSERT: asigna ID consecutivo (CDT001...) de forma atómica con un lock. */
function insertarCaso(datos) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var h = hoja(HOJAS.CDT);
    var n = h.getLastRow() - 1;
    var max = 0;
    if (n > 0) {
      h.getRange(2, 1, n, 1).getValues().forEach(function (r) {
        var m = /^CDT(\d+)$/.exec(String(r[0]));
        if (m) max = Math.max(max, Number(m[1]));
      });
    }
    datos.id = 'CDT' + ('000' + (max + 1)).slice(-Math.max(3, String(max + 1).length));
    datos.fechaIngesta = new Date();
    h.appendRow(casoAFila(datos));
    SpreadsheetApp.flush();
    return datos.id;
  } finally {
    lock.releaseLock();
  }
}

/**
 * UPDATE: aplica cambios a un caso y deja auditoría con valores antes/después.
 * @return {Object} el caso actualizado
 */
function actualizarCaso(id, cambios, usuario, accion) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var r = buscarCaso(id);
    if (!r) throw new Error('Caso no encontrado: ' + id);
    var antes = r.caso, nuevo = {}, detalle = [];
    CDT_CLAVES.forEach(function (k) { nuevo[k] = antes[k]; });
    Object.keys(cambios).forEach(function (k) {
      if (CDT_CLAVES.indexOf(k) < 0 || k === 'id') return;
      if (String(antes[k]) !== String(cambios[k])) {
        detalle.push(k + ': ' + antes[k] + ' → ' + cambios[k]);
        nuevo[k] = cambios[k];
      }
    });
    if (detalle.length) {
      hoja(HOJAS.CDT).getRange(r.fila, 1, 1, CDT_CLAVES.length).setValues([casoAFila(nuevo)]);
      registrarAuditoria(usuario, accion, id, detalle.join(' | '));
    }
    return nuevo;
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------ AUDITORÍA ------------------------------ */

function registrarAuditoria(usuario, accion, idCaso, detalle) {
  hoja(HOJAS.AUDITORIA).appendRow([new Date(), limpiarTexto(usuario, 120), accion, idCaso || '', limpiarTexto(detalle, 1500)]);
}

function obtenerAuditoria(idCaso) {
  var h = hoja(HOJAS.AUDITORIA);
  var n = h.getLastRow() - 1;
  if (n < 1) return [];
  return h.getRange(2, 1, n, 5).getValues()
    .filter(function (f) { return f[3] === idCaso; })
    .map(function (f) { return { fecha: fechaHora(f[0]), usuario: f[1], accion: f[2], detalle: f[4] }; });
}
