import { Alumno, Docente, Usuario, Curso, Materia, Calificacion, MateriasCurso } from "../models/index.js";

export const getCalificaciones = async (idCurso, idMateria, idAlumno) => {
    /*const whereClause = {};
    if (idMateria) whereClause.id_materia = idMateria;
    if (idAlumno) whereClause.id_alumno = idAlumno;

    const calificaciones = await Calificacion.findAll({ 
        where: whereClause,  
        include: [
            {
                model: Alumno,
                include: [
                    { 
                        model: Usuario, 
                        attributes: ['nombre_completo'],
                        as: 'usuario' 
                    }
                ],
                as: 'alumno'
            },
            {
                model: Docente,
                include: [
                    { 
                        model: Usuario, 
                        attributes: ['nombre_completo'],
                        as: 'usuario' 
                    }
                ],
                as: 'docente'
            },
            {
                model: Curso,
                attributes: ['anio_escolar', 'division'],
                as: 'curso'
            },
            {
                model: Materia,
                attributes: ['nombre'],
                as: 'materia'
            }
        ],
        order: [
            ['ciclo_lectivo', 'DESC'],
            [{ model: Alumno, as: 'alumno' }, { model: Usuario, as: 'usuario' }, 'nombre_completo', 'ASC']
        ]
    });
    return calificaciones; */

    const materiasWhereClause = {id_curso: idCurso};
    if (idMateria) materiasWhereClause.id_materia = idMateria;

    const alumnosWhereClause = {};
    if (idAlumno) alumnosWhereClause.id_alumno = idAlumno;

    const calificaciones = await Calificacion.findAll({
        include: [
            {
                model: MateriasCurso,
                as: 'materiaCurso',
                where: materiasWhereClause,
                include: [
                    {
                        model: Materia,
                        as: 'materia',
                        attributes: ['nombre'],
                    },
                ],
            },
            {
                model: Alumno,
                as: 'alumno',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido'],
                    }
                ]
            },
            {
                model: Docente,
                as: 'docente',
                include: [
                    {   
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido'],
                    }
                ]
            }
        ],
        where: alumnosWhereClause,
        order: [[{ model: Alumno, as: 'alumno' }, { model: Usuario, as: 'usuario' }, 'apellido', 'ASC'], [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']],
    });
};

export const updateManyCalificaciones = async (calificaciones) => {
    const updatePromises = calificaciones.map(calificacion => {
        const { id_calificacion, ...updateData } = calificacion;
        return Calificacion.update({
            nota: parseFloat(updateData.nota),
            observaciones: updateData.observaciones,
            tipo: updateData.tipo,
            fecha: new Date()
        }, { where: { id_calificacion } });
    });
    await Promise.all(updatePromises);
}

export const createManyCalificaciones = async (calificaciones) => {
    const createPromises = calificaciones.map(calificacion => {
        console.log(calificacion);
        return Calificacion.create({
            id_alumno: calificacion.id_alumno,
            id_docente: 2,
            id_curso: calificacion.id_curso,
            id_materia: calificacion.id_materia,
            ciclo_lectivo: calificacion.ciclo_lectivo,
            nota: parseFloat(calificacion.nota),
            observaciones: calificacion.observaciones,
            tipo: calificacion.tipo,
            fecha: new Date()
        });
    });
    await Promise.all(createPromises);
}
