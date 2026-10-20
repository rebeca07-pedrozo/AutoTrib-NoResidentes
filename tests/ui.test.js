// Prueba de interfaz con Playwright: sustituye google.script.run por datos simulados.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), assert = require('assert');
const src = p => fs.readFileSync(path.join(__dirname, '..', 'src', p), 'utf8');
const rol = process.argv[2] || 'Oficina';
const OUT = process.argv[3] || '/tmp';

const casos = [
  { id: 'CDT001', fechaIngesta: '2026-10-15', cliente: 'Juan Pérez', idCliente: '123456', pais: 'Colombia', valorCdt: 5000000, rendimientos: 5000000, rete4: 200000, rete20: 1000000, diferencia: 800000, saldoNeto: 4000000, vencimiento: '2026-10-25', formaPago: 'Débito', status: 'Pendiente', tarifa: 20, notasLeydi: '', aprobadoPor: '', fechaAprobacion: '', oficina: 'Bogotá Centro', ingresadoPor: 'Pepito García', emailOficina: 'pepito@dav.com.co', notasOficina: '' },
  { id: 'CDT002', fechaIngesta: '2026-10-16', cliente: 'María López', idCliente: '234567', pais: 'Estados Unidos', valorCdt: 10000000, rendimientos: 10000000, rete4: 400000, rete20: 2000000, diferencia: 1600000, saldoNeto: 8000000, vencimiento: '2026-10-30', formaPago: 'Transferencia', status: 'Aprobado', tarifa: 20, notasLeydi: 'Bien', aprobadoPor: 'Leydi Bernal', fechaAprobacion: '2026-10-16', oficina: 'Bogotá Centro', ingresadoPor: 'Pepito García', emailOficina: 'pepito@dav.com.co', notasOficina: '' }
];
const usuario = rol === 'Oficina' ? { email: 'pepito@dav.com.co', nombre: 'Pepito García', rol, oficina: 'Bogotá Centro' } : { email: 'leydi@dav.com.co', nombre: 'Leydi Bernal', rol, oficina: 'Operaciones Tributarias' };

const mock = `
window.__llamadas=[];
const D=${JSON.stringify({ casos, usuario })};
const R={
 iniciarSesion:()=>({ok:true,usuario:D.usuario,config:{tarifaNoResidente:20,tarifaSistema:4,montoMinimo:84000},paises:['Colombia','Estados Unidos','España'],formasPago:['Débito','Efectivo','Transferencia'],hoy:'2026-10-20',resumen:{pendientes:1,hoy:1,aprobados:1,total:2,recientes:[{id:'CDT002',cliente:'María',status:'Aprobado'}]}}),
 obtenerResumen:()=>({pendientes:1,hoy:1,aprobados:1,total:2,recientes:[]}),
 guardarCaso:a=>({id:'CDT003',calculo:{}}),
 listarMisCasos:()=>D.casos, listarCasos:()=>D.casos,
 obtenerDetalleCaso:id=>({caso:D.casos.find(c=>c.id===id),auditoria:[{fecha:'15/10/2026 14:30',usuario:'Pepito García',accion:'ingesta',detalle:'Datos ingesta completos'}],config:{tarifaSistema:4}}),
 obtenerInstrucciones:id=>({caso:D.casos[1],contacto:{nombre:'Leydi Bernal',email:'leydi@dav.com.co',ext:'2345',extCaja:'1234'}}),
 resolverCaso:()=>({}), listarAlertas:()=>[], obtenerLeasing:()=>({registros:[],resumen:{total:0,conciliados:0,discrepancias:0,exactitud:0},errores:[],fechaCarga:''})
};
window.google={script:{run:new Proxy({},{get:(_,k)=>{ if(k==='withSuccessHandler') return ok=>({withFailureHandler:ko=>new Proxy({},{get:(_,fn)=>(...a)=>{window.__llamadas.push([fn,a]);setTimeout(()=>{try{ok(R[fn](...a))}catch(e){ko(e)}},30)}})}); }})}};
`;
(async () => {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${src('Estilos.html')}</head><body><div id="app"></div><div id="toast-zona"></div><script>window.ARRANQUE={};</script><script>${mock}</script>${src('Cliente.html')}</body></html>`;
  const f = path.join(OUT, 'harness.html'); fs.writeFileSync(f, html);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const errores = [];
  for (const [nombre, vp] of [['desktop', { width: 1280, height: 900 }], ['movil', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errores.push(e.message)); p.on('console', m => m.type() === 'error' && errores.push(m.text()));
    await p.goto('file://' + f);
    await p.waitForSelector('.hero');
    await p.screenshot({ path: `${OUT}/${rol}-${nombre}-inicio.png` });
    if (rol === 'Oficina') {
      await p.click('[data-v=ingresar]'); await p.waitForSelector('#f-cdt');
      assert.ok(await p.isDisabled('#enviar'), 'botón deshabilitado al inicio');
      await p.fill('#cliente', 'Juan Pérez'); await p.fill('#idCliente', '123456'); await p.fill('#pais', 'Colombia');
      await p.fill('#valorCdt', '5000000'); await p.fill('#rendimientos', '5000000'); await p.selectOption('#formaPago', 'Débito');
      assert.strictEqual(await p.inputValue('#valorCdt'), '5,000,000');
      assert.strictEqual(await p.textContent('[data-c=rete20]'), '$ 1,000,000');
      assert.strictEqual(await p.textContent('[data-c=diferencia]'), '$ 800,000');
      assert.strictEqual(await p.textContent('[data-c=saldoNeto]'), '$ 4,000,000');
      assert.ok(!(await p.isDisabled('#enviar')), 'botón habilitado cuando todo válido');
      await p.fill('#rendimientos', '6000000');
      assert.ok(await p.isDisabled('#enviar'), 'rendimientos > CDT bloquea');
      await p.fill('#rendimientos', '5000000');
      await p.screenshot({ path: `${OUT}/${rol}-${nombre}-form.png`, fullPage: true });
      await p.click('#enviar'); await p.click('.velo [data-r="1"]'); await p.waitForSelector('text=enviado');
      assert.ok((await p.evaluate('window.__llamadas')).some(l => l[0] === 'guardarCaso'));
    } else {
      await p.click('[data-v=panel]'); await p.waitForSelector('table.t');
      await p.screenshot({ path: `${OUT}/${rol}-${nombre}-panel.png` });
      await p.click('tr[data-id=CDT001]'); await p.waitForSelector('#d-tarifa');
      await p.fill('#d-tarifa', '15');
      assert.strictEqual(await p.textContent('.modal [data-c=rete20]'), '$ 750,000');
      assert.strictEqual(await p.textContent('.modal [data-c=diferencia]'), '$ 550,000');
      await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/${rol}-${nombre}-detalle.png` });
      await p.fill('#d-tarifa', '150'); assert.ok((await p.textContent('#d-banner')).includes('entre 0 y 100'));
    }
    await p.close();
  }
  await b.close();
  assert.deepStrictEqual(errores, [], 'errores de consola: ' + errores.join('; '));
  console.log('UI OK', rol);
})().catch(e => { console.error('UI FALLÓ:', e.message); process.exit(1); });
