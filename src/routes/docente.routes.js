import { Router } from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { listDocentes } from '../controllers/docente.controller.js';

const router = Router();

router.use(authMiddleware);

// GET /api/docentes
router.get('/', listDocentes);

export default router;
