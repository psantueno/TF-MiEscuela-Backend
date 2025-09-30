import { Router } from 'express';
import * as usuarioController from "../controllers/usuario.controller.js";
import { validateGetUsuarios, validateCreateUsuario, validateUpdateUsuario, validateDeleteUsuario } from '../middlewares/validators/usuario.validator.js';

const router = Router();

router.get("/", validateGetUsuarios, usuarioController.getUsuarios);
router.get("/:id_usuario", usuarioController.getUsuario);
router.post("/", validateCreateUsuario, usuarioController.createUsuario);
router.put("/:id_usuario", validateUpdateUsuario, usuarioController.updateUsuario);
router.delete("/:id_usuario", validateDeleteUsuario, usuarioController.deleteUsuario);

export default router;
