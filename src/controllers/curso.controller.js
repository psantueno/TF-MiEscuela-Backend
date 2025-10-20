// controllers/curso.controller.js
import * as cursoService from "../services/curso.service.js";
import { Curso } from "../models/index.js";

// Obtener todos los cursos, restringido por rol de usuario
export const getCursos = async (req, res) => {
  try{
    const user = req.usuario; 
    const cursos = await cursoService.getCursos(user);
    res.json(cursos);
  }catch(error){
    console.error(error);
    res.status(500).json({ error: "Error obteniendo cursos" });
  }
}

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

// Obtener materias por curso
export const getMateriasPorCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.usuario;
    const materias = await cursoService.getMateriasPorCurso(id, user);
    res.json(materias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo materias por curso" });
  }
}

// Obtener alumnos por curso
export const getAlumnosPorCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const alumnos = await cursoService.getAlumnosPorCurso(id);
    res.json(alumnos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo alumnos por curso" });
  }
}

// Obtener docentes por curso
export const getDocentesPorCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const docentes = await cursoService.getDocentesPorCurso(id);
    res.json(docentes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo docentes por curso" });
  }
}