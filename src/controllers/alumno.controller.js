// controllers/alumno.controller.js
import { th } from "zod/locales";
import { Alumno, Usuario, Asistencia, Curso } from "../models/index.js";
import * as alumnoService from "../services/alumno.service.js";
import { Op } from "sequelize";

export const getAlumnos = async (req, res) => {
  try {
    const { id_curso, numero_documento } = req.query;
    const alumnos = await alumnoService.getAlumnos({ id_curso, numero_documento });
    res.json(alumnos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo alumnos" });
  }
}

export const obtenerAlumnosCursoPorFecha = async (req, res) => {
  const { id_curso } = req.params;
  const { fecha } = req.query; // YYYY-MM-DD

  if (!id_curso || !fecha) {
    return res.status(400).json({ error: "id_curso y fecha son requeridos" });
  }

  try {
    const alumnos = await Alumno.findAll({
      include: [
        {
          model: Curso,
          as: 'cursos',
          where: { id_curso },
          attributes: [],
          through: {
            attributes: [],
            where: {
              [Op.and]: [
                { fecha_inicio: { [Op.lte]: fecha } },
                { [Op.or]: [
                    { fecha_fin: { [Op.gte]: fecha } },
                    { fecha_fin: null }
                  ]
                }
              ]
            }
          }
        },
        {
          model: Usuario,
          attributes: ["nombre", "apellido"],
          as: 'usuario'
        },
        {
          model: Asistencia,
          required: false, // LEFT JOIN
          where: { fecha: { [Op.eq]: fecha } },
          attributes: ["id_estado"],
        },
      ],
      order: [
        [{ model: Usuario, as: 'usuario' }, "nombre", "ASC"],
        [{ model: Usuario, as: 'usuario' }, "apellido", "ASC"],
      ],
    });

    // 🔹 Aplanar respuesta (siempre tomar la asistencia del día si existe)
    const data = alumnos.map((a) => ({
      id_alumno: a.id_alumno,
      alumno_nombre: `${a.usuario?.apellido || ""} ${a.usuario?.nombre || ""}`.trim(),
      alumno_apellido: a.usuario?.apellido,
      alumno_nombre_prop: a.usuario?.nombre,
      id_estado: a.Asistencia?.[0]?.id_estado || null,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo alumnos del curso/fecha" });
  }
};

export const getAlumnosSinCurso = async (req, res) => {
  try {
    const { apellido, nombre, numero_documento, id_ciclo, page = 1, perPage = 10 } = req.query;
    if (!id_ciclo) return res.status(400).json({ error: 'id_ciclo es obligatorio' });

    // Usar variante robusta por ciclo (LEFT JOIN + NULL)
    const { data, total } = await alumnoService.getAlumnosSinCursoByCiclo({ apellido, nombre, numero_documento, id_ciclo, page, perPage });
    res.json({ data, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo alumnos sin curso' });
  }
}

export const getAlumnosConCurso = async (req, res) => {
  try {
    const { apellido, nombre, numero_documento, id_ciclo, id_curso, page = 1, perPage = 10, modo } = req.query;
    if (!id_ciclo) return res.status(400).json({ error: 'id_ciclo es obligatorio' });

    const { data, total } = await alumnoService.getAlumnosConCurso({ apellido, nombre, numero_documento, id_ciclo, id_curso, page, perPage, modo });
    res.json({ data, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo alumnos con curso' });
  }
}

export const assignCursoBulk = async (req, res) => {
  try {
    const { ids, id_curso } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0 || !id_curso) {
      return res.status(400).json({ error: 'Debe enviar ids[] y id_curso' });
    }
    const result = await alumnoService.assignCursoBulk({ ids, id_curso });
    if (result?.error) return res.status(400).json({ error: result.error });
    // Si es una sola asignación y se detectó programación duplicada, devolver 409
    const DUP_SAME_MSG = 'El alumno ya tiene este curso programado';
    const DUP_ANY_MSG = 'El alumno ya tiene un cambio de curso programado en este ciclo';
    if (Array.isArray(ids) && ids.length === 1 && Array.isArray(result?.results)) {
      const r0 = result.results[0];
      if (r0 && r0.ok === false) {
        const err = String(r0.error || '');
        if (err.includes(DUP_SAME_MSG) || err.includes(DUP_ANY_MSG)) {
          return res.status(409).json({ error: err });
        }
      }
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error asignando curso en lote' });
  }
}

export const moveCursoBulk = async (req, res) => {
  try {
    const { ids, id_curso } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0 || !id_curso) {
      return res.status(400).json({ error: 'Debe enviar ids[] y id_curso' });
    }
    const result = await alumnoService.moveCursoBulk({ ids, id_curso });
    if (result?.error) return res.status(400).json({ error: result.error });

    // Caso particular: mover a un curso igual al activo
    // Si es una sola asignación y el servicio marcó mismo curso, devolver 409
    const SAME_COURSE_MSG = 'El curso destino es el mismo que el activo';
    const DUP_SAME_MSG = 'El alumno ya tiene este curso programado';
    const DUP_ANY_MSG = 'El alumno ya tiene un cambio de curso programado en este ciclo';
    if (Array.isArray(ids) && ids.length === 1 && Array.isArray(result?.results)) {
      const r0 = result.results[0];
      if (r0 && r0.ok === false) {
        const err = String(r0.error || '');
        if (err.includes(SAME_COURSE_MSG)) {
          return res.status(409).json({ error: 'El alumno ya tiene este curso asignado' });
        }
        if (err.includes(DUP_SAME_MSG) || err.includes(DUP_ANY_MSG)) {
          return res.status(409).json({ error: err });
        }
      }
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error moviendo curso en lote' });
  }
}

export const getTutoresAlumno = async (id_alumno) => {
  try{
    const tutores = await alumnoService.getTutoresAlumno(id_alumno);
    return tutores;
  }catch(error){
    throw new Error("Error al obtener tutores del alumno", error);
  }
}
