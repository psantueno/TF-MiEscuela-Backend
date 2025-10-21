import * as materiaService from '../services/materia.service.js';

export const getMaterias = async (req, res, next) => {
    try {
        const { page = 1, perPage = 10, nombre, descripcion } = req.query;
        const limit = parseInt(perPage);
        const offset = (parseInt(page) - 1) * limit;
        const { data, total } = await materiaService.getMaterias(limit, offset, { nombre, descripcion });
        res.status(200).json({ data, total });
    } catch (err) {
        next(err);
    }
}

export const getMateria = async (req, res, next) => {
    try {
        const { id_materia } = req.params;
        const materia = await materiaService.getMateria(id_materia);
        if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
        res.status(200).json(materia);
    } catch (err) {
        next(err);
    }
}

export const createMateria = async (req, res, next) => {
    try {
        const materia = await materiaService.createMateria(req.body);
        res.status(201).json(materia);
    } catch (err) {
        next(err);
    }
}

export const updateMateria = async (req, res, next) => {
    try {
        const { id_materia } = req.params;
        const materia = await materiaService.updateMateria(id_materia, req.body);
        if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
        res.status(200).json(materia);
    } catch (err) {
        next(err);
    }
}

export const deleteMateria = async (req, res, next) => {
    try {
        const { id_materia } = req.params;
        const deleted = await materiaService.deleteMateria(id_materia);
        if (!deleted) return res.status(404).json({ error: 'Materia no encontrada' });
        res.sendStatus(204);
    } catch (err) {
        if (err?.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ error: 'No se puede eliminar: tiene cursos asociados' });
        }
        next(err);
    }
}

// Relaciones auxiliares
export const getCursosPorMateria = async (req, res, next) => {
    try {
        const { id_materia } = req.params;
        const cursos = await materiaService.getCursosPorMateria(id_materia);
        res.status(200).json(cursos);
    } catch (err) {
        next(err);
    }
}

export const assignCursoAMateria = async (req, res, next) => {
    try {
        const { id_materia, id_curso } = req.params;
        const rel = await materiaService.assignCursoAMateria(parseInt(id_materia), parseInt(id_curso));
        res.status(201).json(rel);
    } catch (err) {
        next(err);
    }
}

export const unassignCursoDeMateria = async (req, res, next) => {
    try {
        const { id_materia, id_curso } = req.params;
        await materiaService.unassignCursoDeMateria(parseInt(id_materia), parseInt(id_curso));
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
}
