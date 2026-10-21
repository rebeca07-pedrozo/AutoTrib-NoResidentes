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
  HORA_ALERTA: 8            // hora diaria del trigger
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
  LEASING: 'CASOS_LEASING',
  ALERTAS: 'ALERTAS',
  AUDITORIA: 'AUDITORÍA',
  ROLES: 'ROLES'
};

var ROLES = { OFICINA: 'Oficina', OPERATIVO: 'Operativo', CONTABILIDAD: 'Contabilidad' };

var ESTADOS = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  PAGADO: 'Pagado'
};

var FORMAS_PAGO = ['Débito', 'Efectivo', 'Transferencia'];

/** Parámetros de la hoja CONFIG: [parámetro, valor por defecto, clave interna]. */
var CONFIG_BASE = [
  ['Tarifa No Residente (%)', 20, 'tarifaNoResidente'],
  ['Tarifa Sistema (%)', 4, 'tarifaSistema'],
  ['Monto Mínimo Retención', 84000, 'montoMinimo'],
  ['Correo Admin', 'admin@dav.com.co', 'correoAdmin'],
  ['Correo Contabilidad', 'contabilidad@dav.com.co', 'correoContabilidad'],
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
  ['Oficina', 'Por defecto para cualquier correo que no esté en ACCESOS como otro rol.',
   'Ingresar CDT, ver solo SUS casos, ver instrucciones de pago, confirmar pago, editar fecha/forma de pago desde la alerta.'],
  ['Operativo', 'Leydi y administradores. Se asigna a mano en ACCESOS.',
   'Todo lo de Oficina sobre cualquier caso, más: aprobar/rechazar (individual y lote), cambiar tarifa %, cruce Leasing, alertas, reportes.'],
  ['Contabilidad', 'Se asigna a mano en ACCESOS.',
   'Solo lectura de casos Aprobados y Pagados, reportes y descarga. Recibe correos de casos listos para registro.']
];

/** Cabeceras de cada hoja. En CASOS_CDT el orden coincide con CDT_CLAVES. */
var CABECERAS = {
  ACCESOS: ['email', 'nombre', 'rol', 'activo', 'oficina'],
  CDT: ['ID Caso', 'Fecha Ingesta', 'Cliente', 'ID Cliente', 'País', 'Valor CDT', 'Rendimientos',
        'Rete4%', 'Rete20%', 'Diferencia', 'Saldo Neto', 'Vencimiento', 'Forma Pago', 'Status',
        'Tarifa%', 'Notas Leydi', 'Aprobado Por', 'Fecha Aprobación', 'Oficina', 'Ingresado Por',
        'Email Oficina', 'Notas Oficina', 'Fecha Pago'],
  LEASING: ['# Cuenta', '# Crédito', '# Recibo', 'Valor Operativo', 'Valor Contabilidad',
            'Diferencia', '% Variación', 'Estado', 'Lote', 'Cargado Por', 'Notas'],
  ALERTAS: ['ID Caso', 'Fecha Vencimiento', 'Días para Vencer', 'Status'],
  AUDITORIA: ['Timestamp', 'Usuario', 'Acción', 'ID Caso', 'Detalle']
};

var CDT_CLAVES = ['id', 'fechaIngesta', 'cliente', 'idCliente', 'pais', 'valorCdt', 'rendimientos',
  'rete4', 'rete20', 'diferencia', 'saldoNeto', 'vencimiento', 'formaPago', 'status',
  'tarifa', 'notasLeydi', 'aprobadoPor', 'fechaAprobacion', 'oficina', 'ingresadoPor',
  'emailOficina', 'notasOficina', 'fechaPago'];

var CDT_FECHAS = ['fechaIngesta', 'vencimiento', 'fechaAprobacion', 'fechaPago'];

var LEASING_CLAVES = ['cuenta', 'credito', 'recibo', 'valorOperativo', 'valorContabilidad',
  'diferencia', 'variacion', 'estado', 'lote', 'cargadoPor', 'notas'];

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
