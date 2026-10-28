// AUTOGENERADO por build.js a partir de src/*.gs. No editar a mano: edita src/ y ejecuta npm run build.

// ===== Config.gs =====
/**
 * Config.gs — Constantes globales de AutoTrib-NoResidentes.
 * Los valores operativos (tarifas, correos) viven en la hoja CONFIG;
 * aquí solo están nombres de hojas, columnas, colores y listas fijas.
 */

var APP = {
  NOMBRE: 'AutoTrib - No Residentes',
  ZONA: 'America/Bogota',
  DOMINIO: 'dav.com.co',
  VALIDAR_DOMINIO: false,   // true = solo correos @dav.com.co
  DIAS_ALERTA: 5,           // días antes del vencimiento para avisar
  HORA_ALERTA: 8,           // hora diaria del trigger
  NOMBRE_REMITENTE: 'AutoTrib | Impuestos Davivienda'   // nombre visible en los correos (se envían como noreply)
};

var COLORES = {
  ROJO: '#E41F13',          // color predominante
  ROJO_OSCURO: '#A9130A',
  AZUL: '#003D82',          // acento secundario
  VERDE: '#1B5E20',
  BLANCO: '#FFFFFF',
  GRIS_CLARO: '#F5F5F5',
  GRIS_OSCURO: '#999999'
};

var HOJAS = {
  CONFIG: 'CONFIG',
  ACCESOS: 'ACCESOS',
  CDT: 'CASOS_CDT',
  ALERTAS: 'ALERTAS',
  AUDITORIA: 'AUDITORÍA',
  ROLES: 'ROLES'
};

var ROLES = { OFICINA: 'Oficina', OPERATIVO: 'Operativo', IMPUESTOS: 'Impuestos' };

/** Roles que gestionan casos (aprueban, ajustan tarifa, ven todo). */
var GESTORES = [ROLES.OPERATIVO, ROLES.IMPUESTOS];
/** Roles que pueden ingresar CDT. */
var INGRESANTES = [ROLES.OFICINA, ROLES.IMPUESTOS];

var ESTADOS = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  PAGADO: 'Pagado'
};

var FORMAS_PAGO = ['Débito de cuenta', 'Efectivo'];

/** Parámetros de la hoja CONFIG: [parámetro, valor por defecto, clave interna]. */
var CONFIG_BASE = [
  ['Tarifa No Residente (%)', 20, 'tarifaNoResidente'],
  ['Tarifa Sistema (%)', 4, 'tarifaSistema'],
  ['Monto Mínimo Retención', 84000, 'montoMinimo'],
  ['Correo Admin', 'admin@dav.com.co', 'correoAdmin'],
  ['Extensión Operativo', '2345', 'extOperativo'],
  ['Extensión Caja', '1234', 'extCaja'],
  ['Rol por defecto', 'Oficina', 'rolDefecto'],
  ['ID Imagen Logo', '', 'imgLogo'],
  ['ID Imagen Triángulos', '', 'imgTriangulos'],
  ['ID Imagen Fondo Bienvenida', '', 'imgBienvenida'],
  ['ID Imagen Fondo Carga', '', 'imgCarga']
];

/** Definición de roles (se vuelca a la hoja ROLES como referencia). */
var ROLES_DEFINICION = [
  ['Oficina', 'Por defecto para cualquier correo que no esté en ACCESOS con otro rol.',
   'Ingresar CDT (los correos le llegan a ella misma), ver solo los casos donde su correo es destinatario, ver instrucciones de pago, confirmar pago, editar la fecha de vencimiento.'],
  ['Operativo', 'Gestión sin ingreso. Se asigna a mano en ACCESOS.',
   'Panel de gestión: ver todos los casos, aprobar/rechazar (individual y lote), cambiar tarifa %, alertas, reportes. No ingresa CDT.'],
  ['Impuestos', 'Leydi Y Librado Bernal y el equipo de Impuestos. Se asigna a mano en ACCESOS.',
   'Las dos visuales: ingresar CDT en nombre de una o varias oficinas (indicando los correos destinatarios, para que las notificaciones lleguen a ellas y no a quien digita) y gestionarlos como Operativo.']
];

/** Cabeceras de cada hoja. En CASOS_CDT el orden coincide con CDT_CLAVES. */
var CABECERAS = {
  ACCESOS: ['email', 'nombre', 'rol', 'activo', 'oficina'],
  CDT: ['ID Caso', 'Fecha Ingesta', 'Cliente', 'ID Cliente', 'País', 'Valor CDT', 'Rendimientos',
        'Rete4%', 'Rete20%', 'Diferencia', 'Saldo Neto', 'Vencimiento', 'Forma Pago', 'Status',
        'Tarifa%', 'Notas Leydi', 'Aprobado Por', 'Fecha Aprobación', 'Oficina', 'Ingresado Por',
        'Email Oficina', 'Notas Oficina', 'Fecha Pago', 'Correos Destino'],
  ALERTAS: ['ID Caso', 'Fecha Vencimiento', 'Días para Vencer', 'Status'],
  AUDITORIA: ['Timestamp', 'Usuario', 'Acción', 'ID Caso', 'Detalle']
};

var CDT_CLAVES = ['id', 'fechaIngesta', 'cliente', 'idCliente', 'pais', 'valorCdt', 'rendimientos',
  'rete4', 'rete20', 'diferencia', 'saldoNeto', 'vencimiento', 'formaPago', 'status',
  'tarifa', 'notasLeydi', 'aprobadoPor', 'fechaAprobacion', 'oficina', 'ingresadoPor',
  'emailOficina', 'notasOficina', 'fechaPago', 'correosDestino'];

var CDT_FECHAS = ['fechaIngesta', 'vencimiento', 'fechaAprobacion', 'fechaPago'];

var ALERTAS_CLAVES = ['id', 'vencimiento', 'dias', 'status'];

