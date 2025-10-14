import * as usuarioService from '../services/materia.service.js';

export const getMaterias = async (req, res) => {
    const { page = 1, perPage = 10 } = req.query;
    const limit = parseInt(perPage);
    const offset = (parseInt(page) - 1) * limit;

    const materias = await usuarioService.getMaterias(limit, offset);
    res.json(materias);
}

export const getCursosPorMateria = async (req, res) => {
    const { id } = req.params;
    const cursos = await usuarioService.getCursosPorMateria(id);
    res.json(cursos);
}