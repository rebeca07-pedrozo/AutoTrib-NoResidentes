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

/** Lista de alertas para el panel Operativo (con días recalculados). */
function listarAlertas() {
  exigirUsuario_([ROLES.OPERATIVO]);
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
  var u = exigirUsuario_([ROLES.OFICINA, ROLES.OPERATIVO]);
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  return { caso: r.caso, dias: r.caso.vencimiento ? diasHasta(parseFechaIso(r.caso.vencimiento)) : null, hoy: hoyIso() };
}

/** La oficina edita fecha, forma de pago o notas. Notifica a Operativo y actualiza ALERTAS. */
function guardarAlertaCaso(id, d) {
  var u = exigirUsuario_([ROLES.OFICINA, ROLES.OPERATIVO]);
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
  var u = exigirUsuario_([ROLES.OFICINA, ROLES.OPERATIVO]);
  var r = buscarCaso(id);
  if (!r) throw new Error('Caso no encontrado.');
  verificarPropiedad_(u, r.caso);
  actualizarEstadoAlerta_(id, 'Confirmada', r.caso.vencimiento ? diasHasta(parseFechaIso(r.caso.vencimiento)) : '', r.caso.vencimiento);
  registrarAuditoria(u.nombre, 'confirma_vencimiento', id, 'Vencimiento confirmado: ' + fechaLegible(r.caso.vencimiento));
  return true;
}
