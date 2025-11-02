import { CiclosLectivos } from "../models/CiclosLectivos.js";
import { Op } from "sequelize";

export const getCiclos = async (limit, offset, filters = {}) => {
  const where = {};
  if (filters.anio) {
    const anos = Array.isArray(filters.anio)
      ? filters.anio
      : String(filters.anio)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
    if (anos.length === 1) {
      where.anio = String(anos[0]);
    } else if (anos.length > 1) {
      where.anio = { [Op.in]: anos.map(String) };
    }
  }
  if (filters.estado) {
    const estados = Array.isArray(filters.estado)
      ? filters.estado
      : String(filters.estado)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
    if (estados.length === 1) {
      where.estado = { [Op.iLike]: estados[0] };
    } else if (estados.length > 1) {
      where[Op.or] = estados.map((e) => ({ estado: { [Op.iLike]: e } }));
    }
  }

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

