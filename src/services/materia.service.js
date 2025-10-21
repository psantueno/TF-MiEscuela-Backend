import { Materia, Curso, MateriasCurso, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

export const getMaterias = async (limit, offset, filters = {}) => {
    const where = {};
    if (filters.nombre) where.nombre = { [Op.iLike]: `%${filters.nombre}%` };
    if (filters.descripcion) where.descripcion = { [Op.iLike]: `%${filters.descripcion}%` };

    const { rows, count } = await Materia.findAndCountAll({
        where,
        limit,
        offset,
        order: [["nombre", "ASC"]],
    });
    return { data: rows, total: count };
}

export const getMateria = async (id_materia) => {
    return await Materia.findByPk(id_materia);
}

export const createMateria = async (payload) => {
    const materia = await Materia.create({
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? null,
    });
    return materia;
}

export const updateMateria = async (id_materia, payload) => {
    const materia = await Materia.findByPk(id_materia);
    if (!materia) return null;
    await materia.update({
        nombre: payload.nombre ?? materia.nombre,
        descripcion: payload.descripcion ?? materia.descripcion,
    });
    return materia;
}

export const deleteMateria = async (id_materia) => {
    // Evitar eliminar si tiene cursos asociados
    const vinculos = await MateriasCurso.count({ where: { id_materia } });
    if (vinculos > 0) {
        const err = new Error('No se puede eliminar: tiene cursos asociados');
        err.name = 'SequelizeForeignKeyConstraintError';
        throw err;
    }
    return await Materia.destroy({ where: { id_materia } });
}

// Relaciones auxiliares
export const getCursosPorMateria = async (id_materia) => {
    const cursos = await Curso.findAll({
        include: [
            {
                model: MateriasCurso,
                as: 'materiasCurso',
                where: { id_materia },
                attributes: [],
            },
        ],
        attributes: ['id_curso', 'anio_escolar', 'division'],
        order: [["anio_escolar", "ASC"], ["division", "ASC"]],
    });
    return cursos;
}

export const assignCursoAMateria = async (id_materia, id_curso) => {
    const [rel] = await MateriasCurso.findOrCreate({
        where: { id_materia, id_curso },
        defaults: { id_materia, id_curso },
    });
    return rel;
}

export const unassignCursoDeMateria = async (id_materia, id_curso) => {
    const deleted = await MateriasCurso.destroy({ where: { id_materia, id_curso } });
    return deleted; // number of rows deleted
}
