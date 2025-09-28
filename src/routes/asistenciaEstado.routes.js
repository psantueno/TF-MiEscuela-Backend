import express from "express";
import { obtenerEstados } from "../controllers/asistenciaEstado.controller.js";

const router = express.Router();

// GET /api/asistencia-estados
router.get("/", obtenerEstados);

export default router;
