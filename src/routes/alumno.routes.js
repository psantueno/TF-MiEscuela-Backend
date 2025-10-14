// routes/alumnos.routes.js
import express from "express";
import { obtenerAlumnosCursoPorFecha, getAlumnos } from "../controllers/alumno.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all alumno routes
router.use(authMiddleware);

// Obtener todos los alumnos
router.get("/", getAlumnos);

// Lista los alumnos de un curso + su asistencia en la fecha dada (LEFT JOIN)
router.get("/curso/:id_curso", obtenerAlumnosCursoPorFecha);

export default router;