var PAISES = ['Alemania', 'Arabia Saudita', 'Argentina', 'Aruba', 'Australia', 'Austria', 'Bahamas',
  'Barbados', 'Bélgica', 'Belice', 'Bolivia', 'Brasil', 'Canadá', 'Chile', 'China', 'Colombia',
  'Corea del Sur', 'Costa Rica', 'Croacia', 'Cuba', 'Curazao', 'Dinamarca', 'Ecuador', 'Egipto',
  'El Salvador', 'Emiratos Árabes Unidos', 'Eslovaquia', 'Eslovenia', 'España', 'Estados Unidos',
  'Estonia', 'Filipinas', 'Finlandia', 'Francia', 'Grecia', 'Guatemala', 'Haití', 'Honduras',
  'Hong Kong', 'Hungría', 'India', 'Indonesia', 'Irlanda', 'Islas Caimán', 'Islas Vírgenes Británicas',
  'Israel', 'Italia', 'Jamaica', 'Japón', 'Letonia', 'Lituania', 'Luxemburgo', 'Malasia', 'Malta',
  'México', 'Mónaco', 'Nicaragua', 'Noruega', 'Nueva Zelanda', 'Países Bajos', 'Panamá', 'Paraguay',
  'Perú', 'Polonia', 'Portugal', 'Puerto Rico', 'Reino Unido', 'República Checa',
  'República Dominicana', 'Rumania', 'Rusia', 'Singapur', 'Sudáfrica', 'Suecia', 'Suiza',
  'Tailandia', 'Taiwán', 'Trinidad y Tobago', 'Turquía', 'Ucrania', 'Uruguay', 'Venezuela', 'Vietnam'];


// ===== Code.gs =====
/**
 * Code.gs — Punto de entrada, autenticación y API que consume la interfaz
 * (todas las funciones públicas sin guion bajo final se invocan con google.script.run).
 * Cada función vuelve a validar usuario y rol en el servidor: la interfaz nunca es la barrera.
 */

/* ------------------------------ Arranque ------------------------------ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  return crearHTML({
    vista: ['pago', 'alerta'].indexOf(p.page) >= 0 ? p.page : '',
    caso: /^CDT\d{3,}$/.test(p.case || '') ? p.case : '',
    confirmar: p.ok === '1'
  });
}

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('AutoTrib')
      .addItem('1. Inicializar sistema', 'inicializarSistema')
      .addItem('2. Instalar alertas diarias (8 AM)', 'instalarTriggerDiario')
      .addItem('Diagnosticar imágenes', 'diagnosticarImagenes')
      .addItem('Ejecutar alertas ahora', 'verificarVencimientos')
      .addToUi();
  } catch (err) { /* no hay UI (ejecución standalone) */ }
}

/** Crea las hojas, guarda el ID del libro y programa las alertas. Ejecutar una vez. */
function inicializarSistema() {
  if (!SpreadsheetApp.getActiveSpreadsheet()) {
    var props = PropertiesService.getScriptProperties();
    if (!props.getProperty('SPREADSHEET_ID')) {
      props.setProperty('SPREADSHEET_ID', SpreadsheetApp.create('AutoTrib-NoResidentes (datos)').getId());
    }
  }
  crearPestañas();
  instalarTriggerDiario();
  Logger.log('Sistema inicializado. Libro: ' + libro().getUrl());
}

/** Resuelve y valida al usuario activo. Lanza error si no tiene acceso o su rol no aplica. */
function exigirUsuario_(rolesPermitidos) {
  var email = Session.getActiveUser().getEmail();
  if (!email) throw new Error('No se pudo identificar tu correo. Abre la aplicación con tu cuenta corporativa.');
  if (APP.VALIDAR_DOMINIO && !new RegExp('@' + APP.DOMINIO.replace(/\./g, '\\.') + '$', 'i').test(email)) {
    throw new Error('Solo se permiten correos @' + APP.DOMINIO);
  }
  var u = obtenerOCrearAcceso(email);
  if (!u) throw new Error('Acceso denegado. Contacta al administrador.');
  if (rolesPermitidos && rolesPermitidos.indexOf(u.rol) < 0) throw new Error('Tu rol no permite esta acción.');
  return u;
}

/** Valida acceso y devuelve datos de sesión. Primera llamada de la interfaz. */
function iniciarSesion() {
  var email = Session.getActiveUser().getEmail();
  try {
    var u = exigirUsuario_();
    var cfg = obtenerConfig();
    return {
      ok: true,
      usuario: u,
      config: { tarifaNoResidente: cfg.tarifaNoResidente, tarifaSistema: cfg.tarifaSistema, montoMinimo: cfg.montoMinimo },
      paises: PAISES,
      formasPago: FORMAS_PAGO,
      hoy: hoyIso(),
      resumen: obtenerResumen()
    };
  } catch (err) {
    return { ok: false, mensaje: err.message, email: email || '' };
  }
}

/* ------------------------------ Cálculos ------------------------------ */

/** Rete4% / Rete20% / Diferencia / Saldo Neto (pesos enteros). */
function calcularRetenciones(rendimientos, valorCdt, tarifa, tarifaSistema) {
  var rete4 = Math.round(rendimientos * tarifaSistema / 100);
  var rete20 = Math.round(rendimientos * tarifa / 100);
  return { rete4: rete4, rete20: rete20, diferencia: rete20 - rete4, saldoNeto: valorCdt - rete20 };
}

/* ------------------------------ Resumen ------------------------------ */

function obtenerResumen() {
  var u = exigirUsuario_();
  var hoy = hoyIso();
  var esGestor = GESTORES.indexOf(u.rol) >= 0;
  var recientes = function (lista) { return lista.slice(-5).reverse().map(function (c) { return { id: c.id, cliente: c.cliente, status: c.status }; }); };
  var estados = function (lista) {
    return {
      pendientes: lista.filter(function (c) { return c.status === ESTADOS.PENDIENTE; }).length,
      aprobados: lista.filter(function (c) { return c.status === ESTADOS.APROBADO || c.status === ESTADOS.PAGADO; }).length,
      total: lista.length
    };
  };
  var propios = obtenerCasos(function (c) { return casoEsDe_(c, u); });
  if (!esGestor) {
    var r = estados(propios); r.recientes = recientes(propios); return r;
  }
  var todos = obtenerCasos();
  var g = estados(todos);
  g.hoy = todos.filter(function (c) { return c.fechaAprobacion === hoy; }).length;
  g.recientes = recientes(propios);
  return g;
}

/** ¿El caso es "mío"? Oficina: soy destinatario. Impuestos: lo ingresé yo o soy destinatario. */
function casoEsDe_(c, u) {
  return esDestinatario_(c, u.email) || (u.rol === ROLES.IMPUESTOS && c.ingresadoPor === u.nombre);
}

/* ------------------------------ Ingesta (Oficina) ------------------------------ */

