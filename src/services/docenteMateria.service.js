import { Op } from 'sequelize';
import { sequelize, DocentesMateriasCurso, Docente, MateriasCurso, Curso, Materia, CiclosLectivos, Usuario } from '../models/index.js';
import { DatabaseError } from '../utils/databaseError.util.js';

const SEP = '|';

export const encodeId = ({ id_docente, id_materia_curso, fecha_inicio }) => {
  const iso = new Date(fecha_inicio).toISOString();
  const safe = encodeURIComponent(iso);
  return `${id_docente}${SEP}${id_materia_curso}${SEP}${safe}`;
};

const safeParseDate = (value) => {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch { return null; }
};

export const decodeId = (id) => {
  const raw = String(id);
  // Nuevo formato con separador seguro y fecha url-encoded
  const parts = raw.split(SEP);
  if (parts.length === 3) {
    const [d, mc, enc] = parts;
    const decoded = decodeURIComponent(enc);
    const dt = safeParseDate(decoded);
    if (!d || !mc || !dt) throw new DatabaseError('ID de asignación inválido', 400);
    return { id_docente: parseInt(d, 10), id_materia_curso: parseInt(mc, 10), fecha_inicio: dt };
  }
  // Compatibilidad: antiguo id con ':' y fecha ISO cruda (contiene ':')
  const legacy = raw.split(':');
  if (legacy.length >= 3) {
    const d = parseInt(legacy[0], 10);
    const mc = parseInt(legacy[1], 10);
    const rest = legacy.slice(2).join(':');
    const maybeDecoded = (() => { try { return decodeURIComponent(rest); } catch { return rest; } })();
    const dt = safeParseDate(maybeDecoded);
    if (Number.isInteger(d) && Number.isInteger(mc) && dt) {
      return { id_docente: d, id_materia_curso: mc, fecha_inicio: dt };
    }
  }
  throw new DatabaseError('ID de asignación inválido', 400);
};

const mapRow = (row) => {
  const json = row.toJSON ? row.toJSON() : row;
  const id = encodeId(json);
  const docenteUsuario = json?.docente?.usuario;
  const curso = json?.materiaCurso?.curso;
  const materia = json?.materiaCurso?.materia;
  const ciclo = curso?.cicloLectivo;
  return {
    id,
    id_docente: json.id_docente,
    id_materia_curso: json.id_materia_curso,
    rol_docente: json.rol_docente,
    fecha_inicio: json.fecha_inicio,
    fecha_fin: json.fecha_fin,
    // Datos convenientes para UI
    docente_apellido: docenteUsuario?.apellido,
    docente_nombre: docenteUsuario?.nombre,
    id_materia: materia?.id_materia,
    materia_nombre: materia?.nombre,
    id_curso: curso?.id_curso,
    curso_anio: curso?.anio_escolar,
    curso_division: curso?.division,
    ciclo_estado: ciclo?.estado,
    ciclo_anio: ciclo?.anio
  };
};

const baseInclude = [
  {
    model: Docente,
    as: 'docente',
    attributes: ['id_docente'],
    include: [{ model: Usuario, as: 'usuario', attributes: ['apellido', 'nombre'] }]
  },
  {
    model: MateriasCurso,
    as: 'materiaCurso',
    attributes: ['id_materia_curso'],
    include: [
      { model: Curso, as: 'curso', attributes: ['id_curso', 'anio_escolar', 'division'], include: [{ model: CiclosLectivos, as: 'cicloLectivo', attributes: ['id_ciclo', 'estado', 'anio'] }] },
      { model: Materia, as: 'materia', attributes: ['id_materia', 'nombre'] }
    ]
  }
];

const toDDMMYYYY = (d) => {
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return undefined;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch { return undefined; }
};

const assertValidRange = (fecha_inicio, fecha_fin) => {
  if (fecha_fin && new Date(fecha_fin).getTime() < new Date(fecha_inicio).getTime()) {
    throw new DatabaseError('La fecha de fin no puede ser anterior a la fecha de inicio.', 400);
  }
};

