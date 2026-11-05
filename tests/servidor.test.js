const assert = require('assert');
const { crearEntorno } = require('./mock');
const E = crearEntorno();
const c = E.ctx;
let pasadas = 0;
function t(nombre, fn) { try { fn(); pasadas++; console.log('  ✓', nombre); } catch (e) { console.error('  ✗', nombre, '\n   ', e.message); process.exitCode = 1; } }
function como(email) { E.estado.email = email; }
function sinErrores(fn, texto) { assert.throws(fn, texto); }

c.inicializarSistema();
console.log('Servidor');

t('crea las 6 hojas (incluye ROLES, sin Leasing)', () => assert.deepStrictEqual(Object.keys(E.hojas).sort(), ['ACCESOS', 'ALERTAS', 'AUDITORÍA', 'CASOS_CDT', 'CONFIG', 'ROLES'].sort()));
t('validación de dominio (opcional) bloquea correos externos', () => { c.APP.VALIDAR_DOMINIO = true; como('x@otra.com'); assert.strictEqual(c.iniciarSesion().ok, false); c.APP.VALIDAR_DOMINIO = false; });
t('usuario inactivo no entra', () => { E.hojas.ACCESOS.appendRow(['inactivo@dav.com.co', 'Ina', 'Oficina', 'No', '']); como('inactivo@dav.com.co'); assert.strictEqual(c.iniciarSesion().ok, false); });
t('Oficina entra y recibe rol', () => { como('pepito@dav.com.co'); const r = c.iniciarSesion(); assert.ok(r.ok); assert.strictEqual(r.usuario.rol, 'Oficina'); });

const base = { tipoRetiro: 'Solo rendimientos', numeroCdt: '0012345678', estadoCdt: 'Activo', cliente: 'Juan Pérez', idCliente: '123456', pais: 'mexico', valorCdt: 5000000, rendimientos: 5000000, formaPago: 'Débito de cuenta', vencimiento: '' };
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
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { rendimientos: 6000000 })), /superar/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { formaPago: 'Transferencia' })), /forma de pago/);
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
  sinErrores(() => c.resolverCaso(id, 'rechazar', { tarifa: 20, formaPago: 'Débito de cuenta' }), /motivo/);
  sinErrores(() => c.resolverCaso(id, 'aprobar', { tarifa: 120, formaPago: 'Débito de cuenta' }), /tarifa/);
});
t('Leydi aprueba con tarifa 15% → recalcula, audita, envía instrucciones', () => {
  const antes = E.correos.length;
  const n = c.resolverCaso(id, 'aprobar', { tarifa: 15, formaPago: 'Efectivo', vencimiento: '', notas: 'Bien' });
  assert.strictEqual(n.status, 'Aprobado'); assert.strictEqual(n.rete20, 750000); assert.strictEqual(n.diferencia, 550000);
  assert.strictEqual(n.saldoNeto, 4250000); assert.strictEqual(n.aprobadoPor, 'Leydi Librado');
  const nuevos = E.correos.slice(antes);
  assert.ok(nuevos.some(m => m.to === 'pepito@dav.com.co' && /Aprobado - Instrucciones de Pago/.test(m.subject) && /page=pago&amp;case=CDT001/.test(m.htmlBody)));
  const aud = c.obtenerAuditoria(id).map(a => a.accion);
  assert.ok(aud.includes('aprobacion') && aud.includes('ingesta'));
  assert.ok(c.obtenerAuditoria(id).some(a => /tarifa: 20 → 15/.test(a.detalle)));
});
t('no se puede reprocesar un caso aprobado', () => sinErrores(() => c.resolverCaso(id, 'aprobar', { tarifa: 20, formaPago: 'Débito de cuenta' }), /ya fue procesado/));
t('Oficina dueña ve instrucciones y confirma pago; otra no', () => {
  como('otra@dav.com.co'); sinErrores(() => c.obtenerInstrucciones(id), /no pertenece/);
  como('pepito@dav.com.co');
  assert.strictEqual(c.obtenerInstrucciones(id).caso.formaPago, 'Efectivo');
  assert.strictEqual(c.confirmarPago(id).status, 'Pagado');
  sinErrores(() => c.confirmarPago(id), /aprobado/);
});
t('aprobar lote', () => {
  como('pepito@dav.com.co'); const a = c.guardarCaso(base).id, b = c.guardarCaso(base).id;
  como('leydi@dav.com.co'); const r = c.aprobarLote([a, b]); assert.strictEqual(r.aprobados, 2);
});
t('rechazo notifica a la oficina', () => {
  como('pepito@dav.com.co'); const x = c.guardarCaso(base).id; como('leydi@dav.com.co');
  const n = c.resolverCaso(x, 'rechazar', { tarifa: 20, formaPago: 'Débito de cuenta', notas: 'Falta soporte' });
  assert.strictEqual(n.status, 'Rechazado'); assert.ok(E.correos.some(m => /Rechazado/.test(m.subject)));
});
t('XSS escapado en correos', () => {
  como('pepito@dav.com.co'); const x = c.guardarCaso(Object.assign({}, base, { cliente: '<script>alert(1)</script>' })).id;
  como('leydi@dav.com.co'); c.resolverCaso(x, 'aprobar', { tarifa: 20, formaPago: 'Débito de cuenta' });
  const m = E.correos.filter(k => /Aprobado/.test(k.subject)).pop(); assert.ok(!/<script>alert/.test(m.htmlBody));
});

