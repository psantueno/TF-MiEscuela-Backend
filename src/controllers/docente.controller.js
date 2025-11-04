import { getDocentes } from '../services/docente.service.js';

const parseRAListParams = (req) => {
  const { _start, _end, _sort, _order, apellido, nombre, numero_documento } = req.query;
  const start = parseInt(_start ?? 0, 10) || 0;
  const end = parseInt(_end ?? 0, 10) || 0;
  const limit = _start !== undefined && _end !== undefined ? Math.max(0, end - start) : undefined;
  const offset = _start !== undefined && _end !== undefined ? Math.max(0, start) : undefined;
  return {
    limit,
    offset,
    sort: _sort,
    order: _order,
    filters: { apellido, nombre, numero_documento }
  };
};

// getSinAsignacion endpoint eliminado

const parseDocentesListParams = (req) => {
  const { _start, _end, _sort, _order, q, apellido, nombre, numero_documento, filter } = req.query;
  const start = parseInt(_start ?? 0, 10) || 0;
  const end = parseInt(_end ?? 0, 10) || 0;
  const limit = _start !== undefined && _end !== undefined ? Math.max(0, end - start) : undefined;
  const offset = _start !== undefined && _end !== undefined ? Math.max(0, start) : undefined;
  let jsonFilter = {};
  if (filter) { try { jsonFilter = JSON.parse(filter); } catch { jsonFilter = {}; } }
  const ids = Array.isArray(jsonFilter.id) ? jsonFilter.id.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n)) : undefined;
  return { limit, offset, sort: _sort, order: _order, q, filters: { apellido, nombre, numero_documento, ids } };
};

export const listDocentes = async (req, res, next) => {
  try {
    const ra = parseDocentesListParams(req);
    // getMany por ids: responder solo data sin Content-Range
    if (ra.filters?.ids && ra.filters.ids.length > 0) {
      const { data } = await getDocentes({ ...ra, limit: undefined, offset: undefined });
      return res.status(200).json({ data });
    }
    if (ra.limit !== undefined && ra.offset !== undefined) {
      const { data, total } = await getDocentes(ra);
      res.set('Content-Range', `docentes ${ra.offset}-${ra.offset + data.length - 1}/${total}`);
      res.set('Access-Control-Expose-Headers', 'Content-Range');
      return res.status(200).json(data);
    }
    const page = parseInt(req.query.page || 1, 10);
    const perPage = parseInt(req.query.perPage || 10, 10);
    const sort = req.query.sort;
    const order = req.query.order;
    const limit = perPage;
    const offset = (page - 1) * perPage;
    const q = req.query.q;
    let ids;
    if (req.query.filter) { try { const jf = JSON.parse(req.query.filter); if (Array.isArray(jf.id)) ids = jf.id; } catch {} }
    const filters = { apellido: req.query.apellido, nombre: req.query.nombre, numero_documento: req.query.numero_documento, ids };
    const { data, total } = await getDocentes({ limit, offset, sort, order, q, filters });
    return res.status(200).json({ data, total });
  } catch (err) { next(err); }
};
