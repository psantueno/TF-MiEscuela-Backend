// controllers/curso.controller.js
import { Curso } from "../models/index.js";

// Obtener todos los cursos
export const obtenerCursos = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      attributes: ["id_curso", "anio_escolar", "division"],
      order: [["anio_escolar", "ASC"], ["division", "ASC"]],
    });
    res.json(cursos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo cursos" });
  }
};

// Obtener un curso por id
export const obtenerCursoPorId = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);
    if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
    res.json(curso);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo curso" });
  }
};

// Crear curso
export const crearCurso = async (req, res) => {
  try {
    const nuevo = await Curso.create(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando curso" });
  }
};

// Actualizar curso
export const actualizarCurso = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);
    if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
    await curso.update(req.body);
    res.json(curso);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando curso" });
  }
};

// Eliminar curso
export const eliminarCurso = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);
    if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
    await curso.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando curso" });
  }
};