function guardarCaso(d) {
  var u = exigirUsuario_(INGRESANTES);
  var cfg = obtenerConfig();
  d = d || {};

  var cliente = limpiarTexto(d.cliente, 120);
  var idCliente = limpiarTexto(d.idCliente, 20);
  var pais = normalizarPais_(d.pais);               // opcional, texto libre
  var valorCdt = Math.round(Number(d.valorCdt));
  var rendimientos = Math.round(Number(d.rendimientos));
  var formaPago = FORMAS_PAGO.filter(function (f) { return f === d.formaPago; })[0];
  var venc = d.vencimiento ? parseFechaIso(d.vencimiento) : null;

  if (cliente.length < 3) throw new Error('El nombre del cliente es obligatorio.');
  if (!/^[A-Za-z0-9\-]{4,20}$/.test(idCliente)) throw new Error('El ID del cliente no es válido.');
  if (!(valorCdt > 0) || !(rendimientos > 0)) throw new Error('Valor CDT y rendimientos deben ser mayores a cero.');
  if (rendimientos > valorCdt) throw new Error('Los rendimientos no pueden superar el valor del CDT.');
  if (!formaPago) throw new Error('Selecciona la forma de pago.');
  if (d.vencimiento && (!venc || d.vencimiento < hoyIso())) throw new Error('La fecha de vencimiento no es válida.');

  // Destinatarios: una Oficina se notifica a sí misma; Impuestos indica a qué oficinas les llega todo.
  var destinos, oficina;
  if (u.rol === ROLES.IMPUESTOS) {
    var p = parsearCorreos_(d.correosDestino);
    if (p.invalidos.length) throw new Error('Correos no válidos: ' + p.invalidos.join(', '));
    if (!p.validos.length) throw new Error('Indica al menos un correo de oficina que recibirá las notificaciones.');
    if (p.validos.length > 10) throw new Error('Máximo 10 correos destinatarios.');
    destinos = p.validos;
    oficina = limpiarTexto(d.oficina, 80);
  } else {
    destinos = [u.email];
    oficina = u.oficina;
  }

  var calc = calcularRetenciones(rendimientos, valorCdt, cfg.tarifaNoResidente, cfg.tarifaSistema);
  var caso = {
    cliente: cliente, idCliente: idCliente, pais: pais, valorCdt: valorCdt, rendimientos: rendimientos,
    rete4: calc.rete4, rete20: calc.rete20, diferencia: calc.diferencia, saldoNeto: calc.saldoNeto,
    vencimiento: d.vencimiento || '', formaPago: formaPago, status: ESTADOS.PENDIENTE,
    tarifa: cfg.tarifaNoResidente, notasLeydi: '', aprobadoPor: '', fechaAprobacion: '',
    oficina: oficina, ingresadoPor: u.nombre, emailOficina: destinos[0], notasOficina: '', fechaPago: '',
    correosDestino: destinos.join(', ')
  };
  var id = insertarCaso(caso);
  registrarAuditoria(u.nombre, 'ingesta', id, 'Datos ingesta completos' + (u.rol === ROLES.IMPUESTOS ? '. Destinatarios: ' + caso.correosDestino : ''));
  caso.id = id;
  try { enviarConfirmacionIngesta(caso, u); } catch (err) { Logger.log('Correo ingesta: ' + err.message); }
  return { id: id, calculo: calc };
}

/* ------------------------------ Consultas ------------------------------ */

/** Casos propios (Oficina: donde es destinataria; Impuestos: los que ingresó o donde es destinataria). */
function listarMisCasos() {
  var u = exigirUsuario_(INGRESANTES);
  return obtenerCasos(function (c) { return casoEsDe_(c, u); }).reverse();
}

/** Todos los casos, con filtros opcionales. Solo roles de gestión. */
function listarCasos(filtros) {
  exigirUsuario_(GESTORES);
  var f = filtros || {};
  return obtenerCasos(function (c) {
    if (f.estado && c.status !== f.estado) return false;
    if (f.oficina && c.oficina !== f.oficina) return false;
    if (f.desde && c.fechaIngesta < f.desde) return false;
    if (f.hasta && c.fechaIngesta > f.hasta) return false;
    return true;
  }).reverse();
}

/** Detalle + auditoría. Oficina solo ve lo propio. */
function obtenerDetalleCaso(id) {
  var u = exigirUsuario_();
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  return { caso: r.caso, auditoria: obtenerAuditoria(id), config: { tarifaSistema: obtenerConfig().tarifaSistema }, gestor: GESTORES.indexOf(u.rol) >= 0 };
}

function verificarPropiedad_(u, caso) {
  if (u.rol === ROLES.OFICINA && !esDestinatario_(caso, u.email)) throw new Error('Este caso no pertenece a tu oficina.');
}

/* ------------------------------ Autorización (Operativo e Impuestos) ------------------------------ */

/**
 * accion: 'guardar' (solo notas/ajustes), 'aprobar' o 'rechazar'.
 * datos: { tarifa, formaPago, vencimiento, notas }
 */
function resolverCaso(id, accion, datos) {
  var u = exigirUsuario_(GESTORES);
  var d = datos || {};
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  var c = r.caso;
  if (c.status !== ESTADOS.PENDIENTE) throw new Error('Este caso ya fue procesado (' + c.status + ').');

  var tarifa = Number(d.tarifa);
  if (!(tarifa >= 0 && tarifa <= 100)) throw new Error('La tarifa debe estar entre 0 y 100.');
  var formaPago = FORMAS_PAGO.filter(function (f) { return f === d.formaPago; })[0];
  if (!formaPago) throw new Error('Selecciona la forma de pago.');
  if (d.vencimiento && (!parseFechaIso(d.vencimiento))) throw new Error('Fecha de vencimiento inválida.');
  var notas = limpiarTexto(d.notas, 1000);
  if (accion === 'rechazar' && !notas) throw new Error('Indica el motivo del rechazo en las notas.');
  if (['guardar', 'aprobar', 'rechazar'].indexOf(accion) < 0) throw new Error('Acción no válida.');

  // Rete4% ya fue pagada en la ingesta: se conserva; solo cambia la retención requerida.
  var calc = calcularRetenciones(c.rendimientos, c.valorCdt, tarifa, 0);
  var cambios = {
    tarifa: tarifa, rete20: calc.rete20, diferencia: calc.rete20 - c.rete4,
    saldoNeto: calc.saldoNeto, formaPago: formaPago, vencimiento: d.vencimiento || '', notasLeydi: notas
  };
  var tarifaCambio = Number(c.tarifa) !== tarifa;

  var nombreAccion = accion === 'aprobar' ? 'aprobacion' : accion === 'rechazar' ? 'rechazo' : (tarifaCambio ? 'cambio_rete' : 'ajuste');
  if (accion === 'aprobar') { cambios.status = ESTADOS.APROBADO; }
  if (accion === 'rechazar') { cambios.status = ESTADOS.RECHAZADO; }
  if (accion !== 'guardar') { cambios.aprobadoPor = u.nombre; cambios.fechaAprobacion = hoyIso(); }

  var nuevo = actualizarCaso(id, cambios, u.nombre, nombreAccion);
  try {
    if (accion === 'aprobar') enviarInstruccionesPago(nuevo);
    if (accion === 'rechazar') enviarRechazo(nuevo);
  } catch (err) { Logger.log('Correo resolución: ' + err.message); }
  return nuevo;
}

