// routes/asistencia.routes.js
import express from "express";
import {
  tomarAsistenciaCurso,
  obtenerAsistenciasCursoFecha,
  obtenerAsistenciasCursoEntreFechas,
  obtenerAsistenciasAlumnoEntreFechas,
  eliminarAsistenciasCurso,
} from "../controllers/asistencia.controller.js";

const router = express.Router();

// Registro en lote
router.post("/curso", tomarAsistenciaCurso);

// Consultas
router.get("/curso/:id_curso/recientes", obtenerAsistenciasCursoFecha);
router.get("/curso/:id_curso", obtenerAsistenciasCursoEntreFechas);
router.get("/alumno/:id_alumno", obtenerAsistenciasAlumnoEntreFechas);
router.delete("/curso/:id_curso", eliminarAsistenciasCurso);


export default router;
