import * as tutorHijosController from "../controllers/tutorHijos.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { Router } from 'express';

const router = Router();
router.use(authMiddleware);

router.get('/', tutorHijosController.getTutoresHijos);
router.get('/:id_tutor', tutorHijosController.getTutorHijos);
router.put('/:id_tutor', tutorHijosController.updateTutorHijos);

export default router;