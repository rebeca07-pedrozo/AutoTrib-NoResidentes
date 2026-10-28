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