/** Aprueba varios casos con la tarifa y forma de pago actuales. Devuelve conteos. */
function aprobarLote(ids) {
  exigirUsuario_(GESTORES);
  if (!ids || !ids.length) throw new Error('Selecciona al menos un caso.');
  if (ids.length > 50) throw new Error('Máximo 50 casos por lote.');
  var ok = 0, fallos = [];
  ids.forEach(function (id) {
    try {
      var r = buscarCaso(id);
      if (!r) throw new Error('no existe');
      resolverCaso(id, 'aprobar', { tarifa: r.caso.tarifa, formaPago: r.caso.formaPago, vencimiento: r.caso.vencimiento, notas: r.caso.notasLeydi });
      ok++;
    } catch (err) { fallos.push(id + ': ' + err.message); }
  });
  return { aprobados: ok, fallos: fallos };
}

/* ------------------------------ Pago ------------------------------ */

/** Datos para la página de instrucciones de pago. */
function obtenerInstrucciones(id) {
  var u = exigirUsuario_();
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  if (r.caso.status !== ESTADOS.APROBADO && r.caso.status !== ESTADOS.PAGADO) {
    throw new Error('El caso aún no está aprobado (estado: ' + r.caso.status + ').');
  }
  var cfg = obtenerConfig();
  var op = correosPorRol(ROLES.IMPUESTOS)[0] || correosPorRol(ROLES.OPERATIVO)[0] || cfg.correoAdmin;
  var acc = obtenerAcceso(op);
  return {
    caso: r.caso,
    contacto: { nombre: acc ? acc.nombre : 'Impuestos', email: op, ext: cfg.extOperativo, extCaja: cfg.extCaja }
  };
}

function confirmarPago(id) {
  var u = exigirUsuario_();
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  if (r.caso.status !== ESTADOS.APROBADO) throw new Error('Solo se puede confirmar el pago de un caso aprobado.');
  var nuevo = actualizarCaso(id, { status: ESTADOS.PAGADO, fechaPago: hoyIso() }, u.nombre, 'pago_completado');
  try { enviarAvisoPago(nuevo, u); } catch (err) { Logger.log('Correo pago: ' + err.message); }
  return nuevo;
}

/* ------------------------------ Fecha de vencimiento ------------------------------ */

/**
 * Cambia la fecha de vencimiento de un caso ya enviado (la oficina puede no conocerla al ingresar).
 * Permitido a destinatarios y gestores mientras el caso esté Pendiente o Aprobado.
 */
function actualizarVencimiento(id, fecha) {
  var u = exigirUsuario_();
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  if (r.caso.status !== ESTADOS.PENDIENTE && r.caso.status !== ESTADOS.APROBADO) throw new Error('Este caso ya no admite cambios de fecha (' + r.caso.status + ').');
  if (!parseFechaIso(fecha) || fecha < hoyIso()) throw new Error('La fecha de vencimiento debe ser válida y no puede ser anterior a hoy.');
  var anterior = r.caso.vencimiento;
  var nuevo = actualizarCaso(id, { vencimiento: fecha }, u.nombre, 'edicion_vencimiento');
  actualizarEstadoAlerta_(id, 'Modificada', diasHasta(parseFechaIso(fecha)), fecha);
  if (GESTORES.indexOf(u.rol) < 0) {
    try { enviarCambioAlerta(nuevo, 'Vencimiento: ' + fechaLegible(anterior) + ' → ' + fechaLegible(fecha) + ' (cambio de ' + u.nombre + ')'); }
    catch (err) { Logger.log('Correo vencimiento: ' + err.message); }
  }
  return nuevo;
}

/* ------------------------------ Página ------------------------------ */

/** Incluye el contenido de otro archivo HTML del proyecto dentro de una plantilla. */
function include(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

/** Genera la página principal (SPA) inyectando parámetros de deep-link. */
function crearHTML(params) {
  var t = HtmlService.createTemplateFromFile('Index');
  t.arranque = JSON.stringify(params || {}).replace(/</g, '\\u003c');
  t.imagenes = JSON.stringify(imagenesIniciales_()).replace(/</g, '\\u003c');
  t.baseUrl = ScriptApp.getService().getUrl();
  return t.evaluate()
    .setTitle(APP.NOMBRE + ' | Davivienda')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}


// ===== Sheets.gs =====
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
    [HOJAS.ALERTAS, CABECERAS.ALERTAS],
    [HOJAS.AUDITORIA, CABECERAS.AUDITORIA],
    [HOJAS.ROLES, ['Rol', 'Quién lo tiene', 'Qué puede hacer']]
  ];
  defs.forEach(function (d) {
    var h = wb.getSheetByName(d[0]) || wb.insertSheet(d[0]);
    if (h.getLastRow() === 0) {
      h.getRange(1, 1, 1, d[1].length).setValues([d[1]])
        .setBackground(COLORES.ROJO).setFontColor(COLORES.BLANCO).setFontWeight('bold');
      h.setFrozenRows(1);
      h.autoResizeColumns(1, d[1].length);
    }
  });

  // CASOS_CDT: agrega columnas nuevas a hojas creadas con versiones anteriores
  var hc = hoja(HOJAS.CDT), nCab = hc.getLastColumn();
  if (nCab < CABECERAS.CDT.length) {
    hc.getRange(1, nCab + 1, 1, CABECERAS.CDT.length - nCab).setValues([CABECERAS.CDT.slice(nCab)])
      .setBackground(COLORES.ROJO).setFontColor(COLORES.BLANCO).setFontWeight('bold');
  }

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
      [yo, 'Administrador (cambiar)', ROLES.IMPUESTOS, 'Sí', 'Impuestos'],
      ['leydi@dav.com.co', 'Leydi Y Librado Bernal', ROLES.IMPUESTOS, 'Sí', 'Impuestos'],
      ['pepito@dav.com.co', 'Pepito García', ROLES.OFICINA, 'Sí', 'Bogotá Centro']
    ]);
  }

  acc.getRange(2, 3, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList([ROLES.OFICINA, ROLES.OPERATIVO, ROLES.IMPUESTOS], true).setAllowInvalid(false).build());
  acc.getRange(2, 4, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Sí', 'No'], true).setAllowInvalid(false).build());
  acc.getRange(1, 3).setNote('Roles: Oficina (por defecto), Operativo (gestiona), Impuestos (ingresa y gestiona). Ver hoja ROLES.');

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
    // Las propiedades de script (con el mismo nombre del parámetro) completan lo que esté vacío en CONFIG
    if ((v === undefined || v === '') && typeof c[1] !== 'number') {
      var p = PropertiesService.getScriptProperties().getProperty(c[0]);
      if (p) v = p;
    }
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
  if (s === 'impuestos') return ROLES.IMPUESTOS;
  return null;
}

