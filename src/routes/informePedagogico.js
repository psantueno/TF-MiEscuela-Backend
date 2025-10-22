import * as informePedagogicoController from "../controllers/informePedagogico.controller.js";
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", informePedagogicoController.getInformesPedagogicos);
router.post("/", informePedagogicoController.crearInformePedagogico);

export default router;