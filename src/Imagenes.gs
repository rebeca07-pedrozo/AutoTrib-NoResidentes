/**
 * Imagenes.gs — Imágenes de marca tomadas de Google Drive por ID (hoja CONFIG).
 * Parámetros: ID Imagen Logo, ID Imagen Triángulos, ID Imagen Fondo Bienvenida, ID Imagen Fondo Carga.
 * El ID es el texto entre /d/ y /view en el enlace del archivo de Drive. La cuenta que despliega
 * la aplicación debe poder ver el archivo; los usuarios finales no necesitan permiso.
 * Las imágenes se convierten a data URI y se guardan en caché 6 h (recomendado: menos de 500 KB cada una).
 */

var IMG_MAX_BYTES = 2 * 1024 * 1024;
var IMG_CACHE_SEG = 21600;
var IMG_TROZO = 90000;      // CacheService admite ~100 KB por clave
var logoBlobMemo_ = null;

function idDriveValido_(id) { return /^[A-Za-z0-9_\-]{10,120}$/.test(String(id || '').trim()); }

/** ID de Drive o enlace completo → ID limpio. */
function limpiarIdDrive_(v) {
  var s = String(v || '').trim();
  var m = /\/d\/([A-Za-z0-9_\-]+)/.exec(s) || /[?&]id=([A-Za-z0-9_\-]+)/.exec(s);
  return m ? m[1] : s;
}

var IMG_REDUCIR_DESDE = 700 * 1024;   // por encima de esto se pide una versión reducida a Drive

/** Versión reducida (miniatura) de Drive a 'ancho' px. Null si no se puede. */
function miniaturaDrive_(id, ancho) {
  try {
    var cab = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
    var r = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '?fields=thumbnailLink&supportsAllDrives=true', { headers: cab, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return null;
    var link = JSON.parse(r.getContentText()).thumbnailLink;
    if (!link) return null;
    var r2 = UrlFetchApp.fetch(link.replace(/=s\d+(-c)?$/, '=s' + ancho), { headers: cab, muteHttpExceptions: true });
    return r2.getResponseCode() === 200 ? r2.getBlob() : null;
  } catch (err) {
    Logger.log('Miniatura ' + id + ': ' + err.message);
    return null;
  }
}

/** Lee la imagen de Drive. Devuelve { blob, motivo }: blob null y motivo explicando el fallo. */
function leerImagen_(id, ancho) {
  id = limpiarIdDrive_(id);
  if (!idDriveValido_(id)) return { blob: null, motivo: 'ID vacío o con formato inválido' };
  var archivo;
  try { archivo = DriveApp.getFileById(id); }
  catch (err) { return { blob: null, motivo: 'Drive no permite abrir el archivo (¿falta autorizar Drive o el archivo no está compartido con quien despliega?): ' + err.message }; }
  var blob;
  try { blob = archivo.getBlob(); }
  catch (err) { return { blob: null, motivo: 'No se pudo leer el archivo: ' + err.message }; }
  var tipo = String(blob.getContentType() || '');
  if (tipo.indexOf('image/') !== 0) return { blob: null, motivo: 'El archivo no es una imagen (es ' + tipo + ')' };
  var peso = blob.getBytes().length;
  if (peso > IMG_REDUCIR_DESDE && tipo !== 'image/svg+xml') {
    var mini = miniaturaDrive_(id, ancho || 1600);
    if (mini) return { blob: mini, motivo: 'OK (reducida de ' + Math.round(peso / 1024) + ' KB)' };
  }
  if (peso > IMG_MAX_BYTES) return { blob: null, motivo: 'Pesa ' + (peso / 1048576).toFixed(1) + ' MB y no se pudo reducir (máximo 2 MB)' };
  return { blob: blob, motivo: 'OK (' + Math.round(peso / 1024) + ' KB)' };
}

function blobImagen_(id, ancho) {
  var r = leerImagen_(id, ancho);
  if (!r.blob) Logger.log('Imagen ' + id + ': ' + r.motivo);
  return r.blob;
}

/** Devuelve 'data:image/...;base64,...' o '' si no hay ID o no se pudo leer. */
function imagenDataUri_(id, ancho) {
  id = limpiarIdDrive_(id);
  if (!idDriveValido_(id)) return '';
  var clave = 'img_' + id + '_' + (ancho || 0);
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(clave + '_n'));
  if (n) {
    var partes = [];
    for (var i = 0; i < n; i++) partes.push(cache.get(clave + '_' + i));
    if (partes.every(function (p) { return p !== null; })) return partes.join('');
  }
  var blob = blobImagen_(id, ancho);
  if (!blob) return '';
  var uri = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  try {
    var trozos = {}, k = 0;
    for (var p = 0; p < uri.length; p += IMG_TROZO) trozos[clave + '_' + (k++)] = uri.substring(p, p + IMG_TROZO);
    trozos[clave + '_n'] = String(k);
    cache.putAll(trozos, IMG_CACHE_SEG);
  } catch (err) { Logger.log('Caché de imagen: ' + err.message); }
  return uri;
}

/**
 * DIAGNÓSTICO: ejecútalo desde el editor (o menú AutoTrib → Diagnosticar imágenes).
 * Dice, para cada imagen, qué ID leyó y por qué cargó o no. No usa la caché.
 */
function diagnosticarImagenes() {
  var cfg = obtenerConfig();
  var lista = [['Logo', cfg.imgLogo, 600], ['Triángulos', cfg.imgTriangulos, 1000], ['Fondo Bienvenida', cfg.imgBienvenida, 1600], ['Fondo Carga', cfg.imgCarga, 1600]];
  var lineas = lista.map(function (x) {
    if (!String(x[1] || '').trim()) return x[0] + ': SIN ID (revisa CONFIG o Propiedades de script)';
    var r = leerImagen_(x[1], x[2]);
    return x[0] + ' [' + limpiarIdDrive_(x[1]) + ']: ' + r.motivo;
  });
  var texto = lineas.join('\n');
  Logger.log(texto);
  try { SpreadsheetApp.getUi().alert('Diagnóstico de imágenes', texto, SpreadsheetApp.getUi().ButtonSet.OK); } catch (err) { /* sin UI */ }
  return texto;
}

/** Imágenes necesarias para pintar la primera pantalla (se incrustan en el HTML). */
function imagenesIniciales_() {
  try {
    var cfg = obtenerConfig();
    return { logo: imagenDataUri_(cfg.imgLogo, 600), carga: imagenDataUri_(cfg.imgCarga, 1600) };
  } catch (err) {
    return { logo: '', carga: '' };
  }
}

/** Imágenes decorativas; la interfaz las pide después de iniciar sesión. */
function obtenerImagenes() {
  exigirUsuario_();
  var cfg = obtenerConfig();
  return { triangulos: imagenDataUri_(cfg.imgTriangulos, 1000), bienvenida: imagenDataUri_(cfg.imgBienvenida, 1600) };
}

/** Logo como blob para insertarlo en correos (cid:logo). Null si no hay logo configurado. */
function blobLogo_() {
  if (logoBlobMemo_ !== null) return logoBlobMemo_ || null;
  var b = null;
  try { b = blobImagen_(obtenerConfig().imgLogo, 600); } catch (err) { b = null; }
  logoBlobMemo_ = b || false;
  return b;
}
