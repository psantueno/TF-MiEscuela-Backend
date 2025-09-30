import * as usuarioService from '../services/usuario.service.js';

export const getUsuarios = async (req, res, next) => {
    try{
        const { page = 1, perPage = 10 } = req.query;
        const limit = parseInt(perPage);
        const offset = (parseInt(page) - 1) * limit;

        const { users, total } = await usuarioService.getUsuarios(limit, offset);

        res.json({ 
            data: users,
            meta: {
                total,
                page: parseInt(page),
                perPage: limit,
                totalPages: Math.ceil(total / limit)
            }
        });
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