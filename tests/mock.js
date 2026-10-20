// Entorno simulado de Apps Script (Sheets en memoria) para probar la lógica del servidor con Node.
const vm = require('vm'), fs = require('fs'), path = require('path');

function crearEntorno(opts) {
  opts = opts || {};
  const correos = [], hojas = {};
  const estado = { email: opts.email || 'pepito@dav.com.co' };

  function Hoja(nombre) {
    const filas = []; // filas[r][c]
    const h = {
      nombre, filas,
      getLastRow: () => { let n = 0; filas.forEach((f, i) => { if (f && f.some(v => v !== '' && v !== undefined)) n = i + 1; }); return n; },
      getRange(r, c, nr, nc) {
        nr = nr || 1; nc = nc || 1;
        return {
          getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (filas[r - 1 + i] || [])[c - 1 + j] === undefined ? '' : filas[r - 1 + i][c - 1 + j])),
          setValues(v) { v.forEach((fila, i) => { filas[r - 1 + i] = filas[r - 1 + i] || []; fila.forEach((x, j) => { filas[r - 1 + i][c - 1 + j] = x; }); }); return this; },
          setValue(x) { filas[r - 1] = filas[r - 1] || []; filas[r - 1][c - 1] = x; return this; },
          setBackground() { return this; }, setFontColor() { return this; }, setFontWeight() { return this; }, setNumberFormat() { return this; }
        };
      },
      getDataRange() { const n = h.getLastRow(); const w = Math.max(...filas.map(f => (f || []).length), 1); return h.getRange(1, 1, n, w); },
      appendRow(f) { filas[h.getLastRow()] = f.slice(); },
      setFrozenRows() {}, autoResizeColumns() {}, setColumnWidth() {},
      protect: () => ({ setDescription() {}, setWarningOnly() {} })
    };
    return h;
  }
  const libro = {
    getSheetByName: n => hojas[n] || null,
    insertSheet: n => (hojas[n] = Hoja(n)),
    getUrl: () => 'https://docs.google.com/spreadsheets/d/test'
  };
  const triggers = [];
  const ctx = {
    console, Date, Math, JSON, Number, String, Array, Object, RegExp, isNaN, Error,
    Logger: { log: () => {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => libro, flush() {}, getUi() { throw new Error('sin UI'); } },
    Session: { getActiveUser: () => ({ getEmail: () => estado.email }), getEffectiveUser: () => ({ getEmail: () => 'owner@dav.com.co' }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    MailApp: { sendEmail: m => correos.push(m) },
    Utilities: { formatDate: (d, tz, f) => {
      const p = n => String(n).padStart(2, '0');
      return f.replace('yyyy', d.getFullYear()).replace('MM', p(d.getMonth() + 1)).replace('dd', p(d.getDate())).replace('HH', p(d.getHours())).replace('mm', p(d.getMinutes())).replace('ss', p(d.getSeconds())).replace('SSS', String(d.getMilliseconds()).padStart(3, '0'));
    } },
    ScriptApp: {
      getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' }),
      getProjectTriggers: () => triggers, deleteTrigger() {},
      newTrigger: () => { const t = { timeBased: () => t, everyDays: () => t, atHour: () => t, inTimezone: () => t, create: () => { triggers.push(t); } }; return t; }
    },
    HtmlService: {}
  };
  vm.createContext(ctx);
  const src = path.join(__dirname, '..', 'src');
  fs.readdirSync(src).filter(f => f.endsWith('.gs')).forEach(f => vm.runInContext(fs.readFileSync(path.join(src, f), 'utf8'), ctx, { filename: f }));
  return { ctx, correos, hojas, estado, libro, run: code => vm.runInContext(code, ctx) };
}
module.exports = { crearEntorno };