console.log('Perfil Impuestos, destinatarios, país libre, vencimiento y remitente');
const cont = () => E.correos.length;
t('país libre: "mexico" → México; texto no listado se acepta; vacío es válido', () => {
  como('pepito@dav.com.co');
  const a = c.guardarCaso(base).id; assert.strictEqual(c.buscarCaso(a).caso.pais, 'México');
  const b = c.guardarCaso(Object.assign({}, base, { pais: 'Islandia Norte' })).id; assert.strictEqual(c.buscarCaso(b).caso.pais, 'Islandia Norte');
  const d = c.guardarCaso(Object.assign({}, base, { pais: '' })).id; assert.strictEqual(c.buscarCaso(d).caso.pais, '');
  assert.strictEqual(c.normalizarPais_('ESPANA'), 'España'); assert.strictEqual(c.normalizarPais_('  estados UNIDOS '), 'Estados Unidos');
});
t('solo hay Débito de cuenta y Efectivo', () => assert.deepStrictEqual(JSON.parse(JSON.stringify(c.FORMAS_PAGO)), ['Débito de cuenta', 'Efectivo']));
E.hojas.ACCESOS.appendRow(['librado@dav.com.co', 'Leydi Librado', 'Impuestos', 'Sí', 'Impuestos']);
E.hojas.ACCESOS.appendRow(['bogota@dav.com.co', 'Oficina Bogotá', 'Oficina', 'Sí', 'Bogotá Centro']);
E.hojas.ACCESOS.appendRow(['cali@dav.com.co', 'Oficina Cali', 'Oficina', 'Sí', 'Cali']);
E.hojas.ACCESOS.appendRow(['conta@dav.com.co', 'Conta', 'Contabilidad', 'Sí', '']);
let idImp;
t('Impuestos ve ambas visuales y exige destinatarios válidos', () => {
  como('librado@dav.com.co'); const s = c.iniciarSesion(); assert.strictEqual(s.usuario.rol, 'Impuestos'); assert.strictEqual(s.usuario.nombre, 'Leydi Librado');
  sinErrores(() => c.guardarCaso(base), /al menos un correo/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { correosDestino: 'bogota@dav.com.co, malo' })), /no válidos/);
  assert.ok(Array.isArray(c.listarCasos({}))); assert.ok(Array.isArray(c.listarMisCasos()));
});
t('Impuestos ingresa para oficinas: avisos van a ellas y no a quien digita', () => {
  const antes = cont();
  idImp = c.guardarCaso(Object.assign({}, base, { correosDestino: 'Bogota@dav.com.co; cali@dav.com.co', oficina: 'Zona Centro' })).id;
  const k = c.buscarCaso(idImp).caso; assert.strictEqual(k.correosDestino, 'bogota@dav.com.co, cali@dav.com.co'); assert.strictEqual(k.oficina, 'Zona Centro');
  const nuevos = E.correos.slice(antes);
  assert.ok(nuevos.some(m => m.to === 'bogota@dav.com.co,cali@dav.com.co' && /recibido/.test(m.subject)));
  nuevos.forEach(m => assert.ok(!m.to.split(',').includes('librado@dav.com.co'), 'a quien digita no le llega nada'));
});
t('las dos oficinas destinatarias ven el caso; otra no', () => {
  como('bogota@dav.com.co'); assert.ok(c.listarMisCasos().some(x => x.id === idImp)); assert.ok(c.obtenerDetalleCaso(idImp));
  como('cali@dav.com.co'); assert.ok(c.listarMisCasos().some(x => x.id === idImp));
  como('otra@dav.com.co'); sinErrores(() => c.obtenerDetalleCaso(idImp), /no pertenece/);
});
t('aprobación notifica a todas las destinatarias y NO al gestor que aprueba; correo noreply con nombre', () => {
  como('librado@dav.com.co'); const antes = cont();
  c.resolverCaso(idImp, 'aprobar', { tarifa: 20, formaPago: 'Débito de cuenta', vencimiento: '', notas: '' });
  const m = E.correos.slice(antes).find(x => /Aprobado - Instrucciones/.test(x.subject));
  assert.strictEqual(m.to, 'bogota@dav.com.co,cali@dav.com.co'); assert.strictEqual(m.name, 'AutoTrib | Impuestos Davivienda'); assert.strictEqual(m.noReply, true);
});
t('si noReply no está disponible (Gmail personal) se reintenta sin esa opción', () => {
  const G = crearEntorno({ email: 'leydi@dav.com.co', mailFalla: true }); G.ctx.inicializarSistema();
  G.ctx.enviar_('x@dav.com.co', 'Asunto', 'Titulo', '<p>hola</p>');
  assert.strictEqual(G.correos.length, 1); assert.strictEqual(G.correos[0].noReply, undefined);
});
t('la oficina destinataria edita el vencimiento luego de enviar; avisa a gestores y reinicia alerta', () => {
  como('bogota@dav.com.co'); const f = new Date(); f.setDate(f.getDate() + 12); const iso = c.fechaIso(f); const antes = cont();
  assert.strictEqual(c.actualizarVencimiento(idImp, iso).vencimiento, iso);
  assert.ok(E.correos.slice(antes).some(m => /Cambios en/.test(m.subject)));
  sinErrores(() => c.actualizarVencimiento(idImp, '2020-01-01'), /anterior a hoy/);
  como('otra@dav.com.co'); sinErrores(() => c.actualizarVencimiento(idImp, iso), /no pertenece/);
});
t('no se edita el vencimiento de un caso pagado o rechazado', () => {
  como('bogota@dav.com.co'); c.confirmarPago(idImp);
  const f = new Date(); f.setDate(f.getDate() + 20); sinErrores(() => c.actualizarVencimiento(idImp, c.fechaIso(f)), /ya no admite/);
});
t('Contabilidad ya no existe: esas filas caen al rol por defecto Oficina', () => {
  como('conta@dav.com.co'); assert.strictEqual(c.iniciarSesion().usuario.rol, 'Oficina'); assert.strictEqual(c.ROLES.CONTABILIDAD, undefined);
});
t('Operativo gestiona pero no ingresa CDT', () => { como('leydi@dav.com.co'); E.hojas.ACCESOS.appendRow(['op@dav.com.co', 'Op', 'Operativo', 'Sí', '']); como('op@dav.com.co'); sinErrores(() => c.guardarCaso(base), /rol/); assert.ok(Array.isArray(c.listarCasos({}))); });

