import { z } from "zod";
import { errorHandler } from "../../utils/validatorErrorHandler.util.js";
import { ValidationError } from "../../utils/validationError.util.js";

const isParsableDate = (value) => {
  const d = new Date(value);
  return !isNaN(d.getTime());
};

const baseCreateSchema = z
  .object({
    anio: z
      .number("El año debe ser un número")
      .int("El año debe ser un entero")
      .min(1, "El año es obligatorio"),
    fecha_inicio: z
      .string("La fecha de inicio debe ser un string")
      .refine(isParsableDate, "La fecha de inicio no es válida"),
    fecha_fin: z
      .string("La fecha de fin debe ser un string")
      .refine(isParsableDate, "La fecha de fin no es válida"),
    estado: z.string("El estado debe ser un string").optional(),
  })
  .superRefine((val, ctx) => {
    const di = new Date(val.fecha_inicio);
    const df = new Date(val.fecha_fin);
    if (di > df) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de inicio no puede ser posterior a la fecha de fin",
        path: ["fecha_inicio"],
      });
    }
  });

const baseUpdateSchema = z
  .object({
    anio: z
      .number("El año debe ser un número")
      .int("El año debe ser un entero")
      .min(1, "El año es obligatorio")
      .optional(),
    fecha_inicio: z
      .string("La fecha de inicio debe ser un string")
      .refine(isParsableDate, "La fecha de inicio no es válida")
      .optional(),
    fecha_fin: z
      .string("La fecha de fin debe ser un string")
      .refine(isParsableDate, "La fecha de fin no es válida")
      .optional(),
    estado: z.string("El estado debe ser un string").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.fecha_inicio && val.fecha_fin) {
      const di = new Date(val.fecha_inicio);
      const df = new Date(val.fecha_fin);
      if (di > df) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha de inicio no puede ser posterior a la fecha de fin",
          path: ["fecha_inicio"],
        });
      }
    }
  });

const idParamSchema = z.object({
  id_ciclo: z
    .number("El ID del ciclo debe ser un número")
    .int("El ID del ciclo debe ser un entero")
    .min(1, "El ID del ciclo es obligatorio"),
});

export const validateCreateCiclo = (req, res, next) => {
  try {
    if (!req.body) throw new Error("No se recibieron datos");
    // Convertir anio a número si viene como string
    const body = {
      ...req.body,
      anio: req.body.anio !== undefined ? Number(req.body.anio) : undefined,
    };
    baseCreateSchema.parse(body);
    next();
  } catch (error) {
    const err = errorHandler(error, z);
    next(err);
  }
};

export const validateUpdateCiclo = (req, res, next) => {
  try {
    if (!req.body) throw new Error("No se recibieron datos");
    const body = {
      ...req.body,
      anio:
        req.body.anio !== undefined && req.body.anio !== null
          ? Number(req.body.anio)
          : undefined,
    };
    baseUpdateSchema.parse(body);
    next();
  } catch (error) {
    const err = errorHandler(error, z);
    next(err);
  }
};

export const validateIdCiclo = (req, res, next) => {
  try {
    if (!req.params) throw new Error("No se recibieron parámetros");
    const parsed = idParamSchema.parse({
      id_ciclo: req.params.id_ciclo ? Number(req.params.id_ciclo) : NaN,
    });
    if (!parsed.id_ciclo) {
      throw new ValidationError("El ID del ciclo es obligatorio");
    }
    next();
  } catch (error) {
    const err = errorHandler(error, z);
    next(err);
  }
};

