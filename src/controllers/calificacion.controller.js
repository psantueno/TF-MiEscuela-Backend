import * as calificacionService from '../services/calificacion.service.js';

export const getCalificaciones = async (req, res) => {
    try{
        const { id_curso, id_materia, id_alumno } = req.query;
        const user = req.usuario;
        const calificaciones = await calificacionService.getCalificaciones(id_curso, id_materia, id_alumno, user);
        res.json(calificaciones);
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Error obteniendo calificaciones" });
    }
}

export const getCalificacionesPorAlumno = async (req, res) => {
    try{
        const { id } = req.params;
        const user = req.usuario;
        const calificaciones = await calificacionService.getCalificacionesPorAlumno(id, user);
        res.json(calificaciones);
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Error obteniendo calificaciones del alumno" });
    }
}

export const getTiposCalificacion = async (req, res) => {
    try{
        const tiposCalificacion = await calificacionService.getTiposCalificacion();
        res.json(tiposCalificacion);
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Error obteniendo tipos de calificación" });
    }
}

export const updateManyCalificaciones = async (req, res) => {
    try{
        const { calificaciones } = req.body;
        const user = req.usuario;
        await calificacionService.updateManyCalificaciones(calificaciones, user);
        res.json({ message: 'Calificaciones actualizadas correctamente' });
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Error actualizando calificaciones" });
    }
}

export const createManyCalificaciones = async (req, res) => {
    try{
        const { calificaciones } = req.body;
        const user = req.usuario;
        await calificacionService.createManyCalificaciones(calificaciones, user);
        res.json({ message: 'Calificaciones creadas correctamente' });
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Error creando calificaciones" });
    }
}