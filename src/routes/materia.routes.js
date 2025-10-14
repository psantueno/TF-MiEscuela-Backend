import * as materiaController from '../controllers/materia.controller.js';
import { Router } from 'express';

const router = Router();

router.get('/', materiaController.getMaterias);
router.get('/:id/cursos', materiaController.getCursosPorMateria);

export default router;
