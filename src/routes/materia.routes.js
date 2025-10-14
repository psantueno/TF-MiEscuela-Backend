import * as materiaController from '../controllers/materia.controller.js';
import { Router } from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all materia routes
router.use(authMiddleware);

router.get('/', materiaController.getMaterias);
router.get('/:id/cursos', materiaController.getCursosPorMateria);

export default router;
