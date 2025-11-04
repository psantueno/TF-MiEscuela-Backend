import * as svc from '../services/materiasCurso.service.js';

export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await svc.getById(parseInt(id, 10));
    if (!data) return res.status(404).json({ error: 'Materia-Curso no encontrada' });
    res.status(200).json(data);
  } catch (err) { next(err); }
};

const parseListParams = (req) => {
  const { _start, _end, _sort, _order, q, id_materia, id_curso, id_ciclo, filter } = req.query;
  const start = parseInt(_start ?? 0, 10) || 0;
  const end = parseInt(_end ?? 0, 10) || 0;
  const limit = _start !== undefined && _end !== undefined ? Math.max(0, end - start) : undefined;
  const offset = _start !== undefined && _end !== undefined ? Math.max(0, start) : undefined;
  let jsonFilter = {};
  if (filter) { try { jsonFilter = JSON.parse(filter); } catch { jsonFilter = {}; } }
  const ids = Array.isArray(jsonFilter.id) ? jsonFilter.id.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n)) : undefined;
  return { limit, offset, sort: _sort, order: _order, filters: { q, id_materia, id_curso, id_ciclo, ids } };
};

export const list = async (req, res, next) => {
  try {
    const ra = parseListParams(req);
    if (ra.filters?.ids && ra.filters.ids.length > 0) {
      const { data } = await svc.list(undefined, undefined, { sort: ra.sort, order: ra.order, filters: ra.filters });
      return res.status(200).json({ data });
    }
    if (ra.limit !== undefined && ra.offset !== undefined) {
      const { data, total } = await svc.list(ra.limit, ra.offset, { sort: ra.sort, order: ra.order, filters: ra.filters });
      res.set('Content-Range', `materias-curso ${ra.offset}-${ra.offset + data.length - 1}/${total}`);
      res.set('Access-Control-Expose-Headers', 'Content-Range');
      return res.status(200).json(data);
    }
    const page = parseInt(req.query.page || 1, 10);
    const perPage = parseInt(req.query.perPage || 10, 10);
    const sort = req.query.sort;
    const order = req.query.order;
    const limit = perPage;
    const offset = (page - 1) * perPage;
    const filters = { q: req.query.q, id_materia: req.query.id_materia, id_curso: req.query.id_curso, id_ciclo: req.query.id_ciclo };
    const { data, total } = await svc.list(limit, offset, { sort, order, filters });
    return res.status(200).json({ data, total });
  } catch (err) { next(err); }
};