console.log('Roles y acceso por defecto');
t('hoja ROLES define los 3 roles', () => assert.deepStrictEqual(E.hojas.ROLES.getRange(2, 1, 3, 1).getValues().map(f => f[0]), ['Oficina', 'Operativo', 'Impuestos']));
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
t('foto grande se reduce con miniatura; sin miniatura y >2MB se explica el motivo', () => {
  const grande = { getContentType: () => 'image/jpeg', getBytes: () => new Array(3 * 1024 * 1024).fill(1) };
  const mini = { getContentType: () => 'image/jpeg', getBytes: () => [1, 2, 3], };
  const mk = conMini => crearEntorno({ drive: { getFileById: () => ({ getBlob: () => grande }) }, fetch: conMini ? (u) => u.includes('/drive/v3/') ? { getResponseCode: () => 200, getContentText: () => JSON.stringify({ thumbnailLink: 'https://x/y=s220' }) } : { getResponseCode: () => 200, getBlob: () => mini } : () => ({ getResponseCode: () => 403 }) });
  const A = mk(true), B = mk(false);
  assert.ok(A.ctx.leerImagen_('FOTO_GRANDE_ID_1234', 1600).motivo.startsWith('OK (reducida'));
  assert.ok(/Pesa 3\.0 MB/.test(B.ctx.leerImagen_('FOTO_GRANDE_ID_1234', 1600).motivo));
  assert.ok(/no es una imagen/.test(E2.ctx.leerImagen_('PDF_NO_ES_IMAGEN_1', 600).motivo));
  assert.ok(/Drive no permite/.test(E2.ctx.leerImagen_('ID_NO_EXISTE_123', 600).motivo));
});
t('diagnosticarImagenes informa cada imagen', () => {
  const txt = E2.ctx.diagnosticarImagenes(); assert.ok(/Logo \[PDF_NO_ES_IMAGEN_1\]: El archivo no es una imagen/.test(txt) && /Triángulos \[TRIANGULOS_ID_1234\]: OK/.test(txt));
});
t('un ID inválido no llama a Drive', () => assert.strictEqual(c.imagenDataUri_("x'; DROP"), ''));

