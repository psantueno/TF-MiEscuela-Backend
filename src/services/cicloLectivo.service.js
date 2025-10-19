import { CiclosLectivos } from "../models/CiclosLectivos.js";
import { Op } from "sequelize";

export const getCiclos = async (limit, offset, filters = {}) => {
  const where = {};
  if (filters.anio) where.anio = parseInt(filters.anio);
  if (filters.estado) where.estado = { [Op.iLike]: `%${filters.estado}%` };

  const { rows, count } = await CiclosLectivos.findAndCountAll({
    where,
    limit,
    offset,
    order: [["anio", "DESC"]],
  });
  return { data: rows, total: count };
};

export const getCiclo = async (id_ciclo) => {
  return await CiclosLectivos.findByPk(id_ciclo);
};

export const createCiclo = async (payload) => {
  const ciclo = await CiclosLectivos.create({
    anio: payload.anio,
    fecha_inicio: payload.fecha_inicio,
    fecha_fin: payload.fecha_fin,
    estado: payload.estado,
  });
  return ciclo;
};

export const updateCiclo = async (id_ciclo, payload) => {
  const ciclo = await CiclosLectivos.findByPk(id_ciclo);
  if (!ciclo) return null;
  await ciclo.update({
    anio: payload.anio ?? ciclo.anio,
    fecha_inicio: payload.fecha_inicio ?? ciclo.fecha_inicio,
    fecha_fin: payload.fecha_fin ?? ciclo.fecha_fin,
    estado: payload.estado ?? ciclo.estado,
  });
  return ciclo;
};

export const deleteCiclo = async (id_ciclo) => {
  const deleted = await CiclosLectivos.destroy({ where: { id_ciclo } });
  return deleted; // number of rows deleted
};

