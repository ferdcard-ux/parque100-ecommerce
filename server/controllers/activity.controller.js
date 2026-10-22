import { createInteractionRecord, writeActivityRecord } from '../utils/activity-log.js';

const ALLOWED_FIELDS = new Set(['event', 'resourceId']);
const PRODUCT_EVENTS = new Set([
  'cart.add', 'cart.remove', 'favorite.add', 'favorite.remove',
]);

/** Resuelve el nombre del producto para dar contexto a la interacción. */
async function productName(resourceId) {
  if (typeof resourceId !== 'string' && typeof resourceId !== 'number') return null;
  try {
    // Importación diferida: una petición inválida no abre el pool MySQL.
    const { default: productModel } = await import('../models/product.model.js');
    const product = await productModel.findById(resourceId);
    return product?.Nombre || null;
  } catch {
    return null; // El registro no debe fallar si el producto ya no existe.
  }
}

export const activityController = {
  async recordInteraction(req, res) {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some((key) => !ALLOWED_FIELDS.has(key))
      || typeof body.event !== 'string') {
      return res.status(400).json({ error: 'Interacción no válida.' });
    }

    const label = PRODUCT_EVENTS.has(body.event)
      ? await productName(body.resourceId)
      : null;
    const record = createInteractionRecord(
      req, body.event, body.resourceId, new Date(), label);
    if (!record) {
      return res.status(400).json({ error: 'Interacción no permitida.' });
    }
    const written = await writeActivityRecord(record);
    if (!written) {
      return res.status(503).json({ error: 'No fue posible registrar la interacción.' });
    }
    return res.status(202).json({ recorded: true });
  },
};

export default activityController;
