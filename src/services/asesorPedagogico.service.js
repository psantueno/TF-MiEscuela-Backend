import { AsesorPedagogico, Usuario } from "../models/index.js";

export const getAsesoresPedagogicos = async () => {
    const asesores = await AsesorPedagogico.findAll({
        include: [
            {
                model: Usuario,
                as: "usuario",
                attributes: ['nombre', 'apellido', 'email']
            }
        ]
    });
    return asesores;
}