/**
 * Leasing.gs — Cruce de cuentas de Leasing Habitacional.
 * Clave principal: # Recibo. El archivo Excel se lee en el navegador (SheetJS) y llega aquí como filas.
 * Si una fila no trae Valor Contabilidad, se busca el valor ya cargado en CASOS_LEASING con el mismo # Recibo.
 */

function numeroLeasing_(v) {
  if (typeof v === 'number') return v;
  var s = String(v === null || v === undefined ? '' : v).trim().replace(/[$\s]/g, '');
  if (!s) return NaN;
  // Formatos: 1.200.000,50 · 1,200,000.50 · 1200000
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');                       // 2.500.000
  else if (/,\d{1,2}$/.test(s) && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.'); // 1.200.000,50
  else s = s.replace(/,/g, '');
  return Number(s);
}

function leerLeasing_() {
  var h = hoja(HOJAS.LEASING);
  var n = h.getLastRow() - 1;
  return n < 1 ? [] : h.getRange(2, 1, n, LEASING_CLAVES.length).getValues().filter(function (f) { return f[2] !== ''; });
}

function leasingAObjeto_(f) {
  var o = {};
  LEASING_CLAVES.forEach(function (k, i) { o[k] = f[i] instanceof Date ? fechaHora(f[i]) : f[i]; });
  return o;
}

/**
 * Cruza las filas cargadas, guarda el resultado (upsert por # Recibo) y devuelve el reporte.
 * @param {Array<Object>} filas {cuenta, credito, recibo, valorOperativo, valorContabilidad}
 */
function cruzarDatos(filas) {
  var u = exigirUsuario_([ROLES.OPERATIVO]);
  if (!filas || !filas.length) throw new Error('El archivo no contiene registros.');
  if (filas.length > 5000) throw new Error('Máximo 5.000 registros por carga.');

  var existentes = leerLeasing_();
  var porRecibo = {};
  existentes.forEach(function (f, i) { porRecibo[String(f[2])] = { valorContabilidad: f[4], fila: i + 2 }; });

  var errores = [], vistos = {}, resultado = [];
  var lote = 'L' + Utilities.formatDate(new Date(), APP.ZONA, 'yyyyMMdd-HHmmssSSS'); // no parece fecha: Sheets no lo convierte
  filas.forEach(function (f, i) {
    var linea = i + 2;
    var recibo = limpiarTexto(f.recibo, 40);
    if (!recibo) { errores.push('Fila ' + linea + ': falta # Recibo'); return; }
    if (vistos[recibo]) { errores.push('Fila ' + linea + ': # Recibo duplicado (' + recibo + ')'); return; }
    vistos[recibo] = true;
    var op = numeroLeasing_(f.valorOperativo);
    if (isNaN(op)) { errores.push('Fila ' + linea + ': Valor Operativo no numérico'); return; }
    var cont = numeroLeasing_(f.valorContabilidad);
    if (isNaN(cont) && porRecibo[recibo]) cont = Number(porRecibo[recibo].valorContabilidad);
    if (isNaN(cont)) { errores.push('Fila ' + linea + ': sin Valor Contabilidad para ' + recibo); return; }
    var dif = Math.round((cont - op) * 100) / 100;
    var pct = op !== 0 ? Math.round(dif / op * 1000) / 10 : (dif === 0 ? 0 : 100);
    resultado.push([limpiarTexto(f.cuenta, 40), limpiarTexto(f.credito, 40), recibo, op, cont, dif, pct / 100,
      Math.abs(dif) < 0.5 ? 'Conciliado' : 'Discrepancia', lote, u.nombre, '']);
  });

  if (!resultado.length) throw new Error('Ningún registro válido. ' + errores.slice(0, 5).join('; '));

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var h = hoja(HOJAS.LEASING);
    var nuevos = [];
    resultado.forEach(function (r) {
      var prev = porRecibo[String(r[2])];
      if (prev) h.getRange(prev.fila, 1, 1, r.length).setValues([r]);
      else nuevos.push(r);
    });
    if (nuevos.length) h.getRange(h.getLastRow() + 1, 1, nuevos.length, nuevos[0].length).setValues(nuevos);
    h.getRange(2, 7, Math.max(h.getLastRow() - 1, 1), 1).setNumberFormat('0.0%');
    registrarAuditoria(u.nombre, 'cruce_leasing', '', resultado.length + ' registros, ' + errores.length + ' errores');
  } finally {
    lock.releaseLock();
  }
  return generarReporteDiscrepancias(lote, errores);
}

/** Reporte del último lote (o del lote indicado). */
function generarReporteDiscrepancias(lote, errores) {
  var todas = leerLeasing_().map(leasingAObjeto_);
  if (!lote && todas.length) {
    lote = todas.reduce(function (m, r) { return String(r.lote) > m ? String(r.lote) : m; }, '');
  }
  var delLote = todas.filter(function (r) { return r.lote === lote; });
  var conc = delLote.filter(function (r) { return r.estado === 'Conciliado'; }).length;
  return {
    lote: lote || '',
    fechaCarga: loteLegible_(lote),
    registros: delLote,
    errores: errores || [],
    resumen: {
      total: delLote.length, conciliados: conc, discrepancias: delLote.length - conc,
      exactitud: delLote.length ? Math.round(conc / delLote.length * 100) : 0
    }
  };
}

function obtenerLeasing() {
  exigirUsuario_([ROLES.OPERATIVO]);
  return generarReporteDiscrepancias();
}

/**
 * Cierra las discrepancias del último lote.
 * accion: 'incidente' | 'rectificar' | 'listo'
 */
function marcarLeasing(accion, nota) {
  var u = exigirUsuario_([ROLES.OPERATIVO]);
  var estados = { incidente: 'Incidente', rectificar: 'En rectificación', listo: 'Conciliado' };
  if (!estados[accion]) throw new Error('Acción no válida.');
  var rep = generarReporteDiscrepancias();
  if (!rep.registros.length) throw new Error('No hay cruces cargados.');
  var h = hoja(HOJAS.LEASING);
  var filas = leerLeasing_();
  var nota2 = limpiarTexto(nota, 500);
  var cambiadas = 0;
  filas.forEach(function (f, i) {
    if (f[8] === rep.lote) {
      if (f[7] === 'Discrepancia' || (accion !== 'listo' && f[7] !== 'Conciliado')) {
        h.getRange(i + 2, 8).setValue(estados[accion]);
        if (nota2) h.getRange(i + 2, 11).setValue(nota2);
        cambiadas++;
      }
    }
  });
  registrarAuditoria(u.nombre, 'leasing_' + accion, '', cambiadas + ' registros. ' + nota2);
  if (accion === 'incidente') {
    try { enviarIncidenteLeasing(rep.resumen, nota2, u.nombre); } catch (err) { Logger.log('Correo incidente: ' + err.message); }
  }
  return generarReporteDiscrepancias();
}

/** 'L20261020-143005123' → '20/10/2026 14:30'. */
function loteLegible_(lote) {
  var m = /^L(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/.exec(lote || '');
  return m ? m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5] : '';
}
