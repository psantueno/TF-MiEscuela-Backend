import { z } from "zod";
import { errorHandler } from "../../utils/validatorErrorHandler.util.js";
import { ValidationError } from "../../utils/validationError.util.js";

const allowedSortFields = ["id", "id_curso", "anio_escolar", "division"];

const createSchema = z.object({
  anio_escolar: z
    .number({ message: "El año escolar debe ser un número" })
    .int({ message: "El año escolar debe ser un entero" })
    .min(1, { message: "El año escolar es obligatorio" }),
  division: z.string({ message: "La división debe ser un string" }).max(10).optional(),
  id_ciclo: z
    .number({ message: "El ciclo lectivo debe ser un número" })
    .int({ message: "El ciclo lectivo debe ser un entero" })
    .min(1, { message: "El ciclo lectivo es obligatorio" }),
});

const updateSchema = z
  .object({
    anio_escolar: z
      .number({ message: "El año escolar debe ser un número" })
      .int({ message: "El año escolar debe ser un entero" })
      .min(1, { message: "El año escolar es obligatorio" })
      .optional(),
    division: z.string({ message: "La división debe ser un string" }).max(10).optional(),
    id_ciclo: z
      .number({ message: "El ciclo lectivo debe ser un número" })
      .int({ message: "El ciclo lectivo debe ser un entero" })
      .min(1, { message: "El ciclo lectivo es obligatorio" })
      .optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
    path: ["body"],
  });

const idParamSchema = z.object({
  id: z
    .number({ message: "El ID del curso debe ser un número" })
    .int({ message: "El ID del curso debe ser un entero" })
    .min(1, { message: "El ID del curso es obligatorio" }),
});

export const validateGetCursos = (req, res, next) => {
  try {
    const page = req.query.page !== undefined ? Number(req.query.page) : undefined;
    const perPage = req.query.perPage !== undefined ? Number(req.query.perPage) : undefined;
    if (page !== undefined && (isNaN(page) || page < 1)) throw new ValidationError("Parámetro page inválido");
    if (perPage !== undefined && (isNaN(perPage) || perPage < 1)) throw new ValidationError("Parámetro perPage inválido");

    if (req.query.sort && !allowedSortFields.includes(String(req.query.sort))) {
      throw new ValidationError("Campo de ordenamiento inválido");
    }
    if (req.query.order && !["ASC", "DESC", "asc", "desc"].includes(String(req.query.order))) {
      throw new ValidationError("Orden inválido (ASC/DESC)");
    }

    if (req.query.anio_escolar !== undefined && isNaN(Number(req.query.anio_escolar))) {
      throw new ValidationError("anio_escolar debe ser numérico");
    }
    if (req.query.id_ciclo !== undefined && isNaN(Number(req.query.id_ciclo))) {
      throw new ValidationError("id_ciclo debe ser numérico");
    }
    next();
  } catch (error) {
    const err = errorHandler(error, z);
    next(err);
  }
};

export const validateCreateCurso = (req, res, next) => {
  try {
    if (!req.body) throw new ValidationError("No se recibieron datos");
    const body = {
      ...req.body,
      anio_escolar: req.body.anio_escolar !== undefined ? Number(req.body.anio_escolar) : undefined,
      id_ciclo: req.body.id_ciclo !== undefined ? Number(req.body.id_ciclo) : undefined,
    };
    createSchema.parse(body);
    next();
  } catch (error) {
    const err = errorHandler(error, z);
    next(err);
  }
};

export const validateUpdateCurso = (req, res, next) => {
  try {
    if (!req.body) throw new ValidationError("No se recibieron datos");
    const body = {
      ...req.body,
      anio_escolar:
        req.body.anio_escolar !== undefined && req.body.anio_escolar !== null
          ? Number(req.body.anio_escolar)
          : undefined,
      id_ciclo:
        req.body.id_ciclo !== undefined && req.body.id_ciclo !== null
          ? Number(req.body.id_ciclo)
          : undefined,
    };
    updateSchema.parse(body);
    next();
  } catch (error) {
    const err = errorHandler(error, z);
    next(err);
  }
};

export const validateIdCurso = (req, res, next) => {
  try {
    if (!req.params) throw new ValidationError("No se recibieron parámetros");
    idParamSchema.parse({ id: req.params.id ? Number(req.params.id) : NaN });
    next();
  } catch (error) {
    const err = errorHandler(error, z);
    next(err);
  }
};
