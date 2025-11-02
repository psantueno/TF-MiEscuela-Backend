// routes/curso.routes.js
import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateGetCursos, validateCreateCurso, validateUpdateCurso, validateIdCurso } from "../middlewares/validators/curso.validator.js";
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
router.get("/", validateGetCursos, obtenerCursos);

router.get("/restricted", getCursos);

// GET /api/cursos/:id
router.get("/:id", validateIdCurso, obtenerCursoPorId);

// GET /api/cursos/:id/materias
router.get("/:id/materias", validateIdCurso, getMateriasPorCurso);

// GET /api/cursos/:id/alumnos
router.get("/:id/alumnos", validateIdCurso, getAlumnosPorCurso);

// GET /api/cursos/:id/docentes
router.get("/:id/docentes", validateIdCurso, getDocentesPorCurso);

// POST /api/cursos
router.post("/", validateCreateCurso, crearCurso);

// PUT /api/cursos/:id
router.put("/:id", validateIdCurso, validateUpdateCurso, actualizarCurso);

// DELETE /api/cursos/:id
router.delete("/:id", validateIdCurso, eliminarCurso);


export default router;
