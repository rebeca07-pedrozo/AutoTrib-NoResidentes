const assert = require('assert');
const { crearEntorno } = require('./mock');
const E = crearEntorno();
const c = E.ctx;
let pasadas = 0;
function t(nombre, fn) { try { fn(); pasadas++; console.log('  ✓', nombre); } catch (e) { console.error('  ✗', nombre, '\n   ', e.message); process.exitCode = 1; } }
function esperar() { const f = Date.now() + 3; while (Date.now() < f); } // lotes distintos entre cargas consecutivas
function como(email) { E.estado.email = email; }
function sinErrores(fn, texto) { assert.throws(fn, texto); }

c.inicializarSistema();
console.log('Servidor');

t('crea las 7 hojas (incluye ROLES)', () => assert.deepStrictEqual(Object.keys(E.hojas).sort(), ['ACCESOS', 'ALERTAS', 'AUDITORÍA', 'CASOS_CDT', 'CASOS_LEASING', 'CONFIG', 'ROLES'].sort()));
t('validación de dominio (opcional) bloquea correos externos', () => { c.APP.VALIDAR_DOMINIO = true; como('x@otra.com'); assert.strictEqual(c.iniciarSesion().ok, false); c.APP.VALIDAR_DOMINIO = false; });
t('usuario inactivo no entra', () => { E.hojas.ACCESOS.appendRow(['inactivo@dav.com.co', 'Ina', 'Oficina', 'No', '']); como('inactivo@dav.com.co'); assert.strictEqual(c.iniciarSesion().ok, false); });
t('Oficina entra y recibe rol', () => { como('pepito@dav.com.co'); const r = c.iniciarSesion(); assert.ok(r.ok); assert.strictEqual(r.usuario.rol, 'Oficina'); });

