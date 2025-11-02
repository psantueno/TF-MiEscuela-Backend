// controllers/alumno.controller.js
import { Alumno, Usuario, Asistencia, Curso } from "../models/index.js";
import * as alumnoService from "../services/alumno.service.js";
import { Op } from "sequelize";

export const getAlumnos = async (req, res) => {
  try {
    const { id_curso } = req.query;
    const alumnos = await alumnoService.getAlumnos(id_curso);
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
