// controllers/alumno.controller.js
import { Alumno, Usuario, Asistencia } from "../models/index.js";
import { Op } from "sequelize";

export const obtenerAlumnosCursoPorFecha = async (req, res) => {
  const { id_curso } = req.params;
  const { fecha } = req.query; // YYYY-MM-DD

  if (!id_curso || !fecha) {
    return res.status(400).json({ error: "id_curso y fecha son requeridos" });
  }

  try {
    const alumnos = await Alumno.findAll({
      where: { id_curso },
      include: [
        {
          model: Usuario,
          attributes: ["nombre_completo"],
        },
        {
          model: Asistencia,
          required: false, // LEFT JOIN
          where: { fecha: { [Op.eq]: fecha } },
          attributes: ["id_estado"],
        },
      ],
      order: [[{ model: Usuario }, "nombre_completo", "ASC"]],
    });

    // 🔹 Aplanar respuesta (siempre tomar la asistencia del día si existe)
    const data = alumnos.map((a) => ({
      id_alumno: a.id_alumno,
      alumno_nombre: a.Usuario?.nombre_completo || "",
      id_estado: a.Asistencia?.[0]?.id_estado || null,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo alumnos del curso/fecha" });
  }
};