/** Correos de los usuarios activos que gestionan casos (Operativo e Impuestos), sin repetir. */
function correosGestores_() {
  var out = [];
  GESTORES.forEach(function (r) { correosPorRol(r).forEach(function (e) { if (out.indexOf(e.toLowerCase()) < 0) out.push(e.toLowerCase()); }); });
  return out;
}

/** Correos destinatarios de un caso (oficinas a las que llegan los avisos). */
function correosDelCaso_(caso) {
  return String(caso.correosDestino || caso.emailOficina || '').split(/[;,\s]+/).filter(Boolean).map(function (e) { return e.toLowerCase(); });
}

function esDestinatario_(caso, email) {
  return correosDelCaso_(caso).indexOf(String(email).toLowerCase()) >= 0;
}

/** Separa una lista de correos escrita libremente (coma, punto y coma, espacio o salto de línea). */
function parsearCorreos_(valor) {
  var lista = Array.isArray(valor) ? valor : String(valor || '').split(/[;,\s]+/);
  var validos = [], invalidos = [];
  lista.map(function (e) { return String(e).trim().toLowerCase(); }).filter(Boolean).forEach(function (e) {
    var ok = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/.test(e) &&
      (!APP.VALIDAR_DOMINIO || new RegExp('@' + APP.DOMINIO.replace(/\./g, '\\.') + '$').test(e));
    if (!ok) invalidos.push(e); else if (validos.indexOf(e) < 0) validos.push(e);
  });
  return { validos: validos, invalidos: invalidos };
}

