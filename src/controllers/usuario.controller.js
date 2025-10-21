import * as usuarioService from '../services/usuario.service.js';

export const getUsuarios = async (req, res, next) => {
    try{
        const { page = 1, perPage = 10, numero_documento, id_rol } = req.query;
        const limit = parseInt(perPage);
        const offset = (parseInt(page) - 1) * limit;

        const { users, total } = await usuarioService.getUsuarios(limit, offset, { numero_documento, id_rol });

        res.status(200).json({ data: users, total });
    }catch(error){
        next(error);
    }
}

export const getUsuariosSinRol = async (req, res, next) => {
    try{
        const { page = 1, perPage = 10, nombre, apellido, numero_documento, dni, sort, order } = req.query;
        const limit = parseInt(perPage);
        const offset = (parseInt(page) - 1) * limit;
        const ndoc = numero_documento || dni;

        const { users, total } = await usuarioService.getUsuariosSinRol(limit, offset, { nombre, apellido, numero_documento: ndoc, sort, order });

        res.status(200).json({ data: users, total });
    }catch(error){
        next(error);
    }
}

export const getUsuariosConRol = async (req, res, next) => {
    try{
        const { page = 1, perPage = 10, nombre, apellido, numero_documento, id_rol, sort, order } = req.query;
        const limit = parseInt(perPage);
        const offset = (parseInt(page) - 1) * limit;

        const { users, total } = await usuarioService.getUsuariosConRol(
            limit,
            offset,
            { nombre, apellido, numero_documento, id_rol, sort, order }
        );

        res.status(200).json({ data: users, total });
    }catch(error){
        next(error);
    }
}

export const getUsuario = async (req, res, next) => {
    try{
        const { id_usuario } = req.params;
        const user = await usuarioService.getUsuario(id_usuario);
        res.status(200).json(user);
    }catch(error){
        next(error);
    }
}

export const createUsuario = async (req, res, next) => {
    try{
        const user = await usuarioService.createUsuario(req.body);
        res.status(201).json(user);
    }catch(error){
        next(error);
    }
}

export const updateUsuario = async (req, res, next) => {
    try{
        const { id_usuario } = req.params;

        const updatedUser = await usuarioService.updateUsuario(id_usuario, req.body);

        res.json(updatedUser);
    }catch(error){
        next(error);
    }
}

export const deleteUsuario = async (req, res, next) => {
    try{
        const { id_usuario } = req.params;

        await usuarioService.deleteUsuario(id_usuario);

        res.sendStatus(204);
    }catch(error){
        next(error);
    }
}

export const assignRolUsuario = async (req, res, next) => {
    try{
        const { id_usuario } = req.params;
        const { id_rol } = req.body;
        const updatedUser = await usuarioService.assignRolUsuario(parseInt(id_usuario), parseInt(id_rol));
        res.status(200).json(updatedUser);
    }catch(error){
        next(error);
    }
}

export const unassignRolUsuario = async (req, res, next) => {
    try{
        const { id_usuario } = req.params;
        await usuarioService.unassignRolUsuario(parseInt(id_usuario));
        res.sendStatus(204);
    }catch(error){
        next(error);
    }
}
