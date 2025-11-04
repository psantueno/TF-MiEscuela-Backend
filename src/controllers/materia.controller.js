import * as materiaService from '../services/materia.service.js';

export const getMaterias = async (req, res, next) => {
    try {
        const { _start, _end, _sort, _order, q } = req.query;
        // RA Simple REST variant
        if (_start !== undefined && _end !== undefined) {
            const start = parseInt(_start, 10) || 0;
            const end = parseInt(_end, 10) || 0;
            const limit = Math.max(0, end - start);
            const offset = Math.max(0, start);
            const nombre = q ? String(q) : req.query.nombre;
            const descripcion = req.query.descripcion;
            const { data, total } = await materiaService.getMaterias(limit, offset, { nombre, descripcion, sort: _sort, order: _order });
            const items = (data || []).map(m => ({ id: m.id_materia, nombre: m.nombre }));
            res.set('Content-Range', `materias ${start}-${start + items.length - 1}/${total}`);
            res.set('Access-Control-Expose-Headers', 'Content-Range');
            return res.status(200).json(items);
        }

        // Legacy variant (data/total)
        const { page = 1, perPage = 10, nombre, descripcion, sort, order } = req.query;
        const limit = parseInt(perPage);
        const offset = (parseInt(page) - 1) * limit;
        const { data, total } = await materiaService.getMaterias(limit, offset, { nombre, descripcion, sort, order });
        const mapped = Array.isArray(data) ? data.map(m => ({ ...m.toJSON?.() ?? m, id: m.id_materia })) : [];
        res.status(200).json({ data: mapped, total });
    } catch (err) {
        next(err);
    }
}

export const getMateria = async (req, res, next) => {
    try {
        const { id_materia } = req.params;
        const materia = await materiaService.getMateria(id_materia);
        if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
        const data = { ...materia.toJSON?.() ?? materia, id: materia.id_materia };
        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
}

export const createMateria = async (req, res, next) => {
    try {
        const materia = await materiaService.createMateria(req.body);
        const data = { ...materia.toJSON?.() ?? materia, id: materia.id_materia };
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
}

export const updateMateria = async (req, res, next) => {
    try {
        const { id_materia } = req.params;
        const materia = await materiaService.updateMateria(id_materia, req.body);
        if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
        const data = { ...materia.toJSON?.() ?? materia, id: materia.id_materia };
        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
}

export const deleteMateria = async (req, res, next) => {
    try {
        const { id_materia } = req.params;
        const deleted = await materiaService.deleteMateria(id_materia);
        if (!deleted) return res.status(404).json({ error: 'Materia no encontrada' });
        // For React-Admin, return the id of the deleted record
        res.status(200).json({ id: parseInt(id_materia, 10) });
    } catch (err) {
        if (err?.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ error: 'No se puede eliminar la materia porque tiene cursos asociados. Debe quitar las asignaciones de curso antes de eliminarla.' });
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
