import * as svc from '../services/docenteMateria.service.js';

const parseRAListParams = (req) => {
  const { _start, _end, _sort, _order, filter } = req.query;
  const start = parseInt(_start ?? 0, 10) || 0;
  const end = parseInt(_end ?? 0, 10) || 0;
  const limit = _start !== undefined && _end !== undefined ? Math.max(0, end - start) : undefined;
  const offset = _start !== undefined && _end !== undefined ? Math.max(0, start) : undefined;
  let raw = {};
  if (filter) { try { raw = JSON.parse(filter); } catch (_) { /* ignore */ } }
  // Permitir solo: id_docente, numero_documento (DNI) e id_ciclo
  const filters = {};
  if (raw.id_docente !== undefined) filters.id_docente = raw.id_docente;
  if (raw.numero_documento !== undefined) filters.numero_documento = raw.numero_documento;
  if (raw.id_ciclo !== undefined) filters.id_ciclo = raw.id_ciclo;
  // También aceptar query params directos si vinieran
  if (req.query.id_docente !== undefined) filters.id_docente = req.query.id_docente;
  if (req.query.numero_documento !== undefined) filters.numero_documento = req.query.numero_documento;
  if (req.query.id_ciclo !== undefined) filters.id_ciclo = req.query.id_ciclo;
  return { limit, offset, sort: _sort, order: _order, filters };
};

export const list = async (req, res, next) => {
  try {
    const { limit, offset, sort, order, filters } = parseRAListParams(req);
    if (limit !== undefined && offset !== undefined) {
      const { data, total } = await svc.listAsignaciones(limit, offset, { sort, order, filters });
      const endIndex = data.length > 0 ? offset + data.length - 1 : offset;
      res.set('Content-Range', `docentes-materias-curso ${offset}-${endIndex}/${total}`);
      res.set('Access-Control-Expose-Headers', 'Content-Range');
      return res.status(200).json(data);
    }
    // Legacy pagination (page/perPage)
    const page = parseInt(req.query.page || 1, 10);
    const perPage = parseInt(req.query.perPage || 10, 10);
    const l = perPage;
    const o = (page - 1) * perPage;
    const { data, total } = await svc.listAsignaciones(l, o, { sort: req.query.sort, order: req.query.order, filters });
    return res.status(200).json({ data, total });
  } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await svc.getAsignacionById(id);
    if (!data) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.status(200).json(data);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await svc.createAsignacion(req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await svc.updateAsignacion(id, req.body);
    if (!data) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.status(200).json(data);
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hard = String(req.query.hard || 'false').toLowerCase() === 'true';
    const data = await svc.deleteAsignacion(id, { hard });
    if (!data) return res.status(404).json({ error: 'Asignación no encontrada' });
    // Para RA, devolver al menos { id }
    if (hard) return res.status(200).json({ id });
    return res.status(200).json(data);
  } catch (err) { next(err); }
};
