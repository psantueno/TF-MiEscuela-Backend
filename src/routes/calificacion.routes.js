import * as calificacionController from '../controllers/calificacion.controller.js';
import { Router } from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all calificacion routes
router.use(authMiddleware);

router.get('/', calificacionController.getCalificaciones);
router.put('/', calificacionController.updateManyCalificaciones);
router.post('/', calificacionController.createManyCalificaciones);

export default router;
