import { Router } from 'express';
import * as rolController from '../controllers/rol.controller.js';
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all rol routes
router.use(authMiddleware);

router.get('/', rolController.getRoles);

export default router;
