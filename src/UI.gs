/**
 * UI.gs — Ensamblado de la interfaz. La interfaz es una SPA en tres archivos HTML:
 *   Index.html   → estructura y contenedor
 *   Estilos.html → CSS completo (branding Davivienda, responsivo)
 *   Cliente.html → pantallas: login, bienvenida, formulario, panel, leasing, pagos, alertas
 * Se separan para poder incluirlos con include() y mantener cada archivo legible.
 */

/** Incluye el contenido de otro archivo HTML del proyecto dentro de una plantilla. */
function include(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}
