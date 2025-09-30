import { z } from "zod";
import { errorHandler } from "../../utils/validatorErrorHandler.util.js";

const getUsuariosSchema = z.object({
    page: z.number("El número de página debe ser un número").int("El número de página debe ser un número entero").min(1, "El número de página debe ser mayor o igual a 1"),
    perPage: z.number("El número de resultados por página debe ser un número").int("El número de resultados por página debe ser un número entero").min(1, "El número de resultados por página debe ser mayor o igual a 1")
});

const createUsuarioSchema = z.object({
    nombre_completo: z.string("El nombre completo debe ser una cadena de caracteres").min(1, "El nombre completo es obligatorio"),
    numero_documento: z.string("El número de documento debe ser una cadena de caracteres").min(1, "El número de documento es obligatorio"),
    email: z.string("El email debe ser una cadena de caracteres").regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "El formato del email no es válido"),
    contrasenia: z.string("La contraseña debe ser una cadena de caracteres").min(8, "La contraseña debe tener al menos 8 caracteres"),
    telefono: z.string("El teléfono debe ser una cadena de caracteres").optional(),
    direccion: z.string("La dirección debe ser una cadena de caracteres").optional(),
    fecha_nacimiento: z.string("La fecha de nacimiento debe ser una cadena de caracteres").optional(),
    genero: z.string("El género debe ser una cadena de caracteres").optional(),
    id_rol: z.number("El ID del rol debe ser un número").int().min(1, "El ID del rol es obligatorio")
})

const updateUsuarioSchema = z.object({
    nombre_completo: z.string("El nombre completo debe ser una cadena de caracteres").min(1, "El nombre completo es obligatorio"),
    numero_documento: z.string("El número de documento debe ser una cadena de caracteres").min(1, "El número de documento es obligatorio"),
    email: z.string("El email debe ser una cadena de caracteres").regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "El formato del email no es válido"),
    telefono: z.string("El teléfono debe ser una cadena de caracteres").optional(),
    direccion: z.string("La dirección debe ser una cadena de caracteres").optional(),
    fecha_nacimiento: z.string("La fecha de nacimiento debe ser una cadena de caracteres").optional(),
    genero: z.string("El género debe ser una cadena de caracteres").optional(),
    id_rol: z.number("El ID del rol debe ser un número").int().min(1, "El ID del rol es obligatorio")
})

const deleteUsuarioSchema = z.object({
    id_usuario: z.number("El ID del usuario debe ser un número").int().min(1, "El ID del usuario es obligatorio")
})

export const validateGetUsuarios = (req, res, next) => {
    try{
        if(req.query) getUsuariosSchema.parse({
            page: req.query.page ? parseInt(req.query.page) : 1,
            perPage: req.query.perPage ? parseInt(req.query.perPage) : 10
        });
        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
}

export const validateCreateUsuario = (req, res, next) => {
    try{
        if(!req.body) throw new Error("No se recibieron datos");

        createUsuarioSchema.parse(req.body);
        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
};

export const validateUpdateUsuario = (req, res, next) => {
    try{
        if(!req.body) throw new Error("No se recibieron datos");

        updateUsuarioSchema.parse(req.body);
        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
};

export const validateDeleteUsuario = (req, res, next) => {
    try{
        if(!req.params) throw new Error("No se recibieron datos");

        deleteUsuarioSchema.parse({
            id_usuario: req.params.id_usuario ? parseInt(req.params.id_usuario) : NaN
        });
        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
};
