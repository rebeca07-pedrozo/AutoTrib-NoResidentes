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
    '<div style="font-size:12px;opacity:.9;margin-top:4px">AutoTrib · No Residentes</div></td></tr>' +
    '<tr><td style="padding:28px"><h2 style="margin:0 0 16px;color:' + COLORES.ROJO + ';font-size:20px">' + esc(titulo) + '</h2>' + cuerpo + '</td></tr>' +
    '<tr><td style="background:' + COLORES.GRIS_CLARO + ';padding:14px 28px;font-size:11px;color:' + COLORES.GRIS_OSCURO + '">Sistema: AutoTrib | Davivienda · Mensaje automático, no responder.</td></tr>' +
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
    name: 'AutoTrib | Davivienda'
  };
  if (logo) msg.inlineImages = { logo: logo };
  MailApp.sendEmail(msg);
}

function enviarConfirmacionIngesta(caso, usuario) {
  var datos = tablaDatos_([['Caso', caso.id], ['Cliente', caso.cliente], ['País', caso.pais],
    ['Rendimientos', pesos(caso.rendimientos)], ['Retención a cobrar', pesos(caso.diferencia)]]);
  enviar_(usuario.email, 'Caso ' + caso.id + ' recibido - En autorización', 'Caso ' + caso.id + ' enviado a autorización',
    '<p>Hola ' + esc(usuario.nombre) + ', recibimos tu caso. Te avisaremos cuando sea revisado.</p>' + datos);
  enviar_(correosPorRol(ROLES.OPERATIVO), 'Nuevo caso por autorizar: ' + caso.id, 'Nuevo caso pendiente',
    '<p>La oficina <b>' + esc(caso.oficina) + '</b> (' + esc(usuario.nombre) + ') ingresó un caso.</p>' + datos + boton_('Abrir panel de revisión', urlApp()));
}

function enviarInstruccionesPago(caso) {
  var url = urlApp() + '?page=pago&case=' + encodeURIComponent(caso.id);
  var datos = tablaDatos_([['Cliente', caso.cliente], ['Monto a cobrar', pesos(caso.diferencia)],
    ['Vencimiento', fechaLegible(caso.vencimiento)], ['Forma de pago', caso.formaPago]]);
  enviar_(caso.emailOficina, 'Caso #' + caso.id + ' Aprobado - Instrucciones de Pago', 'Caso ' + caso.id + ' aprobado',
    '<p>Hola ' + esc(caso.ingresadoPor) + ', tu caso <b>' + esc(caso.id) + '</b> fue <b style="color:' + COLORES.VERDE + '">APROBADO</b> por ' +
    esc(caso.aprobadoPor) + '.</p><p style="color:#666;font-size:13px">Datos del caso:</p>' + datos +
    (caso.notasLeydi ? '<p style="font-size:13px"><b>Notas:</b> ' + esc(caso.notasLeydi) + '</p>' : '') +
    boton_('Ver instrucciones paso a paso', url), 'Caso ' + caso.id + ' aprobado. Instrucciones: ' + url);
}

function enviarRechazo(caso) {
  enviar_(caso.emailOficina, 'Caso #' + caso.id + ' Rechazado', 'Caso ' + caso.id + ' rechazado',
    '<p>Hola ' + esc(caso.ingresadoPor) + ', tu caso <b>' + esc(caso.id) + '</b> (' + esc(caso.cliente) + ') fue <b style="color:' +
    COLORES.ROJO + '">RECHAZADO</b> por ' + esc(caso.aprobadoPor) + '.</p><p><b>Motivo:</b> ' + esc(caso.notasLeydi) +
    '</p><p>Puedes ingresar nuevamente el caso con los datos corregidos.</p>');
}

/** Avisa a Contabilidad: caso aprobado (listo para registro) o pago completado. */
function enviarAvisoContabilidad(caso, pagado) {
  var cfg = obtenerConfig();
  var para = correosPorRol(ROLES.CONTABILIDAD);
  if (!para.length && cfg.correoContabilidad) para = [cfg.correoContabilidad];
  enviar_(para, (pagado ? 'Pago completado: ' : 'Caso listo para registro: ') + caso.id,
    pagado ? 'Pago completado' : 'Caso listo para registro',
    '<p>Caso <b>' + esc(caso.id) + '</b> — ' + (pagado ? 'el pago fue confirmado por la oficina.' : 'aprobado por ' + esc(caso.aprobadoPor) + '.') + '</p>' +
    tablaDatos_([['Cliente', caso.cliente], ['País', caso.pais], ['Rete 20%', pesos(caso.rete20)], ['Rete 4% pagada', pesos(caso.rete4)],
      ['Diferencia cobrada', pesos(caso.diferencia)], ['Forma de pago', caso.formaPago]]) + boton_('Abrir AutoTrib', urlApp()));
}

function enviarAlertaVencimiento(caso, dias) {
  var urlEditar = urlApp() + '?page=alerta&case=' + encodeURIComponent(caso.id);
  enviar_(caso.emailOficina, 'Vencimiento en ' + dias + ' días - CDT #' + caso.id + ' ' + caso.cliente,
    'Tu CDT ' + caso.id + ' vence en ' + dias + ' día' + (dias === 1 ? '' : 's'),
    '<p>Hola ' + esc(caso.ingresadoPor) + ', revisa el estado actual:</p>' +
    tablaDatos_([['Cliente', caso.cliente], ['Monto', pesos(caso.valorCdt)], ['Vencimiento', fechaLegible(caso.vencimiento)],
      ['Forma de pago', caso.formaPago], ['Estado', caso.status]]) +
    '<p>Si necesitas cambiar algo:</p>' + boton_('Editar datos', urlEditar, COLORES.ROJO) +
    '<p>Si todo está correcto:</p>' + boton_('✓ Confirmar vencimiento', urlEditar + '&ok=1', COLORES.VERDE));
}

function enviarCambioAlerta(caso, detalle) {
  enviar_(correosPorRol(ROLES.OPERATIVO), 'Cambios en ' + caso.id + ' desde la alerta de vencimiento', 'Cambios en ' + caso.id,
    '<p>' + esc(caso.ingresadoPor) + ' actualizó el caso tras la alerta de vencimiento:</p><p style="background:' + COLORES.GRIS_CLARO +
    ';padding:12px;border-radius:8px">' + esc(detalle) + '</p>' + boton_('Abrir AutoTrib', urlApp()));
}
