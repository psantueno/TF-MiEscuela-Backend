import { z } from "zod";
import { Usuario } from "../../models/Usuario.js";
import { Rol } from "../../models/Rol.js";
import { Op } from 'sequelize';
import { ValidationError } from "../../utils/validationError.util.js";
import { errorHandler } from "../../utils/validatorErrorHandler.util.js";

const getUsuariosSchema = z.object({
    page: z.number("El número de página debe ser un número").int("El número de página debe ser un número entero").min(1, "El número de página debe ser mayor o igual a 1"),
    perPage: z.number("El número de resultados por página debe ser un número").int("El número de resultados por página debe ser un número entero").min(1, "El número de resultados por página debe ser mayor o igual a 1")
});

const createUsuarioSchema = z.object({
    nombre: z.string("El nombre debe ser una cadena de caracteres").min(1, "El nombre es obligatorio"),
    apellido: z.string("El apellido debe ser una cadena de caracteres").min(1, "El apellido es obligatorio"),
    numero_documento: z.string("El número de documento debe ser una cadena de caracteres").min(1, "El número de documento es obligatorio"),
    legajo: z.string("El legajo debe ser una cadena de caracteres").min(1, "El legajo es obligatorio"),
    email: z.string("El email debe ser una cadena de caracteres").regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "El formato del email no es válido"),
    contrasenia: z.string("La contraseña debe ser una cadena de caracteres").min(8, "La contraseña debe tener al menos 8 caracteres"),
    telefono: z.string("El teléfono debe ser una cadena de caracteres").optional(),
    domicilio: z.string("El domicilio debe ser una cadena de caracteres").optional(),
    fecha_nacimiento: z.string("La fecha de nacimiento debe ser una cadena de caracteres").optional(),
    genero: z.string("El género debe ser una cadena de caracteres").optional()
});

const updateUsuarioSchema = z.object({
    nombre: z.string("El nombre debe ser una cadena de caracteres").min(1, "El nombre es obligatorio"),
    apellido: z.string("El apellido debe ser una cadena de caracteres").min(1, "El apellido es obligatorio"),
    numero_documento: z.string("El número de documento debe ser una cadena de caracteres").min(1, "El número de documento es obligatorio"),
    legajo: z.string("El legajo debe ser una cadena de caracteres").min(1, "El legajo es obligatorio"),
    email: z.string("El email debe ser una cadena de caracteres").regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "El formato del email no es válido"),
    telefono: z.string("El teléfono debe ser una cadena de caracteres").optional(),
    domicilio: z.string("El domicilio debe ser una cadena de caracteres").optional(),
    fecha_nacimiento: z.string("La fecha de nacimiento debe ser una cadena de caracteres").optional(),
    genero: z.string("El género debe ser una cadena de caracteres").optional()
});

const deleteUsuarioSchema = z.object({
    id_usuario: z.number("El ID del usuario debe ser un número").int().min(1, "El ID del usuario es obligatorio")
});

const verifyEmailUnique = async (email, excludeUserId = null) => {
    const whereClause = { email };
    if (excludeUserId) whereClause.id_usuario = { [Op.ne]: excludeUserId };
    const user = await Usuario.findOne({ where: whereClause });
    return !!user;
}

const verifyDocumentUnique = async (numero_documento, excludeUserId = null) => {
    const whereClause = { numero_documento };
    if (excludeUserId) whereClause.id_usuario = { [Op.ne]: excludeUserId };
    const user = await Usuario.findOne({ where: whereClause });
    return !!user;
}

const verifyRecordNumberUnique = async (legajo, excludeUserId = null) => {
    const whereClause = { legajo };
    if (excludeUserId) whereClause.id_usuario = { [Op.ne]: excludeUserId };
    const user = await Usuario.findOne({ where: whereClause });
    return !!user;
}

const verifyUserExists = async (id_usuario) => {
    const user = await Usuario.findByPk(id_usuario);
    return !!user;
}

const verifyRoleExists = async (id_rol) => {
    const role = await Rol.findByPk(id_rol);
    return !!role;
}

