import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as auxiliaresCursoController from "../controllers/auxiliaresCurso.controller.js";

const router = Router();

router.get('/', authMiddleware, auxiliaresCursoController.getAuxiliaresCurso);
router.get('/:id', authMiddleware, auxiliaresCursoController.getAuxiliarCursoById);
router.put('/:id', authMiddleware, auxiliaresCursoController.updateAuxiliarCurso);
router.post('/', authMiddleware, auxiliaresCursoController.createAuxiliarCurso);
router.delete('/:id', authMiddleware, auxiliaresCursoController.deleteAuxiliarCurso);

export default router;