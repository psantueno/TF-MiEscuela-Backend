import { Router } from 'express';
import * as authController from "../controllers/auth.controller.js";
import { validateLogin, validateRefreshToken } from '../middlewares/validators/auth.validator.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', validateLogin, authController.login);
router.post('/refresh', validateRefreshToken, authController.refresh);
router.post('/logout', authMiddleware, authController.logout);

export default router;