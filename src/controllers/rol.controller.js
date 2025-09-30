import * as rolService from '../services/rol.service.js';   

export const getRoles = async (req, res, next) => {
    const { filter } = req.query;
    try{
        const roles = await rolService.getRoles(filter || '');
        res.status(200).json(roles);
    }catch(error){
        next(error);
    }
}