console.log('Paquete dist/');
t('dist/ (5 archivos) arranca solo y funciona sin src/', () => {
  const fs = require('fs'), path = require('path');
  assert.deepStrictEqual(fs.readdirSync(path.join(__dirname, '..', 'dist')).sort(), ['Cliente.html', 'Codigo.gs', 'Estilos.html', 'Index.html', 'appsscript.json']);
  const D = crearEntorno({ dist: true, email: 'leydi@dav.com.co' }); D.ctx.inicializarSistema();
  assert.strictEqual(D.ctx.iniciarSesion().ok, true); assert.strictEqual(typeof D.ctx.include, 'function'); assert.strictEqual(typeof D.ctx.imagenesIniciales_, 'function');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(D.ctx.imagenesIniciales_())), { logo: '', carga: '' });
});

console.log('Qué desea el cliente (cancelar producto / solo rendimientos)');
t('cálculo: cancelar producto = CDT + rendimientos - retefuente; solo rendimientos = rendimientos - retefuente', () => {
  const j = o => JSON.parse(JSON.stringify(o));
  // CDT 10M, rendimientos 5M, retefuente 20% = 1M
  assert.strictEqual(c.calcularRetenciones(5000000, 10000000, 20, 4, 'Cancelar producto').saldoNeto, 14000000);
  assert.strictEqual(c.calcularRetenciones(5000000, 10000000, 20, 4, 'Solo rendimientos').saldoNeto, 4000000);
  // con tarifa 15%: retefuente 750.000
  assert.strictEqual(c.calcularRetenciones(5000000, 10000000, 15, 4, 'Cancelar producto').saldoNeto, 14250000);
  assert.strictEqual(c.calcularRetenciones(5000000, 10000000, 15, 4, 'Solo rendimientos').saldoNeto, 4250000);
  // la retención y la diferencia a cobrar no dependen de lo que desee el cliente
  assert.deepStrictEqual([j(c.calcularRetenciones(5000000, 10000000, 20, 4, 'Cancelar producto')).rete20, j(c.calcularRetenciones(5000000, 10000000, 20, 4, 'Cancelar producto')).diferencia], [1000000, 800000]);
  assert.strictEqual(c.calcularRetenciones(5000000, 10000000, 20, 4, 'Solo rendimientos').diferencia, 800000);
});
t('es obligatorio indicar qué desea el cliente y solo valen las dos opciones', () => {
  como('pepito@dav.com.co');
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { tipoRetiro: '' })), /qué desea el cliente/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { tipoRetiro: 'Otro' })), /qué desea el cliente/);
});
let idRet;
t('el correo de caso recibido avisa que hay que esperar la revisión y aprobación del área encargada', () => {
  como('pepito@dav.com.co'); const antes = E.correos.length; c.guardarCaso(Object.assign({}, base, { numeroCdt: 'ESPERA-01' }));
  const m = E.correos.slice(antes).find(x => /recibido/.test(x.subject));
  assert.ok(/esperar a que el área encargada revise y apruebe el caso/.test(m.htmlBody) && /notificando por correo/.test(m.htmlBody));
});
t('se guarda con el valor neto correcto en cada opción y se recupera', () => {
  const a = c.guardarCaso(Object.assign({}, base, { numeroCdt: 'RET-001', valorCdt: 10000000, rendimientos: 5000000, tipoRetiro: 'Cancelar producto' })).id; idRet = a;
  const b = c.guardarCaso(Object.assign({}, base, { numeroCdt: 'RET-002', valorCdt: 10000000, rendimientos: 5000000, tipoRetiro: 'Solo rendimientos' })).id;
  assert.strictEqual(c.buscarCaso(a).caso.saldoNeto, 14000000); assert.strictEqual(c.buscarCaso(a).caso.tipoRetiro, 'Cancelar producto');
  assert.strictEqual(c.buscarCaso(b).caso.saldoNeto, 4000000); assert.strictEqual(c.buscarCaso(b).caso.tipoRetiro, 'Solo rendimientos');
  assert.ok(E.correos.some(m => /recibido/.test(m.subject) && m.htmlBody.includes('Cancelar producto') && m.htmlBody.includes('$ 14,000,000')));
});
t('al cambiar la tarifa se recalcula el neto según lo que desea el cliente', () => {
  como('leydi@dav.com.co');
  const n = c.resolverCaso(idRet, 'aprobar', { tarifa: 15, formaPago: 'Efectivo' });
  assert.strictEqual(n.rete20, 750000); assert.strictEqual(n.saldoNeto, 14250000); assert.strictEqual(n.diferencia, 550000);
  assert.ok(E.correos.some(m => /Aprobado - Instrucciones/.test(m.subject) && m.htmlBody.includes('Valor neto para el cliente') && m.htmlBody.includes('$ 14,250,000')));
});
t('se puede corregir lo que desea el cliente después: recalcula el neto sin tocar la retención', () => {
  como('pepito@dav.com.co');
  const n = c.actualizarCdt(idRet, { tipoRetiro: 'Solo rendimientos' });
  assert.strictEqual(n.tipoRetiro, 'Solo rendimientos'); assert.strictEqual(n.saldoNeto, 4250000); assert.strictEqual(n.rete20, 750000); assert.strictEqual(n.diferencia, 550000);
  assert.ok(c.obtenerAuditoria(idRet).some(a => /tipoRetiro: Cancelar producto → Solo rendimientos/.test(a.detalle)));
  sinErrores(() => c.actualizarCdt(idRet, { tipoRetiro: 'Nada' }), /qué desea el cliente/);
});
t('casos anteriores sin dato: "no indicado", conservan su valor y se les puede asignar', () => {
  const fila = E.hojas.CASOS_CDT.filas; const ix = fila.findIndex(f => f && f[0] === idRet);
  const copia = fila[ix].slice(); copia[0] = 'CDT950'; copia[26] = ''; copia[10] = 4000000; fila[fila.length] = copia;
  const h = c.buscarCaso('CDT950').caso; assert.strictEqual(h.tipoRetiro, ''); assert.strictEqual(h.saldoNeto, 4000000);
  como('leydi@dav.com.co'); assert.strictEqual(c.actualizarCdt('CDT950', { tipoRetiro: 'Cancelar producto' }).saldoNeto, c.calcularRetenciones(5000000, 10000000, 15, 4, 'Cancelar producto').saldoNeto);
});

