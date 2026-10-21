// Genera dist/: lo ÚNICO que hay que copiar a Apps Script (5 archivos).
//   Codigo.gs (todos los .gs de src/ unidos) + Index.html + Estilos.html + Cliente.html + appsscript.json
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src'), dist = path.join(__dirname, 'dist');
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(dist);
const orden = ['Config.gs', 'Code.gs', 'Sheets.gs', 'Imagenes.gs', 'Email.gs', 'Alertas.gs', 'Leasing.gs'];
const todos = fs.readdirSync(src).filter(f => f.endsWith('.gs'));
const faltan = todos.filter(f => !orden.includes(f));
if (faltan.length) { console.error('Agrega a build.js el orden de:', faltan.join(', ')); process.exit(1); }
const cab = '// AUTOGENERADO por build.js a partir de src/*.gs. No editar a mano: edita src/ y ejecuta npm run build.\n\n';
fs.writeFileSync(path.join(dist, 'Codigo.gs'), cab + orden.map(f => `// ===== ${f} =====\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n\n'));
['Index.html', 'Estilos.html', 'Cliente.html', 'appsscript.json'].forEach(f => fs.copyFileSync(path.join(src, f), path.join(dist, f)));
console.log('dist/ listo:', fs.readdirSync(dist).join(', '));
