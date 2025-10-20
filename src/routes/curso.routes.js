// routes/curso.routes.js
import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  obtenerCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  getMateriasPorCurso,
  getAlumnosPorCurso,
  getDocentesPorCurso,
  getCursos
} from "../controllers/curso.controller.js";

const router = express.Router();

// Protect all curso routes
router.use(authMiddleware);

// GET /api/cursos
router.get("/", obtenerCursos);

router.get("/restricted", getCursos);

// GET /api/cursos/:id
router.get("/:id", obtenerCursoPorId);

// GET /api/cursos/:id/materias
router.get("/:id/materias", getMateriasPorCurso);

// GET /api/cursos/:id/alumnos
router.get("/:id/alumnos", getAlumnosPorCurso);

// GET /api/cursos/:id/docentes
router.get("/:id/docentes", getDocentesPorCurso);

// POST /api/cursos
router.post("/", crearCurso);

// PUT /api/cursos/:id
router.put("/:id", actualizarCurso);

// DELETE /api/cursos/:id
router.delete("/:id", eliminarCurso);


export default router;