const checkOverlapAndThrow = async ({ id_docente, id_materia_curso, fecha_inicio, fecha_fin }, ignoreKey) => {
  const where = {
    id_docente,
    id_materia_curso,
    [Op.and]: [
      { fecha_inicio: { [Op.lte]: fecha_fin ? new Date(fecha_fin) : sequelize.fn('NOW') } },
      {
        [Op.or]: [
          { fecha_fin: { [Op.gte]: new Date(fecha_inicio) } },
          { fecha_fin: null }
        ]
      }
    ]
  };
  if (ignoreKey) {
    where[Op.not] = {
      id_docente: ignoreKey.id_docente,
      id_materia_curso: ignoreKey.id_materia_curso,
      fecha_inicio: ignoreKey.fecha_inicio
    };
  }
  const exists = await DocentesMateriasCurso.findOne({ where, attributes: ['id_docente','fecha_inicio','fecha_fin'] });
  if (exists) {
    const fi = toDDMMYYYY(exists.fecha_inicio);
    const ff = exists.fecha_fin ? toDDMMYYYY(exists.fecha_fin) : 'actualidad';
    throw new DatabaseError(`Ya existe una asignación superpuesta para este docente y materia/curso entre ${fi} y ${ff}. Ajustá el período para que no se solape.`, 409);
  }
};

const assertNoOverlap = async ({ id_docente, id_materia_curso, fecha_inicio, fecha_fin }, ignoreKey) => {
  // Reglas de solapamiento para el mismo docente + materia_curso
  // Overlap si: nuevo_inicio <= fin_existente (o fin_existente IS NULL) AND (nuevo_fin IS NULL OR nuevo_fin >= inicio_existente)
  const where = {
    id_docente,
    id_materia_curso,
    [Op.and]: [
      { fecha_inicio: { [Op.lte]: fecha_fin ? new Date(fecha_fin) : sequelize.fn('NOW') } },
      {
        [Op.or]: [
          { fecha_fin: { [Op.gte]: new Date(fecha_inicio) } },
          { fecha_fin: null }
        ]
      }
    ]
  };
  if (ignoreKey) {
    where[Op.not] = {
      id_docente: ignoreKey.id_docente,
      id_materia_curso: ignoreKey.id_materia_curso,
      fecha_inicio: ignoreKey.fecha_inicio
    };
  }
  const exists = await DocentesMateriasCurso.findOne({ where, attributes: ['id_docente'] });
  if (exists) {
    throw new DatabaseError('Ya existe una asignación que se solapa en fechas para este docente y materia/curso.', 409);
  }
};

const assertCicloNoCerrado = async (id_materia_curso) => {
  const rel = await MateriasCurso.findByPk(id_materia_curso, {
    include: [{ model: Curso, as: 'curso', include: [{ model: CiclosLectivos, as: 'cicloLectivo', attributes: ['estado'] }], attributes: ['id_curso'] }],
    attributes: ['id_materia_curso']
  });
  const estado = rel?.curso?.cicloLectivo?.estado?.toLowerCase();
  if (estado === 'cerrado') {
    throw new DatabaseError('No se pueden modificar asignaciones en ciclos lectivos cerrados.', 409);
  }
};

export const listAsignaciones = async (limit, offset, { sort, order, filters = {} }) => {
  const allowed = ['fecha_inicio', 'rol_docente', 'id_docente', 'id_materia_curso'];
  const sortOrder = String(order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const sortColumn = allowed.includes(sort) ? sort : 'fecha_inicio';

  const where = {};
  // filtros directos (admite array para id_docente)
  if (filters.id_docente !== undefined) {
    if (Array.isArray(filters.id_docente)) {
      const ids = filters.id_docente.map(v => parseInt(v, 10)).filter(Number.isFinite);
      if (ids.length > 0) where.id_docente = { [Op.in]: ids };
    } else {
      const v = parseInt(filters.id_docente, 10);
      if (Number.isFinite(v)) where.id_docente = v;
    }
  }

  // includes con posibilidad de filtrar sólo por DNI (numero_documento)
  const include = [
    {
      model: Docente,
      as: 'docente',
      attributes: ['id_docente'],
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['apellido', 'nombre', 'numero_documento'],
        ...(filters.numero_documento ? { where: { numero_documento: { [Op.iLike]: `%${String(filters.numero_documento)}%` } } } : {})
      }]
    },
    {
      model: MateriasCurso,
      as: 'materiaCurso',
      attributes: ['id_materia_curso'],
      include: [
        { model: Curso, as: 'curso', attributes: ['id_curso', 'anio_escolar', 'division'], include: [{ model: CiclosLectivos, as: 'cicloLectivo', attributes: ['id_ciclo', 'estado', 'anio'], ...(filters.id_ciclo ? { where: { id_ciclo: parseInt(filters.id_ciclo, 10) } } : {}) }] },
        { model: Materia, as: 'materia', attributes: ['id_materia', 'nombre'] }
      ]
    }
  ];

  // Obtener filas paginadas
  const rows = await DocentesMateriasCurso.findAll({
    where,
    include,
    limit,
    offset,
    order: [[sortColumn, sortOrder]],
    subQuery: false
  });

  // Contar por agrupación de PK compuesta (evita problemas con DISTINCT + include)
  const grouped = await DocentesMateriasCurso.count({
    where,
    include,
    // group por las 3 columnas de la PK
    group: [
      'DocentesMateriasCurso.id_docente',
      'DocentesMateriasCurso.id_materia_curso',
      'DocentesMateriasCurso.fecha_inicio'
    ]
  });
  let total;
  if (Array.isArray(grouped)) total = grouped.length; // algunos dialectos devuelven array
  else if (grouped && typeof grouped === 'object') total = Object.keys(grouped).length; // otros devuelven object
  else total = Number(grouped) || 0;

  return { data: rows.map(mapRow), total };
};