console.log('Número y estado del CDT');
let idN;
t('registra un CDT con número y fecha de vencimiento (el número conserva ceros a la izquierda)', () => {
  como('pepito@dav.com.co'); const f = new Date(); f.setDate(f.getDate() + 30); const iso = c.fechaIso(f);
  idN = c.guardarCaso(Object.assign({}, base, { numeroCdt: ' 0012345678 ', vencimiento: iso })).id;
  const k = c.buscarCaso(idN).caso; assert.strictEqual(k.numeroCdt, '0012345678'); assert.strictEqual(k.estadoCdt, 'Activo'); assert.strictEqual(k.vencimiento, iso);
  assert.ok(c.listarMisCasos().some(x => x.id === idN && x.numeroCdt === '0012345678'));
  assert.ok(c.obtenerDetalleCaso(idN).caso.numeroCdt === '0012345678');
});
t('el número del CDT es obligatorio y se valida', () => {
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { numeroCdt: '' })), /número del CDT/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { numeroCdt: 'ab' })), /número del CDT/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { numeroCdt: '12 34 56' })), /número del CDT/);
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { numeroCdt: '=SUMA(1)' })), /número del CDT/);
  assert.ok(c.guardarCaso(Object.assign({}, base, { numeroCdt: 'CDT-2026/778.1' })).id);
});
t('registra un CDT cancelado sin fecha: ignora cualquier fecha enviada y queda guardado', () => {
  const f = new Date(); f.setDate(f.getDate() + 30);
  const id = c.guardarCaso(Object.assign({}, base, { numeroCdt: '99887766', estadoCdt: 'Cancelado', vencimiento: c.fechaIso(f) })).id;
  const k = c.buscarCaso(id).caso; assert.strictEqual(k.estadoCdt, 'Cancelado'); assert.strictEqual(k.vencimiento, '');
  const id2 = c.guardarCaso(Object.assign({}, base, { numeroCdt: '99887755', estadoCdt: 'Cancelado', vencimiento: '' })).id;
  assert.strictEqual(c.buscarCaso(id2).caso.estadoCdt, 'Cancelado');
  sinErrores(() => c.guardarCaso(Object.assign({}, base, { estadoCdt: 'Anulado' })), /Activo o Cancelado/);
});
t('cambia Activo → Cancelado (limpia la fecha, sin borrar el caso) y de vuelta a Activo', () => {
  const antes = c.buscarCaso(idN).caso;
  const canc = c.actualizarCdt(idN, { estadoCdt: 'Cancelado' });
  assert.strictEqual(canc.estadoCdt, 'Cancelado'); assert.strictEqual(canc.vencimiento, '');
  assert.strictEqual(canc.cliente, antes.cliente); assert.strictEqual(canc.rendimientos, antes.rendimientos); assert.strictEqual(canc.numeroCdt, antes.numeroCdt);
  assert.ok(c.obtenerAuditoria(idN).some(a => /estadoCdt: Activo → Cancelado/.test(a.detalle) && /vencimiento/.test(a.detalle)));
  // cancelado: no admite fecha aunque la manden
  const f = new Date(); f.setDate(f.getDate() + 15); const iso = c.fechaIso(f);
  assert.strictEqual(c.actualizarCdt(idN, { estadoCdt: 'Cancelado', vencimiento: iso }).vencimiento, '');
  const act = c.actualizarCdt(idN, { estadoCdt: 'Activo', vencimiento: iso });
  assert.strictEqual(act.estadoCdt, 'Activo'); assert.strictEqual(act.vencimiento, iso);
  assert.strictEqual(c.buscarCaso(idN).caso.vencimiento, iso);     // persistido en la hoja
});
t('los CDT cancelados siguen apareciendo en las consultas con toda su información', () => {
  c.actualizarCdt(idN, { estadoCdt: 'Cancelado' });
  assert.ok(c.listarMisCasos().some(x => x.id === idN && x.estadoCdt === 'Cancelado' && x.cliente === 'Juan Pérez'));
  como('leydi@dav.com.co'); const todos = c.listarCasos({}); const k = todos.find(x => x.id === idN);
  assert.ok(k && k.estadoCdt === 'Cancelado' && k.numeroCdt === '0012345678' && k.rendimientos === 5000000);
  como('pepito@dav.com.co'); c.actualizarCdt(idN, { estadoCdt: 'Activo' });
});
t('un CDT cancelado no genera alertas ni se puede editar desde la alerta; se reactiva y vuelve', () => {
  const f = new Date(); f.setDate(f.getDate() + 3); const iso = c.fechaIso(f);
  como('pepito@dav.com.co'); const id = c.guardarCaso(Object.assign({}, base, { numeroCdt: 'ALERTA-001', vencimiento: iso })).id;
  como('leydi@dav.com.co'); c.resolverCaso(id, 'aprobar', { tarifa: 20, formaPago: 'Efectivo' });
  como('pepito@dav.com.co'); c.actualizarCdt(id, { estadoCdt: 'Cancelado' });
  const antes = E.correos.length; c.verificarVencimientos();
  assert.ok(!E.correos.slice(antes).some(m => /ALERTA-001|Vencimiento en/.test(m.subject + m.htmlBody) && /Vencimiento en/.test(m.subject) && m.htmlBody.includes('ALERTA-001')), 'sin alerta del cancelado');
  sinErrores(() => c.guardarAlertaCaso(id, { vencimiento: iso, formaPago: 'Efectivo' }), /cancelado/);
  como('leydi@dav.com.co'); assert.ok(!c.listarAlertas().some(a => a.id === id));
  como('pepito@dav.com.co'); c.actualizarCdt(id, { estadoCdt: 'Activo', vencimiento: iso });
  const antes2 = E.correos.length; c.verificarVencimientos();
  assert.ok(E.correos.slice(antes2).some(m => /Vencimiento en/.test(m.subject) && m.htmlBody.includes('ALERTA-001')), 'al reactivar, vuelve la alerta');
});
t('número histórico: casos sin número siguen funcionando y se les puede agregar después', () => {
  const fila = E.hojas.CASOS_CDT.filas;
  const ix = fila.findIndex(f => f && f[0] === idN); const copia = fila[ix].slice(); copia[0] = 'CDT900'; copia[24] = ''; copia[25] = ''; copia[2] = 'Cliente Histórico';
  fila[fila.length] = copia;
  const h = c.buscarCaso('CDT900').caso; assert.strictEqual(h.numeroCdt, ''); assert.strictEqual(h.estadoCdt, 'Activo');
  como('leydi@dav.com.co'); assert.strictEqual(c.actualizarCdt('CDT900', { numeroCdt: '5550001' }).numeroCdt, '5550001');
  sinErrores(() => c.actualizarCdt('CDT900', { numeroCdt: '!' }), /número del CDT/);
});
t('permisos: una oficina ajena no puede editar el CDT', () => { como('otra@dav.com.co'); sinErrores(() => c.actualizarCdt(idN, { estadoCdt: 'Cancelado' }), /no pertenece/); como('pepito@dav.com.co'); });

