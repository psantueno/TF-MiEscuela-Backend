import * as materiaController from '../controllers/materia.controller.js';
import { Router } from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all materia routes
router.use(authMiddleware);

// Listado paginado (React-Admin compatible)
router.get('/', materiaController.getMaterias);

// CRUD principal
router.get('/:id_materia', materiaController.getMateria);
router.post('/', materiaController.createMateria);
router.put('/:id_materia', materiaController.updateMateria);
router.patch('/:id_materia', materiaController.updateMateria);
router.delete('/:id_materia', materiaController.deleteMateria);

// Relaciones con cursos
router.get('/:id_materia/cursos', materiaController.getCursosPorMateria);
router.post('/:id_materia/cursos/:id_curso', materiaController.assignCursoAMateria);
router.delete('/:id_materia/cursos/:id_curso', materiaController.unassignCursoDeMateria);

export default router;
