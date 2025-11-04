import { Op } from 'sequelize';
import { MateriasCurso, Curso, CiclosLectivos, Materia, sequelize } from '../models/index.js';

export const getById = async (id_materia_curso) => {
  const row = await MateriasCurso.findByPk(id_materia_curso, {
    include: [
      { model: Curso, as: 'curso', attributes: ['id_curso', 'anio_escolar', 'division'], include: [{ model: CiclosLectivos, as: 'cicloLectivo', attributes: ['id_ciclo', 'estado', 'anio'] }] },
      { model: Materia, as: 'materia', attributes: ['id_materia', 'nombre'] }
    ],
    attributes: ['id_materia_curso', 'id_curso', 'id_materia']
  });
  if (!row) return null;
  const j = row.toJSON ? row.toJSON() : row;
  return {
    id: j.id_materia_curso,
    id_materia_curso: j.id_materia_curso,
    id_curso: j.id_curso ?? j.curso?.id_curso,
    id_materia: j.id_materia ?? j.materia?.id_materia,
    materia_nombre: j.materia?.nombre,
    curso_anio_escolar: j.curso?.anio_escolar,
    curso_division: j.curso?.division,
    curso_label: j.curso ? `${j.curso.anio_escolar}º ${j.curso.division}` : undefined,
    id_ciclo: j.curso?.cicloLectivo?.id_ciclo,
    ciclo_estado: j.curso?.cicloLectivo?.estado,
    ciclo_anio: j.curso?.cicloLectivo?.anio,
  };
};


export const list = async (limit, offset, { sort, order, filters = {} }) => {
  const sortOrder = String(order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const allowed = ['id_materia_curso', 'materia_nombre', 'curso_anio_escolar', 'curso_division'];
  const sortField = allowed.includes(sort) ? sort : 'materia_nombre';

  // CRÍTICO: Filtro por ciclo debe ir en el WHERE del include, NO después
  const cicloInclude = { 
    model: CiclosLectivos, 
    as: 'cicloLectivo', 
    attributes: ['id_ciclo', 'estado', 'anio'],
    required: true // AGREGADO: hacer inner join para garantizar que existe ciclo
  };
  
  // Si hay filtro de ciclo, aplicarlo en el WHERE del include
  if (filters.id_ciclo !== undefined) {
    const toIds = (val) => Array.isArray(val) ? val.map(v => parseInt(v, 10)) : [parseInt(val, 10)];
    const ids = toIds(filters.id_ciclo).filter(n => !Number.isNaN(n));
    if (ids.length > 0) {
      cicloInclude.where = ids.length === 1 ? { id_ciclo: ids[0] } : { id_ciclo: { [Op.in]: ids } };
    }
  }

  const include = [
    { 
      model: Curso, 
      as: 'curso', 
      attributes: ['id_curso', 'anio_escolar', 'division', 'id_ciclo'], // AGREGADO: id_ciclo
      required: true, // AGREGADO: hacer inner join
      include: [cicloInclude]
    },
    { model: Materia, as: 'materia', attributes: ['id_materia', 'nombre'], required: true }
  ];

  const where = {};
  if (Array.isArray(filters.ids) && filters.ids.length > 0) {
    where.id_materia_curso = { [Op.in]: filters.ids.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n)) };
  }
  
  // id_materia puede ser único o array
  if (filters.id_materia !== undefined) {
    if (Array.isArray(filters.id_materia)) {
      const ids = filters.id_materia.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n));
      if (ids.length > 0) where.id_materia = { [Op.in]: ids };
    } else {
      const v = parseInt(filters.id_materia, 10);
      if (!Number.isNaN(v)) where.id_materia = v;
    }
  }
  
  // id_curso puede ser único o array
  if (filters.id_curso !== undefined) {
    if (Array.isArray(filters.id_curso)) {
      const ids = filters.id_curso.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n));
      if (ids.length > 0) where.id_curso = { [Op.in]: ids };
    } else {
      const v = parseInt(filters.id_curso, 10);
      if (!Number.isNaN(v)) where.id_curso = v;
    }
  }
  
  if (filters.q) {
    // Buscar por nombre de materia, año o división del curso
    include[1].where = { ...(include[1].where || {}), nombre: { [Op.iLike]: `%${filters.q}%` } };
    include[0].where = { ...(include[0].where || {}), [Op.or]: [
      { anio_escolar: { [Op.iLike]: `%${filters.q}%` } },
      { division: { [Op.iLike]: `%${filters.q}%` } }
    ] };
  }

  const orderClause = (() => {
    if (sortField === 'materia_nombre') return [[{ model: Materia, as: 'materia' }, 'nombre', sortOrder]];
    if (sortField === 'curso_anio_escolar') return [[{ model: Curso, as: 'curso' }, 'anio_escolar', sortOrder]];
    if (sortField === 'curso_division') return [[{ model: Curso, as: 'curso' }, 'division', sortOrder]];
    return [[sortField, sortOrder]];
  })();

  const query = {
    where,
    include,
    order: orderClause,
    distinct: true,
    subQuery: false // AGREGADO: evitar problemas con paginación y joins
  };
  if (limit !== undefined) query.limit = limit;
  if (offset !== undefined) query.offset = offset;

  const { rows, count } = await MateriasCurso.findAndCountAll(query);

  const data = rows.map(r => {
    const j = r.toJSON ? r.toJSON() : r;
    const curso = j.curso;
    const materia = j.materia;
    const ciclo = curso?.cicloLectivo;
    
    return {
      id: j.id_materia_curso,
      id_materia_curso: j.id_materia_curso,
      id_materia: j.id_materia ?? materia?.id_materia,
      materia_nombre: materia?.nombre,
      id_curso: j.id_curso ?? curso?.id_curso,
      curso_anio_escolar: curso?.anio_escolar,
      curso_division: curso?.division,
      curso_label: curso ? `${curso.anio_escolar}º ${curso.division}` : undefined,
      id_ciclo: ciclo?.id_ciclo ?? curso?.id_ciclo, // CORREGIDO: priorizar ciclo anidado
      ciclo_estado: ciclo?.estado,
      ciclo_anio: ciclo?.anio,
    };
  });
  
  return { data, total: Array.isArray(filters.ids) && filters.ids.length > 0 ? data.length : count };
};
// export const list = async (limit, offset, { sort, order, filters = {} }) => {
//   const sortOrder = String(order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
//   const allowed = ['id_materia_curso', 'materia_nombre', 'curso_anio_escolar', 'curso_division'];
//   const sortField = allowed.includes(sort) ? sort : 'materia_nombre';

