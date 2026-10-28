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
