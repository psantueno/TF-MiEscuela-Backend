import express from "express";
import {
  crearAsistencia,
  obtenerAsistencias,
  obtenerAsistenciaPorId,
  actualizarAsistencia,
  eliminarAsistencia,
  obtenerAsistenciasPorCurso,
  obtenerAsistenciasPorAlumno
} from "../controllers/asistenciaController.js";

const router = express.Router();

// CRUD
router.post("/", crearAsistencia);
router.get("/", obtenerAsistencias);
router.get("/:id", obtenerAsistenciaPorId);
router.put("/:id", actualizarAsistencia);
router.delete("/:id", eliminarAsistencia);

// Extra
router.get("/curso/:id_curso", obtenerAsistenciasPorCurso);
router.get("/alumno/:id_alumno", obtenerAsistenciasPorAlumno);

export default router;
