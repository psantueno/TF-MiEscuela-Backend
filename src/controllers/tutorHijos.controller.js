import * as tutorHijosService from '../services/tutorHijos.service.js';

export const getTutoresHijos = async (req, res) => {
    try{
        const { page, perPage, tutor_numero_documento } = req.query;
        const limit = perPage ? parseInt(perPage) : 10;
        const offset = page ? (parseInt(page) - 1) * limit : 0;
        const tutoresHijos = await tutorHijosService.getTutoresHijos(limit, offset, { numero_documento: tutor_numero_documento });
        res.json(tutoresHijos);
    }catch(error){
        console.error("Error fetching tutors' children:", error);
        res.status(500).json({ message: "Error al obtener los hijos de los tutores" });
    }
}

export const getTutorHijos = async (req, res) => {
    const { id_tutor } = req.params;
    try{
        const tutorHijos = await tutorHijosService.getTutorHijos(id_tutor);
        res.json(tutorHijos);
    }catch(error){
        console.error("Error fetching tutor's children:", error);
        res.status(500).json({ message: "Error al obtener los hijos del tutor" });
    }
}

export const updateTutorHijos = async (req, res) => {
    const { id_tutor } = req.params;
    const { updated_hijos, added_hijos, deleted_hijos } = req.body;
    try{
        await tutorHijosService.updateTutorHijos(id_tutor, { updated: updated_hijos, added: added_hijos, deleted: deleted_hijos });
        res.json({ message: "Hijos del tutor actualizados correctamente" });
    }catch(error){
        console.error("Error updating tutor's children:", error);
        res.status(500).json({ message: "Error al actualizar los hijos del tutor" });
    }
}