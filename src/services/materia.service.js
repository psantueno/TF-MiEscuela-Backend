import { Materia } from '../models/index.js';

export const getMaterias = async (limit, offset) => {
    const materias = await Materia.findAll({ limit, offset });
    return materias;
}