//   const include = [
//     { model: Curso, as: 'curso', attributes: ['id_curso', 'anio_escolar', 'division'], include: [{ model: CiclosLectivos, as: 'cicloLectivo', attributes: ['id_ciclo', 'estado', 'anio'] }] },
//     { model: Materia, as: 'materia', attributes: ['id_materia', 'nombre'] }
//   ];

//   const where = {};
//   if (Array.isArray(filters.ids) && filters.ids.length > 0) {
//     where.id_materia_curso = { [Op.in]: filters.ids.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n)) };
//   }
//   // id_materia puede ser único o array
//   if (filters.id_materia !== undefined) {
//     if (Array.isArray(filters.id_materia)) {
//       const ids = filters.id_materia.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n));
//       if (ids.length > 0) where.id_materia = { [Op.in]: ids };
//     } else {
//       const v = parseInt(filters.id_materia, 10);
//       if (!Number.isNaN(v)) where.id_materia = v;
//     }
//   }
//   // id_curso puede ser único o array
//   if (filters.id_curso !== undefined) {
//     if (Array.isArray(filters.id_curso)) {
//       const ids = filters.id_curso.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n));
//       if (ids.length > 0) where.id_curso = { [Op.in]: ids };
//     } else {
//       const v = parseInt(filters.id_curso, 10);
//       if (!Number.isNaN(v)) where.id_curso = v;
//     }
//   }
//   // Filtro por ciclo en include (soporta único o array)
//   if (filters.id_ciclo !== undefined) {
//     const toIds = (val) => Array.isArray(val) ? val.map(v => parseInt(v, 10)) : [parseInt(val, 10)];
//     const ids = toIds(filters.id_ciclo).filter(n => !Number.isNaN(n));
//     const whereCiclo = ids.length <= 1 ? { id_ciclo: ids[0] } : { id_ciclo: { [Op.in]: ids } };
//     include[0].include = include[0].include.map(inc => inc.as === 'cicloLectivo' ? { ...inc, where: whereCiclo } : inc);
//   }
//   if (filters.q) {
//     // Buscar por nombre de materia, año o división del curso
//     include[1].where = { ...(include[1].where || {}), nombre: { [Op.iLike]: `%${filters.q}%` } };
//     include[0].where = { ...(include[0].where || {}), [Op.or]: [
//       { anio_escolar: { [Op.iLike]: `%${filters.q}%` } },
//       { division: { [Op.iLike]: `%${filters.q}%` } }
//     ] };
//   }

//   const orderClause = (() => {
//     if (sortField === 'materia_nombre') return [[{ model: Materia, as: 'materia' }, 'nombre', sortOrder]];
//     if (sortField === 'curso_anio_escolar') return [[{ model: Curso, as: 'curso' }, 'anio_escolar', sortOrder]];
//     if (sortField === 'curso_division') return [[{ model: Curso, as: 'curso' }, 'division', sortOrder]];
//     return [[sortField, sortOrder]];
//   })();

//   const query = {
//     where,
//     include,
//     order: orderClause,
//     distinct: true
//   };
//   if (limit !== undefined) query.limit = limit;
//   if (offset !== undefined) query.offset = offset;

//   const { rows, count } = await MateriasCurso.findAndCountAll(query);

//   const data = rows.map(r => {
//     const j = r.toJSON ? r.toJSON() : r;
//     const curso = j.curso;
//     const materia = j.materia;
//     return {
//       id: j.id_materia_curso,
//       id_materia_curso: j.id_materia_curso,
//       id_materia: j.id_materia ?? materia?.id_materia,
//       materia_nombre: materia?.nombre,
//       id_curso: j.id_curso ?? curso?.id_curso,
//       curso_anio_escolar: curso?.anio_escolar,
//       curso_division: curso?.division,
//       curso_label: curso ? `${curso.anio_escolar}º ${curso.division}` : undefined,
//       id_ciclo: curso?.cicloLectivo?.id_ciclo,
//       ciclo_estado: curso?.cicloLectivo?.estado,
//       ciclo_anio: curso?.cicloLectivo?.anio,
//     };
//   });
//   return { data, total: Array.isArray(filters.ids) && filters.ids.length > 0 ? data.length : count };
// };
