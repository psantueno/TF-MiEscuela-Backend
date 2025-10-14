import * as tutorController from "../controllers/tutor.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isTutor } from "../middlewares/isTutor.middleware.js";
import { Router } from 'express';

const router = Router();

// Protect all tutor routes
router.use(authMiddleware);

router.get('/hijos', isTutor, tutorController.getHijos);

export default router;
