import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getRendimiento,
  generarInforme,
  generarInformeIA,
} from "../controllers/rendimiento.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getRendimiento);
router.post("/informe", generarInforme);
router.post("/informe-ia", generarInformeIA);

export default router;
