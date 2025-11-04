import { Op } from 'sequelize';
import { sequelize, Docente, Usuario } from '../models/index.js';

const buildUsuarioWhere = ({ apellido, nombre, numero_documento }) => {
  const where = {};
  if (apellido) where.apellido = { [Op.iLike]: `%${String(apellido)}%` };
  if (nombre) where.nombre = { [Op.iLike]: `%${String(nombre)}%` };
  if (numero_documento) where.numero_documento = { [Op.iLike]: `%${String(numero_documento)}%` };
  return where;
};

export const getDocentes = async ({ limit, offset, sort, order, q, filters = {} }) => {
  const sortOrder = String(order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const allowed = ['id_docente', 'apellido', 'nombre', 'numero_documento'];
  const sortField = allowed.includes(sort) ? sort : 'apellido';

  const usuarioWhere = buildUsuarioWhere({ ...filters });
  if (q) {
    usuarioWhere[Op.or] = [
      { apellido: { [Op.iLike]: `%${q}%` } },
      { nombre: { [Op.iLike]: `%${q}%` } },
      { numero_documento: { [Op.iLike]: `%${q}%` } }
    ];
  }

  const include = [
    { model: Usuario, as: 'usuario', attributes: ['apellido', 'nombre', 'numero_documento', 'email'], where: usuarioWhere, required: true },
  ];

  const orderClause = sortField === 'id_docente'
    ? [[sortField, sortOrder]]
    : [[{ model: Usuario, as: 'usuario' }, sortField, sortOrder]];

  const where = {};
  if (Array.isArray(filters.ids) && filters.ids.length > 0) {
    where.id_docente = { [Op.in]: filters.ids.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n)) };
  }

  const query = {
    include,
    where,
    attributes: ['id_docente'],
    order: orderClause
  };
  if (limit !== undefined) query.limit = limit;
  if (offset !== undefined) query.offset = offset;

  const { rows, count } = await Docente.findAndCountAll(query);

  const data = rows.map(d => {
    const u = d.usuario || {};
    return {
      id: d.id_docente,
      id_docente: d.id_docente,
      apellido: u.apellido,
      nombre: u.nombre,
      numero_documento: u.numero_documento,
      email: u.email
    };
  });
  return { data, total: Array.isArray(filters.ids) && filters.ids.length > 0 ? data.length : count };
};
