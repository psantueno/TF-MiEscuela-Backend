// routes/curso.routes.js
import express from "express";
import {
  obtenerCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  getMateriasPorCurso,
  getAlumnosPorCurso,
} from "../controllers/curso.controller.js";

const router = express.Router();

// GET /api/cursos
router.get("/", obtenerCursos);

// GET /api/cursos/:id
router.get("/:id", obtenerCursoPorId);

// GET /api/cursos/:id/materias
router.get("/:id/materias", getMateriasPorCurso);

// GET /api/cursos/:id/alumnos
router.get("/:id/alumnos", getAlumnosPorCurso);

// POST /api/cursos
router.post("/", crearCurso);

// PUT /api/cursos/:id
router.put("/:id", actualizarCurso);

// DELETE /api/cursos/:id
router.delete("/:id", eliminarCurso);

export default router;
