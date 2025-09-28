import { Asistencia, Alumno, Curso, Usuario, AsistenciaEstado } from "../models/index.js";



// Crear asistencia
export const crearAsistencia = async (req, res) => {
  try {
    const nuevaAsistencia = await Asistencia.create(req.body);
    res.status(201).json(nuevaAsistencia);
  } catch (error) {
    res.status(500).json({ error: "Error al crear asistencia", detalle: error.message });
  }
};

// Obtener todas las asistencias
export const obtenerAsistencias = async (req, res) => {
  try {
    const asistencias = await Asistencia.findAll({
      include: [Alumno, Curso, Usuario, AsistenciaEstado]
    });
    res.json(asistencias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener asistencias", detalle: error.message });
  }
};

// Obtener una asistencia por ID
export const obtenerAsistenciaPorId = async (req, res) => {
  try {
    const asistencia = await Asistencia.findByPk(req.params.id, {
      include: [Alumno, Curso, Usuario, AsistenciaEstado]
    });
    if (!asistencia) return res.status(404).json({ error: "Asistencia no encontrada" });
    res.json(asistencia);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener asistencia", detalle: error.message });
  }
};

// Actualizar asistencia
export const actualizarAsistencia = async (req, res) => {
  try {
    const asistencia = await Asistencia.findByPk(req.params.id);
    if (!asistencia) return res.status(404).json({ error: "Asistencia no encontrada" });

    await asistencia.update(req.body);
    res.json(asistencia);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar asistencia", detalle: error.message });
  }
};

// Eliminar asistencia
export const eliminarAsistencia = async (req, res) => {
  try {
    const asistencia = await Asistencia.findByPk(req.params.id);
    if (!asistencia) return res.status(404).json({ error: "Asistencia no encontrada" });

    await asistencia.destroy();
    res.json({ mensaje: "Asistencia eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar asistencia", detalle: error.message });
  }
};

// Obtener asistencias por curso
export const obtenerAsistenciasPorCurso = async (req, res) => {
  try {
    const asistencias = await Asistencia.findAll({
      where: { id_curso: req.params.id_curso },
      include: [Alumno, Curso, Usuario, AsistenciaEstado]
    });
    res.json(asistencias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener asistencias por curso", detalle: error.message });
  }
};

// Obtener asistencias por alumno
export const obtenerAsistenciasPorAlumno = async (req, res) => {
  try {
    const asistencias = await Asistencia.findAll({
      where: { id_alumno: req.params.id_alumno },
      include: [Alumno, Curso, Usuario, AsistenciaEstado]
    });
    res.json(asistencias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener asistencias por alumno", detalle: error.message });
  }
};
