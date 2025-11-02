import { CiclosLectivos } from "../models/CiclosLectivos.js";

export const cicloNoCerrado = async (req, res, next) => {
  try {
    const id = req.params.id_ciclo ? Number(req.params.id_ciclo) : NaN;
    if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'ID de ciclo inválido' });
    const ciclo = await CiclosLectivos.findByPk(id, { attributes: ['id_ciclo', 'estado'] });
    if (!ciclo) return res.status(404).json({ error: 'Ciclo lectivo no encontrado' });
    if (String(ciclo.estado || '').toLowerCase() === 'cerrado') {
      return res.status(409).json({ error: 'No se puede modificar un ciclo lectivo cerrado' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

