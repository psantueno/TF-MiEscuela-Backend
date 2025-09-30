import { Op } from "sequelize";
import { Asistencia, Alumno, Curso} from "../models/index.js";



// Crear asistencia
export const tomarAsistenciaCurso = async (req, res) => {
  const { id_curso, fecha, items } = req.body;
  const usuarioId = req.user?.id; // opcional si tenés auth

  if (!id_curso || !fecha || !Array.isArray(items)) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  try {
    // Validar alumnos del curso
    const alumnosCurso = await Alumno.findAll({
      where: { id_curso },
      attributes: ["id_alumno"],
    });

    const setValidos = new Set(alumnosCurso.map(a => a.id_alumno));
    const registros = items
      .filter(i => setValidos.has(i.id_alumno))
      .map(i => ({
        id_alumno: i.id_alumno,
        fecha,
        id_estado: i.id_estado,
        observaciones: i.observaciones || null,
        registrado_por: usuarioId || null,
      }));

    if (registros.length === 0) {
      return res.status(400).json({ error: "No hay alumnos válidos en el curso" });
    }

    await Asistencia.bulkCreate(registros, {
      updateOnDuplicate: ["id_estado", "observaciones", "registrado_por", "actualizado_el"],
    });

    res.json({ ok: true, total: registros.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registrando asistencia" });
  }
};


// 1) Todas las asistencias de un curso en el día actual
export const obtenerAsistenciasCursoHoy = async (req, res) => {
  const { id_curso } = req.params;
  const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const asistencias = await Asistencia.findAll({
      include: [
        {
          model: Alumno,
          where: { id_curso },
          include: [{ model: Curso, attributes: ["anio_escolar", "division"] }],
        },
      ],
      where: { fecha: hoy },
    });

    res.json(asistencias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo asistencias del curso hoy" });
  }
};

// 2) Asistencias de un curso entre fechas
export const obtenerAsistenciasCursoEntreFechas = async (req, res) => {
  const { id_curso } = req.params;
  const { desde, hasta } = req.query; // formato YYYY-MM-DD

  if (!desde || !hasta) {
    return res.status(400).json({ error: "Faltan fechas 'desde' y 'hasta'" });
  }

  try {
    const asistencias = await Asistencia.findAll({
      include: [
        {
          model: Alumno,
          where: { id_curso },
          include: [{ model: Curso, attributes: ["anio_escolar", "division"] }],
        },
      ],
      where: {
        fecha: {
          [Op.between]: [desde, hasta],
        },
      },
    });

    res.json(asistencias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo asistencias del curso entre fechas" });
  }
};

// 3) Asistencias de un alumno entre fechas
export const obtenerAsistenciasAlumnoEntreFechas = async (req, res) => {
  const { id_alumno } = req.params;
  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return res.status(400).json({ error: "Faltan fechas 'desde' y 'hasta'" });
  }

  try {
    const asistencias = await Asistencia.findAll({
      include: [
        {
          model: Alumno,
          where: { id_alumno },
          include: [{ model: Curso, attributes: ["anio_escolar", "division"] }],
        },
      ],
      where: {
        fecha: {
          [Op.between]: [desde, hasta],
        },
      },
    });

    res.json(asistencias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo asistencias del alumno entre fechas" });
  }
};
