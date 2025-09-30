import { Rol } from '../models/Rol.js';

export const getRoles = async (filter) => {
    const whereClause = {};
    if(filter){
        const parsedFilter = JSON.parse(filter);
        whereClause.id_rol = parsedFilter.id;
    }

    const roles = await Rol.findAll({
        attributes: ['id_rol', 'nombre_rol'],
        where: {
            ...whereClause
        }
    });
    return roles;
}
