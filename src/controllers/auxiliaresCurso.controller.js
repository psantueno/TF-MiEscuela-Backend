import * as auxiliaresCursoService from "../services/auxiliaresCurso.service.js";

export const getAuxiliaresCurso = async (req, res) => {
    try {
        const { page = 1, perPage = 10. , auxiliar_numero_documento, id_auxiliar } = req.query;
        const limit = parseInt(perPage);
        const offset = (parseInt(page) - 1) * limit;
        const auxiliaresCurso = await auxiliaresCursoService.getAuxiliaresCurso(limit, offset, auxiliar_numero_documento, id_auxiliar);
        res.json(auxiliaresCurso);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAuxiliarCursoById = async (req, res) => {
    try {
        const { id } = req.params;
        const auxiliarCurso = await auxiliaresCursoService.getAuxiliarCursoById(id);
        res.json(auxiliarCurso);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateAuxiliarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAuxiliarCurso = await auxiliaresCursoService.updateAuxiliarCurso(id, req.body);
        res.json(updatedAuxiliarCurso);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const createAuxiliarCurso = async (req, res) => {
    try {
        const newAuxiliarCurso = await auxiliaresCursoService.createAuxiliarCurso(req.body);
        res.status(201).json(newAuxiliarCurso);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteAuxiliarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAuxiliarCurso = await auxiliaresCursoService.deleteAuxiliarCurso(id);
        res.status(204).json(deletedAuxiliarCurso);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}