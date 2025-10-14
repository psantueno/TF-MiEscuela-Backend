import * as calificacionService from '../services/calificacion.service.js';

export const getCalificaciones = async (req, res) => {
    const { id_curso, id_materia } = req.query;
    const calificaciones = await calificacionService.getCalificaciones(id_curso, id_materia);
    res.json(calificaciones);
}

export const getCalificacionByAlumno = async (req, res) => {
    const { id_alumno } = req.params;
    const { id_materia } = req.query;
    const calificaciones = await calificacionService.getCalificacionByAlumno(id_alumno, id_materia);
    res.json(calificaciones);
}

export const updateManyCalificaciones = async (req, res) => {
    const { calificaciones } = req.body;
    await calificacionService.updateManyCalificaciones(calificaciones);
    res.json({ message: 'Calificaciones actualizadas correctamente' });
}

export const createManyCalificaciones = async (req, res) => {
    const { calificaciones } = req.body;
    await calificacionService.createManyCalificaciones(calificaciones);
    res.json({ message: 'Calificaciones creadas correctamente' });
}

export const deleteManyCalificaciones = async (req, res) => {
    const { calificaciones } = req.body;
    await calificacionService.deleteManyCalificaciones(calificaciones);
    res.json({ message: 'Calificaciones eliminadas correctamente' });
}