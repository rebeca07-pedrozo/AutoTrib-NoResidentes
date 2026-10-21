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

function blobImagen_(id) {
  id = limpiarIdDrive_(id);
  if (!idDriveValido_(id)) return null;
  try {
    var blob = DriveApp.getFileById(id).getBlob();
    var tipo = String(blob.getContentType() || '');
    if (tipo.indexOf('image/') !== 0) { Logger.log('Imagen ' + id + ': no es una imagen (' + tipo + ')'); return null; }
    if (blob.getBytes().length > IMG_MAX_BYTES) { Logger.log('Imagen ' + id + ': supera 2 MB'); return null; }
    return blob;
  } catch (err) {
    Logger.log('Imagen ' + id + ': ' + err.message);
    return null;
  }
}

/** Devuelve 'data:image/...;base64,...' o '' si no hay ID o no se pudo leer. */
function imagenDataUri_(id) {
  id = limpiarIdDrive_(id);
  if (!idDriveValido_(id)) return '';
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get('img_' + id + '_n'));
  if (n) {
    var partes = [];
    for (var i = 0; i < n; i++) partes.push(cache.get('img_' + id + '_' + i));
    if (partes.every(function (p) { return p !== null; })) return partes.join('');
  }
  var blob = blobImagen_(id);
  if (!blob) return '';
  var uri = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  try {
    var trozos = {}, k = 0;
    for (var p = 0; p < uri.length; p += IMG_TROZO) trozos['img_' + id + '_' + (k++)] = uri.substring(p, p + IMG_TROZO);
    trozos['img_' + id + '_n'] = String(k);
    cache.putAll(trozos, IMG_CACHE_SEG);
  } catch (err) { Logger.log('Caché de imagen: ' + err.message); }
  return uri;
}

/** Imágenes necesarias para pintar la primera pantalla (se incrustan en el HTML). */
function imagenesIniciales_() {
  try {
    var cfg = obtenerConfig();
    return { logo: imagenDataUri_(cfg.imgLogo), carga: imagenDataUri_(cfg.imgCarga) };
  } catch (err) {
    return { logo: '', carga: '' };
  }
}

/** Imágenes decorativas; la interfaz las pide después de iniciar sesión. */
function obtenerImagenes() {
  exigirUsuario_();
  var cfg = obtenerConfig();
  return { triangulos: imagenDataUri_(cfg.imgTriangulos), bienvenida: imagenDataUri_(cfg.imgBienvenida) };
}

/** Logo como blob para insertarlo en correos (cid:logo). Null si no hay logo configurado. */
function blobLogo_() {
  if (logoBlobMemo_ !== null) return logoBlobMemo_ || null;
  var b = null;
  try { b = blobImagen_(obtenerConfig().imgLogo); } catch (err) { b = null; }
  logoBlobMemo_ = b || false;
  return b;
}