export const validateGetUsuarios = (req, res, next) => {
    try{
        if(req.query) getUsuariosSchema.parse({
            page: req.query.page ? parseInt(req.query.page) : 1,
            perPage: req.query.perPage ? parseInt(req.query.perPage) : 10
        });
        // Extra validations para filtros opcionales (solo ignorar strings vacíos)
        if (typeof req.query.id_rol !== 'undefined') {
            const raw = String(req.query.id_rol).trim();
            if (raw !== '') {
                const idRol = parseInt(raw, 10);
                if (Number.isNaN(idRol) || idRol < 1) {
                    throw new ValidationError("ID de rol invalido");
                }
                req.query.id_rol = idRol;
            }
        }
        if (typeof req.query.numero_documento !== 'undefined') {
            const raw = String(req.query.numero_documento).trim();
            if (raw === '') {
                delete req.query.numero_documento;
            }
        }
        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
}

export const validateCreateUsuario = async (req, res, next) => { 
    try{
        if(!req.body) throw new Error("No se recibieron datos");

        createUsuarioSchema.parse(req.body);

        const { email, numero_documento, legajo } = req.body;
        const emailExists = await verifyEmailUnique(email);
        const documentExists = await verifyDocumentUnique(numero_documento);
        const recordNumberExists = await verifyRecordNumberUnique(legajo);

        if(emailExists) throw new ValidationError("El email ya está en uso");
        if(documentExists) throw new ValidationError("El número de documento ya está en uso");
        if(recordNumberExists) throw new ValidationError("El legajo ya está en uso");

        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
};

export const validateUpdateUsuario = async (req, res, next) => {
    try{
        if(!req.body) throw new Error("No se recibieron datos");

        updateUsuarioSchema.parse(req.body);

        const { email, numero_documento, legajo } = req.body;
        const id_usuario = req.params.id_usuario ? parseInt(req.params.id_usuario) : NaN;
        const userExists = await verifyUserExists(id_usuario);
        const emailExists = await verifyEmailUnique(email, id_usuario);
        const documentExists = await verifyDocumentUnique(numero_documento, id_usuario);
        const recordNumberExists = await verifyRecordNumberUnique(legajo, id_usuario);

        if(!userExists) throw new ValidationError("El usuario no existe", 404);
        if(emailExists) throw new ValidationError("El email ya está en uso");
        if(documentExists) throw new ValidationError("El número de documento ya está en uso");
        if(recordNumberExists) throw new ValidationError("El legajo ya está en uso");

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

        const { id_usuario } = req.params;
        if(!id_usuario) throw new ValidationError("El ID del usuario es obligatorio");

        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
};

const assignRolSchema = z.object({
    id_rol: z.number("El ID del rol debe ser un número").int().min(1, "El ID del rol es obligatorio")
});

export const validateAssignRolUsuario = async (req, res, next) => {
    try{
        if(!req.params || !req.body) throw new Error("No se recibieron datos");

        const id_usuario = req.params.id_usuario ? parseInt(req.params.id_usuario) : NaN;
        assignRolSchema.parse({ id_rol: req.body.id_rol ? parseInt(req.body.id_rol) : NaN });

        const { id_rol } = req.body;
        const userExists = await verifyUserExists(id_usuario);
        const roleExists = await verifyRoleExists(id_rol);

        if(!userExists) throw new ValidationError("El usuario no existe", 404);
        if(!roleExists) throw new ValidationError("El rol no existe", 404);

        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
};

export const validateUnassignRolUsuario = async (req, res, next) => {
    try{
        if(!req.params) throw new Error("No se recibieron datos");

        const id_usuario = req.params.id_usuario ? parseInt(req.params.id_usuario) : NaN;
        if(!id_usuario) throw new ValidationError("El ID del usuario es obligatorio");

        const userExists = await verifyUserExists(id_usuario);
        if(!userExists) throw new ValidationError("El usuario no existe", 404);

        next();
    }catch(error){
        const err = errorHandler(error, z);
        next(err);
    }
};