const base = { cliente: 'Juan Pérez', idCliente: '123456', pais: 'colombia', valorCdt: 5000000, rendimientos: 5000000, formaPago: 'Débito', vencimiento: '' };
let id;
t('cálculo del ejemplo (rend 5M → 200K / 1M / 800K / 4M)', () => {
  const r = c.calcularRetenciones(5000000, 5000000, 20, 4);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r)), { rete4: 200000, rete20: 1000000, diferencia: 800000, saldoNeto: 4000000 });
  const r15 = c.calcularRetenciones(5000000, 5000000, 15, 4);
  assert.strictEqual(r15.rete20, 750000); assert.strictEqual(r15.diferencia, 550000);
});
t('Oficina guarda caso → CDT001 + correos', () => {
  const r = c.guardarCaso(base); id = r.id; assert.strictEqual(id, 'CDT001');
  assert.strictEqual(r.calculo.diferencia, 800000);
  assert.ok(E.correos.length >= 2);
  assert.ok(E.hojas['AUDITORÍA'].getLastRow() >= 2);
});
t('validaciones del servidor', () => {
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { cliente: 'a' })), /nombre/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { pais: 'Narnia' })), /país/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { rendimientos: 6000000 })), /superar/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { formaPago: 'Cheque' })), /forma de pago/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { vencimiento: '2020-01-01' })), /vencimiento/);
});
t('inyección de fórmulas neutralizada', () => {
  const r = c.guardarCaso(Object.assign({}, base, { cliente: '=HYPERLINK("x")' }));
  assert.ok(String(c.buscarCaso(r.id).caso.cliente).startsWith("'="));
});
t('Oficina no puede aprobar ni listar todo', () => {
  sinErrores(() => c.resolverCaso(id, 'aprobar', {}), /rol/);
  sinErrores(() => c.listarCasos({}), /rol/);
});
t('Oficina de otra sucursal no ve el caso', () => {
  E.hojas.ACCESOS.appendRow(['otra@dav.com.co', 'Otra', 'Oficina', 'Sí', 'Cali']); como('otra@dav.com.co');
  sinErrores(() => c.obtenerDetalleCaso(id), /no pertenece/);
  assert.strictEqual(c.listarMisCasos().length, 0);
});
t('Leydi cambia tarifa, rechaza sin notas falla', () => {
  como('leydi@dav.com.co');
  sinErrores(() => c.resolverCaso(id, 'rechazar', { tarifa: 20, formaPago: 'Débito' }), /motivo/);
  sinErrores(() => c.resolverCaso(id, 'aprobar', { tarifa: 120, formaPago: 'Débito' }), /tarifa/);
});
t('Leydi aprueba con tarifa 15% → recalcula, audita, envía instrucciones', () => {
  const antes = E.correos.length;
  const n = c.resolverCaso(id, 'aprobar', { tarifa: 15, formaPago: 'Transferencia', vencimiento: '', notas: 'Bien' });
  assert.strictEqual(n.status, 'Aprobado'); assert.strictEqual(n.rete20, 750000); assert.strictEqual(n.diferencia, 550000);
  assert.strictEqual(n.saldoNeto, 4250000); assert.strictEqual(n.aprobadoPor, 'Leydi Bernal');
  const nuevos = E.correos.slice(antes);
  assert.ok(nuevos.some(m => m.to === 'pepito@dav.com.co' && /Aprobado - Instrucciones de Pago/.test(m.subject) && /page=pago&amp;case=CDT001/.test(m.htmlBody)));
  const aud = c.obtenerAuditoria(id).map(a => a.accion);
  assert.ok(aud.includes('aprobacion') && aud.includes('ingesta'));
  assert.ok(c.obtenerAuditoria(id).some(a => /tarifa: 20 → 15/.test(a.detalle)));
});
t('no se puede reprocesar un caso aprobado', () => sinErrores(() => c.resolverCaso(id, 'aprobar', { tarifa: 20, formaPago: 'Débito' }), /ya fue procesado/));
t('Oficina dueña ve instrucciones y confirma pago; otra no', () => {
  como('otra@dav.com.co'); sinErrores(() => c.obtenerInstrucciones(id), /no pertenece/);
  como('pepito@dav.com.co');
  assert.strictEqual(c.obtenerInstrucciones(id).caso.formaPago, 'Transferencia');
  assert.strictEqual(c.confirmarPago(id).status, 'Pagado');
  sinErrores(() => c.confirmarPago(id), /aprobado/);
});
t('Contabilidad solo ve aprobados/pagados', () => {
  E.hojas.ACCESOS.appendRow(['conta@dav.com.co', 'Conta', 'Contabilidad', 'Sí', '']); como('conta@dav.com.co');
  const l = c.listarCasos({}); assert.ok(l.length >= 1 && l.every(x => ['Aprobado', 'Pagado'].includes(x.status)));
  sinErrores(() => c.resolverCaso(id, 'aprobar', {}), /rol/);
});
t('aprobar lote', () => {
  como('pepito@dav.com.co'); const a = c.guardarCaso(base).id, b = c.guardarCaso(base).id;
  como('leydi@dav.com.co'); const r = c.aprobarLote([a, b]); assert.strictEqual(r.aprobados, 2);
});
t('rechazo notifica a la oficina', () => {
  como('pepito@dav.com.co'); const x = c.guardarCaso(base).id; como('leydi@dav.com.co');
  const n = c.resolverCaso(x, 'rechazar', { tarifa: 20, formaPago: 'Débito', notas: 'Falta soporte' });
  assert.strictEqual(n.status, 'Rechazado'); assert.ok(E.correos.some(m => /Rechazado/.test(m.subject)));
});
t('XSS escapado en correos', () => {
  como('pepito@dav.com.co'); const x = c.guardarCaso(Object.assign({}, base, { cliente: '<script>alert(1)</script>' })).id;
  como('leydi@dav.com.co'); c.resolverCaso(x, 'aprobar', { tarifa: 20, formaPago: 'Débito' });
  const m = E.correos.filter(k => /Aprobado/.test(k.subject)).pop(); assert.ok(!/<script>alert/.test(m.htmlBody));
});

