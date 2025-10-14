import * as calificacionController from '../controllers/calificacion.controller.js';
import { Router } from 'express';

const router = Router();

router.get('/', calificacionController.getCalificaciones);
router.get('/alumnos/:id_alumno', calificacionController.getCalificacionByAlumno);
router.put('/', calificacionController.updateManyCalificaciones);
router.post('/', calificacionController.createManyCalificaciones);
router.delete('/', calificacionController.deleteManyCalificaciones);

export default router;
