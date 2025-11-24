import { CiclosLectivos, FechasCuatrimestrales } from "../models/index.js";
import { Op } from "sequelize";
import { DateTime } from "luxon";

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

export const getFechaPublicacionCalificaciones = async () => {
  const cicloAbierto = await CiclosLectivos.findOne({
    where: { estado: 'Abierto' },
    include: [
      { 
        model: FechasCuatrimestrales,
        as: 'fechasCuatrimestrales'
      }
    ]
  });

  const plainCiclo = cicloAbierto.get({ plain: true });

  const fechaActual = new Date(DateTime.now().setZone("America/Argentina/Buenos_Aires").toISO().split('T')[0]);
  const fechaInicioPrimerCuatrimestre = new Date(plainCiclo.fechasCuatrimestrales.inicio_primer_cuatrimestre)
  const fechaCierrePrimerCuatrimestre = new Date(plainCiclo.fechasCuatrimestrales.cierre_primer_cuatrimestre)
  const fechaInicioSegundoCuatrimestre = new Date(plainCiclo.fechasCuatrimestrales.inicio_segundo_cuatrimestre)
  const fechaCierreSegundoCuatrimestre = new Date(plainCiclo.fechasCuatrimestrales.cierre_segundo_cuatrimestre)
  console.log("Fechas cuatrimestrales:", {
    fechaInicioPrimerCuatrimestre: fechaInicioPrimerCuatrimestre,
    fechaCierrePrimerCuatrimestre: fechaCierrePrimerCuatrimestre,
    fechaInicioSegundoCuatrimestre: fechaInicioSegundoCuatrimestre,
    fechaCierreSegundoCuatrimestre: fechaCierreSegundoCuatrimestre
  });
  console.log("Fecha actual:", fechaActual);

  if(fechaActual.getTime() === fechaCierrePrimerCuatrimestre.getTime()) return { fechaInicio: fechaInicioPrimerCuatrimestre, fechaCierre: fechaCierrePrimerCuatrimestre };

  if(fechaActual.getTime() === fechaCierreSegundoCuatrimestre.getTime())return { fechaInicio: fechaInicioSegundoCuatrimestre, fechaCierre: fechaCierreSegundoCuatrimestre };

  return {  fechaInicio: null, fechaCierre: null };
}