console.log('Roles y acceso por defecto');
t('hoja ROLES define los 3 roles', () => assert.deepStrictEqual(E.hojas.ROLES.getRange(2, 1, 3, 1).getValues().map(f => f[0]), ['Oficina', 'Operativo', 'Contabilidad']));
t('correo desconocido entra como Oficina y se registra en ACCESOS', () => {
  como('maria.lopez@dav.com.co'); const r = c.iniciarSesion();
  assert.ok(r.ok); assert.strictEqual(r.usuario.rol, 'Oficina'); assert.strictEqual(r.usuario.nombre, 'Maria Lopez');
  assert.ok(E.hojas.ACCESOS.getDataRange().getValues().some(f => f[0] === 'maria.lopez@dav.com.co'));
  assert.strictEqual(E.hojas.ACCESOS.getDataRange().getValues().filter(f => f[0] === 'maria.lopez@dav.com.co').length, 1);
  c.iniciarSesion(); assert.strictEqual(E.hojas.ACCESOS.getDataRange().getValues().filter(f => f[0] === 'maria.lopez@dav.com.co').length, 1);
});
t('usuario por defecto no puede aprobar', () => { como('maria.lopez@dav.com.co'); sinErrores(() => c.resolverCaso('CDT001', 'aprobar', {}), /rol/); });
t('"No" explícito sigue bloqueado', () => { como('inactivo@dav.com.co'); assert.strictEqual(c.iniciarSesion().ok, false); });
t('Rol por defecto vacío = lista cerrada', () => {
  const fila = E.hojas.CONFIG.getDataRange().getValues().findIndex(f => f[0] === 'Rol por defecto');
  E.hojas.CONFIG.getRange(fila + 1, 2).setValue(''); como('nuevo@dav.com.co'); assert.strictEqual(c.iniciarSesion().ok, false);
  E.hojas.CONFIG.getRange(fila + 1, 2).setValue('Oficina');
});
t('CONFIG existente se completa al re-ejecutar inicializarSistema', () => {
  const antes = E.hojas.CONFIG.getLastRow(); E.hojas.CONFIG.filas.splice(antes - 2, 2); c.inicializarSistema();
  assert.strictEqual(E.hojas.CONFIG.getLastRow(), antes);
});

console.log('Imágenes');
t('sin IDs no hay imágenes ni errores', () => { como('leydi@dav.com.co'); assert.deepStrictEqual(JSON.parse(JSON.stringify(c.obtenerImagenes())), { triangulos: '', bienvenida: '' }); });
const E2 = crearEntorno({ drive: { getFileById: id => { if (id === 'ID_NO_EXISTE_123') throw new Error('no existe'); return { getBlob: () => ({ getContentType: () => id.startsWith('PDF') ? 'application/pdf' : 'image/png', getBytes: () => [137, 80, 78, 71] }) }; } } });
E2.ctx.inicializarSistema();
t('IDs de Drive → data URI, se cachean, y enlaces completos funcionan', () => {
  const set = (k, v) => { const i = E2.hojas.CONFIG.getDataRange().getValues().findIndex(f => f[0] === k); E2.hojas.CONFIG.getRange(i + 1, 2).setValue(v); };
  set('ID Imagen Triángulos', 'https://drive.google.com/file/d/TRIANGULOS_ID_1234/view?usp=sharing'); set('ID Imagen Fondo Bienvenida', 'ID_NO_EXISTE_123'); set('ID Imagen Logo', 'PDF_NO_ES_IMAGEN_1');
  E2.estado.email = 'owner@dav.com.co';
  const im = JSON.parse(JSON.stringify(E2.ctx.obtenerImagenes()));
  assert.ok(im.triangulos.startsWith('data:image/png;base64,')); assert.strictEqual(im.bienvenida, '');
  assert.strictEqual(JSON.parse(JSON.stringify(E2.ctx.imagenesIniciales_())).logo, '');
});
t('IDs en Propiedades de script también funcionan', () => {
  const E3 = crearEntorno({ props: { 'ID Imagen Logo': 'LOGO_DESDE_PROPIEDADES_1' } });
  E3.ctx.inicializarSistema();
  assert.strictEqual(E3.ctx.obtenerConfig().imgLogo, 'LOGO_DESDE_PROPIEDADES_1');
});
t('un ID inválido no llama a Drive', () => assert.strictEqual(c.imagenDataUri_("x'; DROP"), ''));

