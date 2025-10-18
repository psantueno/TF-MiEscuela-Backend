import * as calificacionService from '../services/calificacion.service.js';

export const getCalificaciones = async (req, res) => {
    try{
        const { anio_escolar, division, id_materia, id_alumno } = req.query;
        const calificaciones = await calificacionService.getCalificaciones(anio_escolar, division, id_materia, id_alumno);
        res.json(calificaciones);
    }catch(error){
        res.status(500).json({ error: "Error obteniendo calificaciones" });
    }
}

export const updateManyCalificaciones = async (req, res) => {
    try{
        const { calificaciones } = req.body;
        await calificacionService.updateManyCalificaciones(calificaciones);
        res.json({ message: 'Calificaciones actualizadas correctamente' });
    }catch(error){
        res.status(500).json({ error: "Error actualizando calificaciones" });
    }
}

export const createManyCalificaciones = async (req, res) => {
    try{
        const { calificaciones } = req.body;
        await calificacionService.createManyCalificaciones(calificaciones);
        res.json({ message: 'Calificaciones creadas correctamente' });
    }catch(error){
        res.status(500).json({ error: "Error creando calificaciones" });
    }
}