import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as notificacionesController from "../controllers/notificaciones.controller.js";

const router = Router();
router.use(authMiddleware);

router.get("/", notificacionesController.getNotificaciones);
router.put("/:id_notificacion", notificacionesController.updateNotificacion);

export default router;
