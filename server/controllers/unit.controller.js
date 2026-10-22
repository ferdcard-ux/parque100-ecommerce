import unitModel from '../models/unit.model.js';

function validatedName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length > 0 && name.length <= 30 ? name : null;
}

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const unitController = {
  async list(_req, res) {
    try {
      return res.json(await unitModel.findAll());
    } catch {
      return res.status(500).json({ error: 'No fue posible cargar las unidades de medida.' });
    }
  },

  async create(req, res) {
    const name = validatedName(req.body?.Nombre_Unidad);
    if (!name) return res.status(400).json({ error: 'El nombre debe tener entre 1 y 30 caracteres.' });
    try {
      if (await unitModel.findByName(name)) {
        return res.status(409).json({ error: 'Ya existe una unidad con ese nombre.' });
      }
      const id = await unitModel.create(name);
      return res.status(201).json({ ID_Unidad: id, Nombre_Unidad: name });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una unidad con ese nombre.' });
      return res.status(500).json({ error: 'No fue posible crear la unidad de medida.' });
    }
  },

  async update(req, res) {
    const id = validId(req.params.id);
    const name = validatedName(req.body?.Nombre_Unidad);
    if (!id || !name) return res.status(400).json({ error: 'Datos de unidad inválidos.' });
    try {
      const current = (await unitModel.findAll()).find((item) => Number(item.ID_Unidad) === id);
      if (!current) return res.status(404).json({ error: 'Unidad de medida no encontrada.' });
      if (await unitModel.findByName(name, id)) {
        return res.status(409).json({ error: 'Ya existe una unidad con ese nombre.' });
      }
      await unitModel.update(id, name, current.Nombre_Unidad);
      return res.json({ ID_Unidad: id, Nombre_Unidad: name });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una unidad con ese nombre.' });
      return res.status(500).json({ error: 'No fue posible actualizar la unidad de medida.' });
    }
  },

  async remove(req, res) {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Identificador de unidad inválido.' });
    try {
      const current = (await unitModel.findAll()).find((item) => Number(item.ID_Unidad) === id);
      if (!current) return res.status(404).json({ error: 'Unidad de medida no encontrada.' });
      await unitModel.remove(id, current.Nombre_Unidad);
      return res.json({ message: 'Unidad de medida eliminada.' });
    } catch (error) {
      if (error.code === 'UNIT_IN_USE') return res.status(409).json({ error: error.message });
      return res.status(500).json({ error: 'No fue posible eliminar la unidad de medida.' });
    }
  },
};

export default unitController;
