import { Router } from 'express';
import * as rolController from '../controllers/rol.controller.js';

const router = Router();

router.get('/', rolController.getRoles);

export default router;