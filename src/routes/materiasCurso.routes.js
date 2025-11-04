import { Router } from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as controller from '../controllers/materiasCurso.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.list);
router.get('/:id', controller.getOne);

export default router;
