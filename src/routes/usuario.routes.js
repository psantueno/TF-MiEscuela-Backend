import { Router } from 'express';
import * as usuarioController from "../controllers/usuario.controller.js";
import { validateGetUsuarios, validateCreateUsuario, validateUpdateUsuario, validateDeleteUsuario, validateAssignRolUsuario, validateUnassignRolUsuario } from '../middlewares/validators/usuario.validator.js';
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all usuario routes
router.use(authMiddleware);

router.get("/", validateGetUsuarios, usuarioController.getUsuarios);
router.get("/sin-rol", validateGetUsuarios, usuarioController.getUsuariosSinRol);
router.get("/con-rol", validateGetUsuarios, usuarioController.getUsuariosConRol);
router.get("/:id_usuario", usuarioController.getUsuario);
router.post("/", validateCreateUsuario, usuarioController.createUsuario);
router.put("/:id_usuario", validateUpdateUsuario, usuarioController.updateUsuario);
router.put("/:id_usuario/rol", validateAssignRolUsuario, usuarioController.assignRolUsuario);
router.delete("/:id_usuario/rol", validateUnassignRolUsuario, usuarioController.unassignRolUsuario);
router.delete("/:id_usuario", validateDeleteUsuario, usuarioController.deleteUsuario);

export default router;