export const getAsignacionById = async (id) => {
  const key = decodeId(id);
  const row = await DocentesMateriasCurso.findOne({ where: key, include: baseInclude });
  if (!row) return null;
  return mapRow(row);
};

export const createAsignacion = async (payload) => {
  const id_docente = parseInt(payload.id_docente, 10);
  const id_materia_curso = parseInt(payload.id_materia_curso, 10);
  const fecha_inicio = payload.fecha_inicio ? new Date(payload.fecha_inicio) : new Date();
  const fecha_fin = payload.fecha_fin ? new Date(payload.fecha_fin) : null;
  const rol_docente = payload.rol_docente || 'Titular';

  await assertCicloNoCerrado(id_materia_curso);
  assertValidRange(fecha_inicio, fecha_fin);
  await checkOverlapAndThrow({ id_docente, id_materia_curso, fecha_inicio, fecha_fin });
  await assertNoOverlap({ id_docente, id_materia_curso, fecha_inicio, fecha_fin });

  const row = await DocentesMateriasCurso.create({ id_docente, id_materia_curso, rol_docente, fecha_inicio, fecha_fin });
  const fresh = await DocentesMateriasCurso.findOne({ where: { id_docente, id_materia_curso, fecha_inicio }, include: baseInclude });
  return mapRow(fresh || row);
};

export const updateAsignacion = async (id, payload) => {
  const key = decodeId(id);
  await assertCicloNoCerrado(key.id_materia_curso);

  const row = await DocentesMateriasCurso.findOne({ where: key });
  if (!row) return null;

  const next = {
    rol_docente: payload.rol_docente ?? row.rol_docente,
    fecha_inicio: payload.fecha_inicio ? new Date(payload.fecha_inicio) : row.fecha_inicio,
    fecha_fin: payload.fecha_fin !== undefined ? (payload.fecha_fin ? new Date(payload.fecha_fin) : null) : row.fecha_fin
  };

  // si cambió rango, verificar solapamiento
  assertValidRange(next.fecha_inicio, next.fecha_fin);
  await checkOverlapAndThrow({ id_docente: row.id_docente, id_materia_curso: row.id_materia_curso, fecha_inicio: next.fecha_inicio, fecha_fin: next.fecha_fin }, key);
  await assertNoOverlap({ id_docente: row.id_docente, id_materia_curso: row.id_materia_curso, fecha_inicio: next.fecha_inicio, fecha_fin: next.fecha_fin }, key);

  // Si cambió fecha_inicio, debemos borrar y crear (PK cambia)
  const pkChanged = new Date(next.fecha_inicio).getTime() !== new Date(row.fecha_inicio).getTime();
  if (pkChanged) {
    await DocentesMateriasCurso.destroy({ where: key });
    await DocentesMateriasCurso.create({ id_docente: row.id_docente, id_materia_curso: row.id_materia_curso, rol_docente: next.rol_docente, fecha_inicio: next.fecha_inicio, fecha_fin: next.fecha_fin });
    const fresh = await DocentesMateriasCurso.findOne({ where: { id_docente: row.id_docente, id_materia_curso: row.id_materia_curso, fecha_inicio: next.fecha_inicio }, include: baseInclude });
    return mapRow(fresh);
  } else {
    await row.update({ rol_docente: next.rol_docente, fecha_fin: next.fecha_fin });
    const fresh = await DocentesMateriasCurso.findOne({ where: key, include: baseInclude });
    return mapRow(fresh || row);
  }
};

export const deleteAsignacion = async (id, { hard = false } = {}) => {
  const key = decodeId(id);
  await assertCicloNoCerrado(key.id_materia_curso);

  if (hard) {
    const deleted = await DocentesMateriasCurso.destroy({ where: key });
    return deleted ? { id } : null;
  }
  const row = await DocentesMateriasCurso.findOne({ where: key });
  if (!row) return null;
  await row.update({ fecha_fin: sequelize.fn('NOW') });
  const updated = await DocentesMateriasCurso.findOne({ where: key, include: baseInclude });
  return mapRow(updated || row);
};
