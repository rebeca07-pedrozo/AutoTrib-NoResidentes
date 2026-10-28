# Cómo entrar

Abre el enlace que te compartió el administrador. El sistema identifica tu correo corporativo automáticamente; no hay usuario ni contraseña adicionales. Si es tu primera vez, entras automáticamente con el rol **Oficina**. Si ves **Acceso denegado**, tu acceso fue bloqueado: contacta al administrador.

# Roles

- **Oficina** (por defecto): ingresa CDT y ve solo sus casos.
- **Operativo**: solo gestión (aprueba, ajusta tarifa, alertas y reportes).
- **Impuestos** (Leydi Y Librado Bernal y su equipo): ingresa CDT en nombre de oficinas y gestiona.

El administrador cambia el rol en la hoja ACCESOS; la hoja ROLES explica cada uno.

## Si eres Oficina

![Pantalla de bienvenida de Oficina](img/Oficina-desktop-inicio.png)

1. Pulsa **Ingresar CDT**.
2. Completa nombre, ID, país (escribe para buscar), valor del CDT y rendimientos. Los montos se formatean solos.
3. El cuadro azul calcula en vivo: Rete 4 % ya pagada, Rete 20 % requerida, diferencia a cobrar y saldo neto.
4. Elige la forma de pago y, si lo conoces, la fecha de vencimiento.
5. Cada campo cambia de color: **rojo** falta o inválido, **amarillo** incompleto, **verde** correcto. El botón **Enviar a autorización** se habilita cuando todo está verde.

![Formulario de ingesta con validación en tiempo real](img/Oficina-desktop-form.png)

## Después de enviar

1. Recibes un correo de confirmación y el equipo de Impuestos recibe el aviso.
2. Cuando Impuestos aprueba, te llega el correo **Caso aprobado - Instrucciones de pago** con un botón a la guía paso a paso (Débito, Efectivo o Transferencia).
3. Marca cada paso y pulsa **Marcar como completado**. El equipo de Impuestos es notificado.
4. 5 días antes del vencimiento recibes una alerta: puedes **Editar datos** (fecha, forma de pago, notas) o **Confirmar vencimiento**.
5. En **Mis casos** consultas el estado de todos tus casos.

# Si eres Operativo o Impuestos

1. **Panel revisión**: filtra por estado, oficina o fechas. Toca un caso para abrir el detalle.

![Panel de revisión y autorización](img/Operativo-desktop-panel.png)

2. En el detalle puedes cambiar la **tarifa %** (0 a 100); los valores se recalculan al instante. También puedes ajustar forma de pago, vencimiento y notas.

![Detalle del caso con tarifa editable](img/Operativo-desktop-detalle.png)

3. **Aprobar** envía las instrucciones a la oficina. **Rechazar** exige escribir el motivo. Ambas acciones piden confirmación y quedan en la auditoría.
4. **Aprobar lote**: marca varios casos pendientes y aprueba con sus condiciones actuales.
5. **Alertas**: vencimientos próximos y su estado. **Reportes**: resumen y descarga a Excel (CSV) o PDF (Imprimir).

# Solo Impuestos: ingresar en nombre de una oficina

El formulario trae el apartado **Destinatarios de las notificaciones**. Escribe los correos de las oficinas (separados por coma): todos los avisos de ese caso llegarán a ellas y no a ti. Opcionalmente escribe el nombre de la oficina. Cada oficina verá el caso en **Mis casos**.

# Formas de pago

El valor a registrar es la **retención no descontada** (la diferencia a cobrar que muestra la herramienta).

- **Débito de cuenta:** realizar una ND concepto 18 con contrapartida ingreso 25, de la cuenta de ahorros indicada por el cliente, por ese valor.
- **Efectivo:** realizar un ingreso 25 por ese valor.

Luego guarda el comprobante y marca el caso como completado.

# Preguntas frecuentes

- **¿Puedo editar un caso ya enviado?** La fecha de vencimiento sí: abre el caso en **Mis casos** y usa *Editar fecha de vencimiento* (mientras esté Pendiente o Aprobado). El resto lo ajustan Impuestos u Operativo.
- **¿El país es obligatorio?** No. Escríbelo sin tildes ni mayúsculas y elige de la lista.
- **¿Se pueden borrar casos?** No. Los casos solo cambian de estado y todo cambio queda en la auditoría.
- **¿Funciona en el celular?** Sí. El formulario y el panel están adaptados a pantallas pequeñas.
