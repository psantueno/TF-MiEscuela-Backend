// routes/alumnos.routes.js
import express from "express";
import { obtenerAlumnosCursoPorFecha } from "../controllers/alumno.controller.js";

const router = express.Router();

// Lista los alumnos de un curso + su asistencia en la fecha dada (LEFT JOIN)
router.get("/curso/:id_curso", obtenerAlumnosCursoPorFecha);

export default router;
