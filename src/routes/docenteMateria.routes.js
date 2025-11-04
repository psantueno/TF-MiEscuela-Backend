import { Router } from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as controller from '../controllers/docenteMateria.controller.js';

const router = Router();

router.use(authMiddleware);

// RA-friendly resource routes
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;

