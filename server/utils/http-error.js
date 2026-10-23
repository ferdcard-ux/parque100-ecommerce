/**
 * @fileoverview Respuesta uniforme ante errores de controladores.
 * Solo los errores de negocio creados con `statusCode` exponen su mensaje;
 * cualquier otro (MySQL, sistema) responde un texto generico y se registra
 * en el servidor, para no filtrar detalles internos al cliente.
 */

/**
 * Envia el error al cliente sin exponer detalles internos.
 *
 * @param {import('express').Response} res - Respuesta HTTP.
 * @param {Error & { statusCode?: number }} err - Error capturado.
 * @param {Object} [extra] - Campos adicionales del cuerpo (p. ej. `{ success: false }`).
 * @returns {import('express').Response} La respuesta enviada.
 */
export function sendError(res, err, extra = {}) {
  const status = Number(err?.statusCode);
  if (Number.isInteger(status) && status >= 400 && status < 600) {
    return res.status(status).json({ ...extra, error: err.message });
  }
  console.error('[error]', err?.message || err);
  return res.status(500).json({ ...extra, error: 'Error interno del servidor' });
}

export default sendError;
