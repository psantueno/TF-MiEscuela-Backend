import { Router } from "express";
import { getCiclos, getCiclo, createCiclo, updateCiclo, deleteCiclo } from "../controllers/cicloLectivo.controller.js";
import { cicloNoCerrado } from "../middlewares/isCicloEditable.middleware.js";
import { validateCreateCiclo, validateUpdateCiclo, validateIdCiclo } from "../middlewares/validators/cicloLectivo.validator.js";

const router = Router();

// GET list (paginado opcional) => { data, total }
router.get("/", getCiclos);

// GET uno por id
router.get("/:id_ciclo", validateIdCiclo, getCiclo);

// POST crear
router.post("/", validateCreateCiclo, createCiclo);

// PUT actualizar
router.put("/:id_ciclo", validateIdCiclo, cicloNoCerrado, validateUpdateCiclo, updateCiclo);

// DELETE eliminar
router.delete("/:id_ciclo", validateIdCiclo, cicloNoCerrado, deleteCiclo);

export default router;