/** Minúsculas y sin tildes, para comparar textos ("méxico" = "Mexico"). */
function sinTildes_(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** País: si coincide (sin importar mayúsculas ni tildes) con la lista se usa el nombre oficial; si no, el texto tal cual. */
function normalizarPais_(texto) {
  var t = sinTildes_(texto);
  if (!t) return '';
  var hallado = PAISES.filter(function (p) { return sinTildes_(p) === t; })[0];
  return hallado || limpiarTexto(texto, 60);
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
  if (c.formaPago === 'Débito' || c.formaPago === 'Transferencia') c.formaPago = 'Débito de cuenta';   // datos de versiones anteriores
  if (!c.correosDestino) c.correosDestino = c.emailOficina;                                          // casos anteriores: solo la oficina que los ingresó
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


// ===== Imagenes.gs =====
/**
 * Imagenes.gs — Imágenes de marca tomadas de Google Drive por ID (hoja CONFIG).
 * Parámetros: ID Imagen Logo, ID Imagen Triángulos, ID Imagen Fondo Bienvenida, ID Imagen Fondo Carga.
 * El ID es el texto entre /d/ y /view en el enlace del archivo de Drive. La cuenta que despliega
 * la aplicación debe poder ver el archivo; los usuarios finales no necesitan permiso.
 * Las imágenes se convierten a data URI y se guardan en caché 6 h (recomendado: menos de 500 KB cada una).
 */

var IMG_MAX_BYTES = 2 * 1024 * 1024;
var IMG_CACHE_SEG = 21600;
var IMG_TROZO = 90000;      // CacheService admite ~100 KB por clave
var logoBlobMemo_ = null;

function idDriveValido_(id) { return /^[A-Za-z0-9_\-]{10,120}$/.test(String(id || '').trim()); }

/** ID de Drive o enlace completo → ID limpio. */
function limpiarIdDrive_(v) {
  var s = String(v || '').trim();
  var m = /\/d\/([A-Za-z0-9_\-]+)/.exec(s) || /[?&]id=([A-Za-z0-9_\-]+)/.exec(s);
  return m ? m[1] : s;
}

var IMG_REDUCIR_DESDE = 700 * 1024;   // por encima de esto se pide una versión reducida a Drive

/** Versión reducida (miniatura) de Drive a 'ancho' px. Null si no se puede. */
function miniaturaDrive_(id, ancho) {
  try {
    var cab = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
    var r = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '?fields=thumbnailLink&supportsAllDrives=true', { headers: cab, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return null;
    var link = JSON.parse(r.getContentText()).thumbnailLink;
    if (!link) return null;
    var r2 = UrlFetchApp.fetch(link.replace(/=s\d+(-c)?$/, '=s' + ancho), { headers: cab, muteHttpExceptions: true });
    return r2.getResponseCode() === 200 ? r2.getBlob() : null;
  } catch (err) {
    Logger.log('Miniatura ' + id + ': ' + err.message);
    return null;
  }
}

/** Lee la imagen de Drive. Devuelve { blob, motivo }: blob null y motivo explicando el fallo. */
function leerImagen_(id, ancho) {
  id = limpiarIdDrive_(id);
  if (!idDriveValido_(id)) return { blob: null, motivo: 'ID vacío o con formato inválido' };
  var archivo;
  try { archivo = DriveApp.getFileById(id); }
  catch (err) { return { blob: null, motivo: 'Drive no permite abrir el archivo (¿falta autorizar Drive o el archivo no está compartido con quien despliega?): ' + err.message }; }
  var blob;
  try { blob = archivo.getBlob(); }
  catch (err) { return { blob: null, motivo: 'No se pudo leer el archivo: ' + err.message }; }
  var tipo = String(blob.getContentType() || '');
  if (tipo.indexOf('image/') !== 0) return { blob: null, motivo: 'El archivo no es una imagen (es ' + tipo + ')' };
  var peso = blob.getBytes().length;
  if (peso > IMG_REDUCIR_DESDE && tipo !== 'image/svg+xml') {
    var mini = miniaturaDrive_(id, ancho || 1600);
    if (mini) return { blob: mini, motivo: 'OK (reducida de ' + Math.round(peso / 1024) + ' KB)' };
  }
  if (peso > IMG_MAX_BYTES) return { blob: null, motivo: 'Pesa ' + (peso / 1048576).toFixed(1) + ' MB y no se pudo reducir (máximo 2 MB)' };
  return { blob: blob, motivo: 'OK (' + Math.round(peso / 1024) + ' KB)' };
}

function blobImagen_(id, ancho) {
  var r = leerImagen_(id, ancho);
  if (!r.blob) Logger.log('Imagen ' + id + ': ' + r.motivo);
  return r.blob;
}

/** Devuelve 'data:image/...;base64,...' o '' si no hay ID o no se pudo leer. */
function imagenDataUri_(id, ancho) {
  id = limpiarIdDrive_(id);
  if (!idDriveValido_(id)) return '';
  var clave = 'img_' + id + '_' + (ancho || 0);
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(clave + '_n'));
  if (n) {
    var partes = [];
    for (var i = 0; i < n; i++) partes.push(cache.get(clave + '_' + i));
    if (partes.every(function (p) { return p !== null; })) return partes.join('');
  }
  var blob = blobImagen_(id, ancho);
  if (!blob) return '';
  var uri = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  try {
    var trozos = {}, k = 0;
    for (var p = 0; p < uri.length; p += IMG_TROZO) trozos[clave + '_' + (k++)] = uri.substring(p, p + IMG_TROZO);
    trozos[clave + '_n'] = String(k);
    cache.putAll(trozos, IMG_CACHE_SEG);
  } catch (err) { Logger.log('Caché de imagen: ' + err.message); }
  return uri;
}

/**
 * DIAGNÓSTICO: ejecútalo desde el editor (o menú AutoTrib → Diagnosticar imágenes).
 * Dice, para cada imagen, qué ID leyó y por qué cargó o no. No usa la caché.
 */
function diagnosticarImagenes() {
  var cfg = obtenerConfig();
  var lista = [['Logo', cfg.imgLogo, 600], ['Triángulos', cfg.imgTriangulos, 1000], ['Fondo Bienvenida', cfg.imgBienvenida, 1600], ['Fondo Carga', cfg.imgCarga, 1600]];
  var lineas = lista.map(function (x) {
    if (!String(x[1] || '').trim()) return x[0] + ': SIN ID (revisa CONFIG o Propiedades de script)';
    var r = leerImagen_(x[1], x[2]);
    return x[0] + ' [' + limpiarIdDrive_(x[1]) + ']: ' + r.motivo;
  });
  var texto = lineas.join('\n');
  Logger.log(texto);
  try { SpreadsheetApp.getUi().alert('Diagnóstico de imágenes', texto, SpreadsheetApp.getUi().ButtonSet.OK); } catch (err) { /* sin UI */ }
  return texto;
}

/** Imágenes necesarias para pintar la primera pantalla (se incrustan en el HTML). */
function imagenesIniciales_() {
  try {
    var cfg = obtenerConfig();
    return { logo: imagenDataUri_(cfg.imgLogo, 600), carga: imagenDataUri_(cfg.imgCarga, 1600) };
  } catch (err) {
    return { logo: '', carga: '' };
  }
}

/** Imágenes decorativas; la interfaz las pide después de iniciar sesión. */
function obtenerImagenes() {
  exigirUsuario_();
  var cfg = obtenerConfig();
  return { triangulos: imagenDataUri_(cfg.imgTriangulos, 1000), bienvenida: imagenDataUri_(cfg.imgBienvenida, 1600) };
}

/** Logo como blob para insertarlo en correos (cid:logo). Null si no hay logo configurado. */
function blobLogo_() {
  if (logoBlobMemo_ !== null) return logoBlobMemo_ || null;
  var b = null;
  try { b = blobImagen_(obtenerConfig().imgLogo, 600); } catch (err) { b = null; }
  logoBlobMemo_ = b || false;
  return b;
}


// ===== Email.gs =====
/**
 * Email.gs — Correos HTML con branding Davivienda (MailApp).
 * Todo valor dinámico pasa por esc() antes de entrar a la plantilla.
 */

function esc(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function pesos(n) {
  return '$ ' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fechaLegible(iso) {
  var d = parseFechaIso(iso);
  return d ? fechaCorta(d) : 'Sin fecha';
}

function urlApp() { return ScriptApp.getService().getUrl(); }

/** Envoltorio común: cabecera roja con marca (logo de Drive si está configurado), cuerpo y pie. */
function plantillasHTML(titulo, cuerpo, conLogo) {
  var logo = conLogo
    ? '<img src="cid:logo" alt="Davivienda" height="38" style="vertical-align:middle;max-width:220px">'
    : '<span style="font-size:22px;font-weight:bold;letter-spacing:1px">davivienda</span>';
  return '<!DOCTYPE html><html><body style="margin:0;background:' + COLORES.GRIS_CLARO + ';font-family:Arial,Helvetica,sans-serif;color:#222">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.08)">' +
    '<tr><td style="background:' + COLORES.ROJO + ';color:#fff;padding:22px 28px;border-bottom:4px solid ' + COLORES.ROJO_OSCURO + '">' + logo +
    '<div style="font-size:12px;opacity:.9;margin-top:4px">AutoTrib · Impuestos</div></td></tr>' +
    '<tr><td style="padding:28px"><h2 style="margin:0 0 16px;color:' + COLORES.ROJO + ';font-size:20px">' + esc(titulo) + '</h2>' + cuerpo + '</td></tr>' +
    '<tr><td style="background:' + COLORES.GRIS_CLARO + ';padding:14px 28px;font-size:11px;color:' + COLORES.GRIS_OSCURO + '">AutoTrib | Impuestos Davivienda · Mensaje automático, por favor no responder.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function filaDato_(k, v) {
  return '<tr><td style="padding:7px 12px;color:#666;font-size:13px;border-bottom:1px solid #eee">' + esc(k) +
    '</td><td style="padding:7px 12px;font-weight:bold;font-size:14px;border-bottom:1px solid #eee;text-align:right">' + esc(v) + '</td></tr>';
}

function tablaDatos_(filas) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + COLORES.GRIS_CLARO +
    ';border-radius:8px;margin:12px 0 20px">' + filas.map(function (f) { return filaDato_(f[0], f[1]); }).join('') + '</table>';
}

function boton_(texto, url, color) {
  return '<a href="' + esc(url) + '" style="display:inline-block;background:' + (color || COLORES.ROJO) +
    ';color:#fff;text-decoration:none;font-weight:bold;font-size:14px;text-transform:uppercase;padding:13px 24px;border-radius:8px;margin:4px 6px 4px 0">' + esc(texto) + '</a>';
}

function enviar_(para, asunto, titulo, cuerpoHtml, textoPlano) {
  if (!para || (Array.isArray(para) && !para.length)) return;
  var logo = blobLogo_();
  var msg = {
    to: Array.isArray(para) ? para.join(',') : para,
    subject: asunto,
    body: textoPlano || asunto,
    htmlBody: plantillasHTML(titulo, cuerpoHtml, !!logo),
    name: APP.NOMBRE_REMITENTE,
    noReply: true            // remitente genérico noreply: no muestra la foto ni el correo de quien despliega
  };
  if (logo) msg.inlineImages = { logo: logo };
  try {
    MailApp.sendEmail(msg);
  } catch (err) {
    // noReply solo existe en Google Workspace; en una cuenta Gmail personal se reintenta sin esa opción
    delete msg.noReply;
    MailApp.sendEmail(msg);
  }
}

/** Confirmación a las oficinas destinatarias y aviso de caso nuevo a los gestores (sin repetir a quien digitó). */
function enviarConfirmacionIngesta(caso, usuario) {
  var datos = tablaDatos_([['Caso', caso.id], ['Cliente', caso.cliente], ['País', caso.pais || 'No indicado'],
    ['Rendimientos', pesos(caso.rendimientos)], ['Retención a cobrar', pesos(caso.diferencia)]]);
  enviar_(correosDelCaso_(caso), 'Caso ' + caso.id + ' recibido - En autorización', 'Caso ' + caso.id + ' enviado a autorización',
    '<p>Recibimos el caso de <b>' + esc(caso.cliente) + '</b> para la oficina <b>' + esc(caso.oficina || 'indicada') + '</b>. Les avisaremos cuando sea revisado.</p>' + datos +
    '<p style="font-size:13px;color:#666">Mientras no conozcan la fecha de vencimiento, pueden agregarla después desde "Mis casos".</p>' + boton_('Ver mis casos', urlApp()));
  var gestores = correosGestores_().filter(function (m) { return m !== String(usuario.email).toLowerCase(); });
  enviar_(gestores, 'Nuevo caso por autorizar: ' + caso.id, 'Nuevo caso pendiente',
    '<p>La oficina <b>' + esc(caso.oficina || '-') + '</b> (ingresado por ' + esc(usuario.nombre) + ') tiene un caso nuevo.</p>' + datos + boton_('Abrir panel de revisión', urlApp()));
}

function enviarInstruccionesPago(caso) {
  var url = urlApp() + '?page=pago&case=' + encodeURIComponent(caso.id);
  var datos = tablaDatos_([['Cliente', caso.cliente], ['Monto a cobrar', pesos(caso.diferencia)],
    ['Vencimiento', fechaLegible(caso.vencimiento)], ['Forma de pago', caso.formaPago]]);
  enviar_(correosDelCaso_(caso), 'Caso #' + caso.id + ' Aprobado - Instrucciones de Pago', 'Caso ' + caso.id + ' aprobado',
    '<p>El caso <b>' + esc(caso.id) + '</b> fue <b style="color:' + COLORES.VERDE + '">APROBADO</b> por ' +
    esc(caso.aprobadoPor) + '.</p><p style="color:#666;font-size:13px">Datos del caso:</p>' + datos +
    (caso.notasLeydi ? '<p style="font-size:13px"><b>Notas:</b> ' + esc(caso.notasLeydi) + '</p>' : '') +
    boton_('Ver instrucciones paso a paso', url), 'Caso ' + caso.id + ' aprobado. Instrucciones: ' + url);
}

function enviarRechazo(caso) {
  enviar_(correosDelCaso_(caso), 'Caso #' + caso.id + ' Rechazado', 'Caso ' + caso.id + ' rechazado',
    '<p>El caso <b>' + esc(caso.id) + '</b> (' + esc(caso.cliente) + ') fue <b style="color:' +
    COLORES.ROJO + '">RECHAZADO</b> por ' + esc(caso.aprobadoPor) + '.</p><p><b>Motivo:</b> ' + esc(caso.notasLeydi) +
    '</p><p>Pueden ingresar nuevamente el caso con los datos corregidos.</p>');
}

/** Avisa a los gestores que la oficina confirmó el pago. */
function enviarAvisoPago(caso, usuario) {
  var para = correosGestores_().filter(function (m) { return !usuario || m !== String(usuario.email).toLowerCase(); });
  enviar_(para, 'Pago completado: ' + caso.id, 'Pago completado',
    '<p>Caso <b>' + esc(caso.id) + '</b>: el pago fue confirmado' + (usuario ? ' por ' + esc(usuario.nombre) : '') + '.</p>' +
    tablaDatos_([['Cliente', caso.cliente], ['Oficina', caso.oficina || '-'], ['Rete 20%', pesos(caso.rete20)], ['Rete 4% pagada', pesos(caso.rete4)],
      ['Diferencia cobrada', pesos(caso.diferencia)], ['Forma de pago', caso.formaPago]]) + boton_('Abrir AutoTrib', urlApp()));
}

function enviarAlertaVencimiento(caso, dias) {
  var urlEditar = urlApp() + '?page=alerta&case=' + encodeURIComponent(caso.id);
  enviar_(correosDelCaso_(caso), 'Vencimiento en ' + dias + ' días - CDT #' + caso.id + ' ' + caso.cliente,
    'Tu CDT ' + caso.id + ' vence en ' + dias + ' día' + (dias === 1 ? '' : 's'),
    '<p>Revisen el estado actual del caso:</p>' +
    tablaDatos_([['Cliente', caso.cliente], ['Monto', pesos(caso.valorCdt)], ['Vencimiento', fechaLegible(caso.vencimiento)],
      ['Forma de pago', caso.formaPago], ['Estado', caso.status]]) +
    '<p>Si necesitas cambiar algo:</p>' + boton_('Editar datos', urlEditar, COLORES.ROJO) +
    '<p>Si todo está correcto:</p>' + boton_('✓ Confirmar vencimiento', urlEditar + '&ok=1', COLORES.VERDE));
}

function enviarCambioAlerta(caso, detalle) {
  enviar_(correosGestores_(), 'Cambios en ' + caso.id + ' desde la alerta de vencimiento', 'Cambios en ' + caso.id,
    '<p>' + 'Se actualizó el caso:</p><p style="background:' + COLORES.GRIS_CLARO +
    ';padding:12px;border-radius:8px">' + esc(detalle) + '</p>' + boton_('Abrir AutoTrib', urlApp()));
}


// ===== Alertas.gs =====
/**
 * Alertas.gs — Alertas de vencimiento (trigger diario 8 AM) y edición desde el enlace del correo.
 */

/** Programa el trigger diario. Seguro de repetir (reemplaza el anterior). */
function instalarTriggerDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'triggerDiarioAlertas') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('triggerDiarioAlertas').timeBased().everyDays(1).atHour(APP.HORA_ALERTA).inTimezone(APP.ZONA).create();
}

function triggerDiarioAlertas() { verificarVencimientos(); }

/**
 * Recorre los casos con vencimiento próximo, envía el aviso una sola vez por fecha
 * y mantiene la hoja ALERTAS al día. Devuelve cuántos avisos envió.
 */
function verificarVencimientos() {
  var h = hoja(HOJAS.ALERTAS);
  var n = h.getLastRow() - 1;
  var filas = n > 0 ? h.getRange(2, 1, n, 4).getValues() : [];
  var indice = {};
  filas.forEach(function (f, i) { indice[f[0]] = { fila: i + 2, venc: fechaIso(f[1]), status: f[3] }; });

  var enviados = 0;
  obtenerCasos(function (c) {
    return c.vencimiento && c.status !== ESTADOS.RECHAZADO && c.status !== ESTADOS.PAGADO;
  }).forEach(function (c) {
    var dias = diasHasta(parseFechaIso(c.vencimiento));
    if (dias < 0 || dias > APP.DIAS_ALERTA) return;
    var previa = indice[c.id];
    var yaEnviada = previa && previa.venc === c.vencimiento && ['Enviada', 'Confirmada', 'Modificada'].indexOf(previa.status) >= 0;
    var status = yaEnviada ? previa.status : 'Pendiente';
    if (!yaEnviada) {
      try { enviarAlertaVencimiento(c, dias); status = 'Enviada'; enviados++; }
      catch (err) { Logger.log('Alerta ' + c.id + ': ' + err.message); }
    }
    var fila = [c.id, parseFechaIso(c.vencimiento), dias, status];
    if (previa) h.getRange(previa.fila, 1, 1, 4).setValues([fila]);
    else h.appendRow(fila);
    if (!yaEnviada && status === 'Enviada') registrarAuditoria('Sistema', 'alerta_enviada', c.id, 'Faltan ' + dias + ' días');
  });
  return enviados;
}

/** Lista de alertas para el panel de gestión (con días recalculados). */
function listarAlertas() {
  exigirUsuario_(GESTORES);
  var h = hoja(HOJAS.ALERTAS);
  var n = h.getLastRow() - 1;
  if (n < 1) return [];
  return h.getRange(2, 1, n, 4).getValues().filter(function (f) { return f[0]; }).map(function (f) {
    var c = buscarCaso(f[0]);
    return { id: f[0], vencimiento: fechaIso(f[1]), dias: f[1] instanceof Date ? diasHasta(f[1]) : f[2], status: f[3],
      cliente: c ? c.caso.cliente : '', oficina: c ? c.caso.oficina : '' };
  });
}

function actualizarEstadoAlerta_(id, status, dias, venc) {
  var h = hoja(HOJAS.ALERTAS);
  var n = h.getLastRow() - 1;
  if (n < 1) return;
  var ids = h.getRange(2, 1, n, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      h.getRange(i + 2, 2, 1, 3).setValues([[parseFechaIso(venc) || '', dias, status]]);
      return;
    }
  }
}

