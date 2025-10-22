import { Router } from "express";
import * as asesorPedagogicoController from "../controllers/asesorPedagogico.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asesorPedagogicoController.getAsesoresPedagogicos);

export default router;