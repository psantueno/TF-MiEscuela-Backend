import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getResumen, getPanelPorRolController } from "../controllers/panelGeneral.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/resumen", getResumen);
router.get("/rol", getPanelPorRolController);

export default router;
