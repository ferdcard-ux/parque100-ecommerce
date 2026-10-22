import { createInteractionRecord, writeActivityRecord } from '../utils/activity-log.js';

const ALLOWED_FIELDS = new Set(['event', 'resourceId']);

export const activityController = {
  async recordInteraction(req, res) {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some((key) => !ALLOWED_FIELDS.has(key))
      || typeof body.event !== 'string') {
      return res.status(400).json({ error: 'Interacción no válida.' });
    }

    const record = createInteractionRecord(req, body.event, body.resourceId);
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
