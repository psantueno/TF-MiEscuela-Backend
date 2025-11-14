import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import * as justificativoAsistenciaController from "../controllers/justificativoAsistencia.controller.js";

const router = Router();

router.get("/curso/:id_curso", authMiddleware, justificativoAsistenciaController.getJustificativosCurso);
router.post("/asistencia/:id_asistencia", authMiddleware, upload.single("imagen"), justificativoAsistenciaController.crearJustificativoAsistencia);
router.put("/:id_justificativo/estado", authMiddleware, justificativoAsistenciaController.actualizarEstadoJustificativo);

export default router;