import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as auxiliaresController from "../controllers/auxiliares.controller.js";

const router = Router();

router.get('/', authMiddleware, auxiliaresController.getAuxiliares);

export default router;