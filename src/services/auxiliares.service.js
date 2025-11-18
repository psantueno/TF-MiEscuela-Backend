import { Auxiliar, Usuario } from '../models/index.js';

export const getAuxiiares = async (limit, offset) => {
    return await Auxiliar.findAll({
        include: {
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'numero_documento']
        },
        limit,
        offset,
    });
}