/** Datos del caso para la pantalla de alerta. */
function obtenerAlertaCaso(id) {
  var u = exigirUsuario_();
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  return { caso: r.caso, dias: r.caso.vencimiento ? diasHasta(parseFechaIso(r.caso.vencimiento)) : null, hoy: hoyIso() };
}

/** La oficina edita fecha, forma de pago o notas. Notifica a los gestores y actualiza ALERTAS. */
function guardarAlertaCaso(id, d) {
  var u = exigirUsuario_();
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  if (r.caso.status === ESTADOS.RECHAZADO || r.caso.status === ESTADOS.PAGADO) throw new Error('Este caso ya no admite cambios.');
  d = d || {};
  if (!d.vencimiento || !parseFechaIso(d.vencimiento) || d.vencimiento < hoyIso()) throw new Error('Fecha de vencimiento inválida.');
  var formaPago = FORMAS_PAGO.filter(function (f) { return f === d.formaPago; })[0];
  if (!formaPago) throw new Error('Selecciona la forma de pago.');
  var nota = limpiarTexto(d.notas, 500);
  var cambios = { vencimiento: d.vencimiento, formaPago: formaPago, notasOficina: nota };
  var nuevo = actualizarCaso(id, cambios, u.nombre, 'edicion_alerta');
  actualizarEstadoAlerta_(id, 'Modificada', diasHasta(parseFechaIso(d.vencimiento)), d.vencimiento);
  var detalle = 'Vencimiento: ' + fechaLegible(d.vencimiento) + ' · Pago: ' + formaPago + (nota ? ' · Notas: ' + nota : '');
  try { enviarCambioAlerta(nuevo, detalle); } catch (err) { Logger.log('Correo alerta: ' + err.message); }
  return nuevo;
}

function confirmarVencimientoCaso(id) {
  var u = exigirUsuario_();
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  actualizarEstadoAlerta_(id, 'Confirmada', r.caso.vencimiento ? diasHasta(parseFechaIso(r.caso.vencimiento)) : '', r.caso.vencimiento);
  registrarAuditoria(u.nombre, 'confirma_vencimiento', id, 'Vencimiento confirmado: ' + fechaLegible(r.caso.vencimiento));
  return true;
}
