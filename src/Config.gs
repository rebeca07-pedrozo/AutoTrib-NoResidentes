/**
 * Config.gs — Constantes globales de AutoTrib-NoResidentes.
 * Los valores operativos (tarifas, correos) viven en la hoja CONFIG;
 * aquí solo están nombres de hojas, columnas, colores y listas fijas.
 */

var APP = {
  NOMBRE: 'AutoTrib - No Residentes',
  ZONA: 'America/Bogota',
  DOMINIO: 'dav.com.co',
  VALIDAR_DOMINIO: false,   // true = solo correos @dav.com.co
  DIAS_ALERTA: 5,           // días antes del vencimiento para avisar
  HORA_ALERTA: 8,           // hora diaria del trigger
  NOMBRE_REMITENTE: 'AutoTrib | Impuestos Davivienda'   // nombre visible en los correos (se envían como noreply)
};

var COLORES = {
  ROJO: '#E41F13',          // color predominante
  ROJO_OSCURO: '#A9130A',
  AZUL: '#003D82',          // acento secundario
  VERDE: '#1B5E20',
  BLANCO: '#FFFFFF',
  GRIS_CLARO: '#F5F5F5',
  GRIS_OSCURO: '#999999'
};

var HOJAS = {
  CONFIG: 'CONFIG',
  ACCESOS: 'ACCESOS',
  CDT: 'CASOS_CDT',
  ALERTAS: 'ALERTAS',
  AUDITORIA: 'AUDITORÍA',
  ROLES: 'ROLES'
};

var ROLES = { OFICINA: 'Oficina', OPERATIVO: 'Operativo', IMPUESTOS: 'Impuestos' };

/** Roles que gestionan casos (aprueban, ajustan tarifa, ven todo). */
var GESTORES = [ROLES.OPERATIVO, ROLES.IMPUESTOS];
/** Roles que pueden ingresar CDT. */
var INGRESANTES = [ROLES.OFICINA, ROLES.IMPUESTOS];

var ESTADOS = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  PAGADO: 'Pagado'
};

var FORMAS_PAGO = ['Débito de cuenta', 'Efectivo'];

/** Parámetros de la hoja CONFIG: [parámetro, valor por defecto, clave interna]. */
var CONFIG_BASE = [
  ['Tarifa No Residente (%)', 20, 'tarifaNoResidente'],
  ['Tarifa Sistema (%)', 4, 'tarifaSistema'],
  ['Monto Mínimo Retención', 84000, 'montoMinimo'],
  ['Correo Admin', 'admin@dav.com.co', 'correoAdmin'],
  ['Extensión Operativo', '2345', 'extOperativo'],
  ['Extensión Caja', '1234', 'extCaja'],
  ['Rol por defecto', 'Oficina', 'rolDefecto'],
  ['ID Imagen Logo', '', 'imgLogo'],
  ['ID Imagen Triángulos', '', 'imgTriangulos'],
  ['ID Imagen Fondo Bienvenida', '', 'imgBienvenida'],
  ['ID Imagen Fondo Carga', '', 'imgCarga']
];

/** Definición de roles (se vuelca a la hoja ROLES como referencia). */
var ROLES_DEFINICION = [
  ['Oficina', 'Por defecto para cualquier correo que no esté en ACCESOS con otro rol.',
   'Ingresar CDT (los correos le llegan a ella misma), ver solo los casos donde su correo es destinatario, ver instrucciones de pago, confirmar pago, editar la fecha de vencimiento.'],
  ['Operativo', 'Gestión sin ingreso. Se asigna a mano en ACCESOS.',
   'Panel de gestión: ver todos los casos, aprobar/rechazar (individual y lote), cambiar tarifa %, alertas, reportes. No ingresa CDT.'],
  ['Impuestos', 'Leydi Y Librado Bernal y el equipo de Impuestos. Se asigna a mano en ACCESOS.',
   'Las dos visuales: ingresar CDT en nombre de una o varias oficinas (indicando los correos destinatarios, para que las notificaciones lleguen a ellas y no a quien digita) y gestionarlos como Operativo.']
];

/** Cabeceras de cada hoja. En CASOS_CDT el orden coincide con CDT_CLAVES. */
var CABECERAS = {
  ACCESOS: ['email', 'nombre', 'rol', 'activo', 'oficina'],
  CDT: ['ID Caso', 'Fecha Ingesta', 'Cliente', 'ID Cliente', 'País', 'Valor CDT', 'Rendimientos',
        'Rete4%', 'Rete20%', 'Diferencia', 'Saldo Neto', 'Vencimiento', 'Forma Pago', 'Status',
        'Tarifa%', 'Notas Leydi', 'Aprobado Por', 'Fecha Aprobación', 'Oficina', 'Ingresado Por',
        'Email Oficina', 'Notas Oficina', 'Fecha Pago', 'Correos Destino'],
  ALERTAS: ['ID Caso', 'Fecha Vencimiento', 'Días para Vencer', 'Status'],
  AUDITORIA: ['Timestamp', 'Usuario', 'Acción', 'ID Caso', 'Detalle']
};

var CDT_CLAVES = ['id', 'fechaIngesta', 'cliente', 'idCliente', 'pais', 'valorCdt', 'rendimientos',
  'rete4', 'rete20', 'diferencia', 'saldoNeto', 'vencimiento', 'formaPago', 'status',
  'tarifa', 'notasLeydi', 'aprobadoPor', 'fechaAprobacion', 'oficina', 'ingresadoPor',
  'emailOficina', 'notasOficina', 'fechaPago', 'correosDestino'];

var CDT_FECHAS = ['fechaIngesta', 'vencimiento', 'fechaAprobacion', 'fechaPago'];

var ALERTAS_CLAVES = ['id', 'vencimiento', 'dias', 'status'];

var PAISES = ['Alemania', 'Arabia Saudita', 'Argentina', 'Aruba', 'Australia', 'Austria', 'Bahamas',
  'Barbados', 'Bélgica', 'Belice', 'Bolivia', 'Brasil', 'Canadá', 'Chile', 'China', 'Colombia',
  'Corea del Sur', 'Costa Rica', 'Croacia', 'Cuba', 'Curazao', 'Dinamarca', 'Ecuador', 'Egipto',
  'El Salvador', 'Emiratos Árabes Unidos', 'Eslovaquia', 'Eslovenia', 'España', 'Estados Unidos',
  'Estonia', 'Filipinas', 'Finlandia', 'Francia', 'Grecia', 'Guatemala', 'Haití', 'Honduras',
  'Hong Kong', 'Hungría', 'India', 'Indonesia', 'Irlanda', 'Islas Caimán', 'Islas Vírgenes Británicas',
  'Israel', 'Italia', 'Jamaica', 'Japón', 'Letonia', 'Lituania', 'Luxemburgo', 'Malasia', 'Malta',
  'México', 'Mónaco', 'Nicaragua', 'Noruega', 'Nueva Zelanda', 'Países Bajos', 'Panamá', 'Paraguay',
  'Perú', 'Polonia', 'Portugal', 'Puerto Rico', 'Reino Unido', 'República Checa',
  'República Dominicana', 'Rumania', 'Rusia', 'Singapur', 'Sudáfrica', 'Suecia', 'Suiza',
  'Tailandia', 'Taiwán', 'Trinidad y Tobago', 'Turquía', 'Ucrania', 'Uruguay', 'Venezuela', 'Vietnam'];
