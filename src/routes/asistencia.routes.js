// routes/asistencia.routes.js
import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  tomarAsistenciaCurso,
  obtenerAsistenciasCursoFecha,
  obtenerAsistenciasCursoEntreFechas,
  obtenerAsistenciasAlumnoEntreFechas,
  eliminarAsistenciasCurso,
  obtenerPromedioAsistenciasCurso,
  obtenerInasistenciasAlumnoRecientes
} from "../controllers/asistencia.controller.js";

const router = express.Router();

// Protect all asistencia routes
router.use(authMiddleware);

// Registro en lote
router.post("/curso", tomarAsistenciaCurso);

// Consultas
router.get("/curso/:id_curso/recientes", obtenerAsistenciasCursoFecha);
router.get("/curso/:id_curso", obtenerAsistenciasCursoEntreFechas);
router.get("/alumno/:id_alumno", obtenerAsistenciasAlumnoEntreFechas);
router.delete("/curso/:id_curso", eliminarAsistenciasCurso);
router.get("/curso/:id_curso/promedio", obtenerPromedioAsistenciasCurso);
router.get("/alumno/:id_alumno/ausentes", obtenerInasistenciasAlumnoRecientes);
export default router;
