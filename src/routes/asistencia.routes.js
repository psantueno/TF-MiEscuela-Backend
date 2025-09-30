// routes/asistencia.routes.js
import express from "express";
import {
  tomarAsistenciaCurso,
  obtenerAsistenciasCursoHoy,
  obtenerAsistenciasCursoEntreFechas,
  obtenerAsistenciasAlumnoEntreFechas,
} from "../controllers/asistencia.controller.js";

const router = express.Router();

// Registro en lote
router.post("/curso", tomarAsistenciaCurso);

// Consultas
router.get("/curso/:id_curso/hoy", obtenerAsistenciasCursoHoy);
router.get("/curso/:id_curso", obtenerAsistenciasCursoEntreFechas);
router.get("/alumno/:id_alumno", obtenerAsistenciasAlumnoEntreFechas);

export default router;
