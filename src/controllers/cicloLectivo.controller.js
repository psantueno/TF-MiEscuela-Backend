import * as cicloService from "../services/cicloLectivo.service.js";

const toDateOnly = (value) => {
  if (!value) return null;
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  } catch {
    return null;
  }
};

const mapCiclo = (c) => ({
  id_ciclo: c.id_ciclo,
  anio: c.anio,
  fecha_inicio: toDateOnly(c.fecha_inicio) || c.fecha_inicio,
  fecha_fin: toDateOnly(c.fecha_fin) || c.fecha_fin,
  estado: c.estado,
});

export const getCiclos = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, anio, estado } = req.query;
    const limit = parseInt(perPage);
    const offset = (parseInt(page) - 1) * limit;

    const { data, total } = await cicloService.getCiclos(limit, offset, { anio, estado });
    const mapped = data.map(mapCiclo);
    return res.status(200).json({ data: mapped, total });
  } catch (err) {
    next(err);
  }
};

export const getCiclo = async (req, res, next) => {
  try {
    const { id_ciclo } = req.params;
    const ciclo = await cicloService.getCiclo(id_ciclo);
    if (!ciclo) return res.status(404).json({ error: "Ciclo lectivo no encontrado" });
    return res.status(200).json(mapCiclo(ciclo));
  } catch (err) {
    next(err);
  }
};

export const createCiclo = async (req, res, next) => {
  try {
    const ciclo = await cicloService.createCiclo(req.body);
    return res.status(201).json(mapCiclo(ciclo));
  } catch (err) {
    // Podría ser conflicto por anio único
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El año ya existe' });
    }
    next(err);
  }
};

export const updateCiclo = async (req, res, next) => {
  try {
    const { id_ciclo } = req.params;
    const ciclo = await cicloService.updateCiclo(id_ciclo, req.body);
    if (!ciclo) return res.status(404).json({ error: "Ciclo lectivo no encontrado" });
    return res.status(200).json(mapCiclo(ciclo));
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El año ya existe' });
    }
    next(err);
  }
};

export const deleteCiclo = async (req, res, next) => {
  try {
    const { id_ciclo } = req.params;
    const deleted = await cicloService.deleteCiclo(id_ciclo);
    if (!deleted) return res.status(404).json({ error: "Ciclo lectivo no encontrado" });
    return res.sendStatus(204);
  } catch (err) {
    // Posible violación de clave foránea con cursos
    if (err?.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ error: 'No se puede eliminar: tiene cursos asociados' });
    }
    next(err);
  }
};

