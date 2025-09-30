// routes/curso.routes.js
import express from "express";
import {
  obtenerCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
} from "../controllers/curso.controller.js";

const router = express.Router();

// GET /api/cursos
router.get("/", obtenerCursos);

// GET /api/cursos/:id
router.get("/:id", obtenerCursoPorId);

// POST /api/cursos
router.post("/", crearCurso);

// PUT /api/cursos/:id
router.put("/:id", actualizarCurso);

// DELETE /api/cursos/:id
router.delete("/:id", eliminarCurso);

export default router;
