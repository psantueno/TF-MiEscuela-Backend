import express from "express";
import { obtenerEstados } from "../controllers/asistenciaEstado.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all asistencia-estado routes
router.use(authMiddleware);

// GET /api/asistencia-estados
router.get("/", obtenerEstados);

export default router;