console.log('Alertas');
t('alerta se envía una sola vez para vencimiento en 5 días', () => {
  como('pepito@dav.com.co');
  const f = new Date(); f.setDate(f.getDate() + 5);
  const iso = c.fechaIso(f);
  const x = c.guardarCaso(Object.assign({}, base, { vencimiento: iso })).id;
  como('leydi@dav.com.co'); c.resolverCaso(x, 'aprobar', { tarifa: 20, formaPago: 'Débito', vencimiento: iso });
  const antes = E.correos.length;
  assert.strictEqual(c.verificarVencimientos(), 1);
  assert.ok(E.correos.slice(antes).some(m => /Vencimiento en 5 días/.test(m.subject)));
  assert.strictEqual(c.verificarVencimientos(), 0);
  assert.strictEqual(E.hojas.ALERTAS.getRange(2, 4).getValues()[0][0], 'Enviada');
  assert.strictEqual(c.listarAlertas()[0].dias, 5);
});
t('oficina edita desde la alerta → Modificada + aviso a Operativo', () => {
  como('pepito@dav.com.co');
  const f = new Date(); f.setDate(f.getDate() + 9); const iso = c.fechaIso(f);
  const id2 = c.listarMisCasos().find(k => k.vencimiento).id;
  const antes = E.correos.length;
  c.guardarAlertaCaso(id2, { vencimiento: iso, formaPago: 'Efectivo', notas: 'Cambio' });
  assert.strictEqual(E.hojas.ALERTAS.getRange(2, 4).getValues()[0][0], 'Modificada');
  assert.ok(E.correos.slice(antes).some(m => /Cambios en/.test(m.subject)));
  assert.ok(c.confirmarVencimientoCaso(id2));
});

console.log('Leasing');
t('cruce: conciliado y discrepancias con % correctos', () => {
  como('leydi@dav.com.co');
  esperar(); const rep = c.cruzarDatos([
    { cuenta: 1001, credito: 'CRD-001', recibo: 'REC-001', valorOperativo: 1200000, valorContabilidad: 1200000 },
    { cuenta: 1002, credito: 'CRD-002', recibo: 'REC-002', valorOperativo: 850000, valorContabilidad: 800000 },
    { cuenta: 1003, credito: 'CRD-003', recibo: 'REC-003', valorOperativo: '2.500.000', valorContabilidad: '2,600,000' }
  ]);
  const r = rep.resumen; assert.deepStrictEqual([r.total, r.conciliados, r.discrepancias, r.exactitud], [3, 1, 2, 33]);
  const por = {}; rep.registros.forEach(x => por[x.recibo] = x);
  assert.strictEqual(por['REC-002'].diferencia, -50000); assert.ok(Math.abs(por['REC-002'].variacion * 100 + 5.9) < 0.01);
  assert.strictEqual(por['REC-003'].diferencia, 100000); assert.ok(Math.abs(por['REC-003'].variacion * 100 - 4) < 0.01);
});
t('duplicados y recibos vacíos se reportan', () => {
  esperar(); const rep = c.cruzarDatos([{ cuenta: 1, credito: 'a', recibo: 'R9', valorOperativo: 10, valorContabilidad: 10 }, { cuenta: 1, credito: 'a', recibo: 'R9', valorOperativo: 10, valorContabilidad: 10 }, { cuenta: 2, credito: 'b', recibo: '', valorOperativo: 5, valorContabilidad: 5 }]);
  assert.strictEqual(rep.errores.length, 2); assert.strictEqual(rep.resumen.total, 1);
});
t('marcar incidente actualiza estado y avisa', () => {
  const antes = E.correos.length;
  esperar(); const rep = c.cruzarDatos([{ cuenta: 5, credito: 'c', recibo: 'R50', valorOperativo: 100, valorContabilidad: 90 }]);
  const r2 = c.marcarLeasing('incidente', 'revisar');
  assert.strictEqual(r2.registros.find(x => x.recibo === 'R50').estado, 'Incidente'); assert.ok(E.correos.length > antes);
});
t('Oficina no puede usar Leasing', () => { como('pepito@dav.com.co'); sinErrores(() => c.cruzarDatos([{}]), /rol/); });

console.log(`\n${pasadas} pruebas pasadas`);
