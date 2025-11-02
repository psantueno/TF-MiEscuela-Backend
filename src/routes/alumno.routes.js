// routes/alumnos.routes.js
import express from "express";
import { obtenerAlumnosCursoPorFecha, getAlumnos, getAlumnosSinCurso, getAlumnosConCurso, assignCursoBulk, moveCursoBulk } from "../controllers/alumno.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all alumno routes
router.use(authMiddleware);

// Obtener todos los alumnos
router.get("/", getAlumnos);

// Lista los alumnos de un curso + su asistencia en la fecha dada (LEFT JOIN)
router.get("/curso/:id_curso", obtenerAlumnosCursoPorFecha);

// Alumnos sin curso actual
router.get("/sin-curso", getAlumnosSinCurso);

// Alumnos con curso actual (por ciclo y opcional curso)
router.get("/con-curso", getAlumnosConCurso);

// Asignar curso en lote
router.post("/curso/assign-bulk", assignCursoBulk);

// Mover curso en lote
router.post("/curso/move-bulk", moveCursoBulk);

export default router;