console.log('Alertas');
let idAl;
const estadoAlerta = id => E.hojas.ALERTAS.getDataRange().getValues().find(f => f[0] === id)[3];
t('alerta se envía una sola vez para vencimiento en 5 días', () => {
  como('pepito@dav.com.co');
  const f = new Date(); f.setDate(f.getDate() + 5);
  const iso = c.fechaIso(f);
  const x = c.guardarCaso(Object.assign({}, base, { numeroCdt: 'VENC-5D', vencimiento: iso })).id; idAl = x;
  como('leydi@dav.com.co'); c.resolverCaso(x, 'aprobar', { tarifa: 20, formaPago: 'Débito de cuenta', vencimiento: iso });
  const antes = E.correos.length;
  assert.strictEqual(c.verificarVencimientos(), 1);
  assert.ok(E.correos.slice(antes).some(m => /Vencimiento en 5 días/.test(m.subject)));
  assert.strictEqual(c.verificarVencimientos(), 0);
  assert.strictEqual(estadoAlerta(idAl), 'Enviada');
  assert.strictEqual(c.listarAlertas().find(a => a.id === idAl).dias, 5);
});
t('oficina edita desde la alerta → Modificada + aviso a Operativo', () => {
  como('pepito@dav.com.co');
  const f = new Date(); f.setDate(f.getDate() + 9); const iso = c.fechaIso(f);
  const id2 = idAl;
  const antes = E.correos.length;
  c.guardarAlertaCaso(id2, { vencimiento: iso, formaPago: 'Efectivo', notas: 'Cambio' });
  assert.strictEqual(estadoAlerta(id2), 'Modificada');
  assert.ok(E.correos.slice(antes).some(m => /Cambios en/.test(m.subject)));
  assert.ok(c.confirmarVencimientoCaso(id2));
});

console.log(`\n${pasadas} pruebas pasadas`);

assert.strictEqual(typeof c.cruzarDatos, 'undefined', 'Leasing eliminado');
