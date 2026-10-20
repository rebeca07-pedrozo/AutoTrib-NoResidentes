// Genera docs/Manual_Usuario_AutoTrib.pdf a partir de docs/MANUAL_USUARIO.md (render simple) con Chromium.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const md = fs.readFileSync(path.join(__dirname, 'MANUAL_USUARIO.md'), 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
let html = '', lista = null;
const cierra = () => { if (lista) { html += `</${lista}>`; lista = null; } };
md.split('\n').forEach(l => {
  let m;
  if ((m = /^!\[(.*?)\]\((.*?)\)/.exec(l))) { cierra(); const b64 = fs.readFileSync(path.join(__dirname, m[2])).toString('base64'); html += `<figure><img src="data:image/png;base64,${b64}"><figcaption>${esc(m[1])}</figcaption></figure>`; }
  else if ((m = /^(#{1,3}) (.*)/.exec(l))) { cierra(); html += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; }
  else if ((m = /^\d+\. (.*)/.exec(l))) { if (lista !== 'ol') { cierra(); html += '<ol>'; lista = 'ol'; } html += `<li>${inline(m[1])}</li>`; }
  else if ((m = /^- (.*)/.exec(l))) { if (lista !== 'ul') { cierra(); html += '<ul>'; lista = 'ul'; } html += `<li>${inline(m[1])}</li>`; }
  else if (l.trim()) { cierra(); html += `<p>${inline(l)}</p>`; } else cierra();
});
cierra();
const doc = `<html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;color:#1d2733;font-size:12.5px;line-height:1.5}
.portada{background:#003D82;color:#fff;padding:40px;border-bottom:8px solid #E41F13;margin-bottom:24px;border-radius:8px}
.portada h1{color:#fff;margin:0;font-size:30px} h1{color:#003D82} h2{color:#003D82;border-bottom:2px solid #E41F13;padding-bottom:4px;margin-top:26px}
h3{color:#003D82} figure{margin:12px 0;text-align:center;page-break-inside:avoid} img{max-width:100%;border:1px solid #ddd;border-radius:8px}
figcaption{font-size:11px;color:#777} code{background:#f5f5f5;padding:1px 4px;border-radius:3px}
</style></head><body><div class="portada"><div style="font-size:14px;letter-spacing:2px">🏦 BANCO DAVIVIENDA</div><h1>AutoTrib · No Residentes</h1><div>Manual de usuario</div></div>${html}</body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const p = await b.newPage(); await p.setContent(doc);
  await p.pdf({ path: path.join(__dirname, 'Manual_Usuario_AutoTrib.pdf'), format: 'A4', margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' }, printBackground: true });
  await b.close(); console.log('PDF generado');
})();
