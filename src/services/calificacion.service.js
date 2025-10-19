import { Alumno, Docente, Usuario, Curso, Materia, Calificacion, MateriasCurso, TipoCalificacion, CiclosLectivos } from "../models/index.js";


export const getCalificaciones = async (idCurso, idMateria, idAlumno, user) => {
    const materiasWhereClause = {id_curso: idCurso};
    if (idMateria) materiasWhereClause.id_materia = idMateria;

    const alumnosWhereClause = {};
    if (idAlumno) alumnosWhereClause.id_alumno = idAlumno;

    const cicloActual = new Date().getFullYear();

    const includeBase = [
        {
            model: MateriasCurso,
            as: 'materiaCurso',
            where: materiasWhereClause,
            include: [
                {
                    model: Materia,
                    as: 'materia',
                    attributes: ['nombre']
                },
                {
                    model: Curso,
                    as: 'curso',
                    attributes: ['anio_escolar', 'division'],
                    include: [
                        {
                            model: CiclosLectivos,
                            as: 'cicloLectivo',
                            attributes: ['anio']
                        }
                    ]
                },
                {
                    model: Docente,
                    as: 'docentes',
                    attributes: ['id_docente']
                }
            ]
        },
        {
            model: Alumno,
            as: 'alumno',
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['apellido', 'nombre']
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
                    attributes: ['apellido', 'nombre']
                }
            ]
        },
        {
            model: TipoCalificacion,
            as: 'tipoCalificacion',
            attributes: ['descripcion']
        }
    ];

    let whereClause = alumnosWhereClause;

    if (user.rol === 'Docente') {
        whereClause = {
            ...alumnosWhereClause,
            '$materiaCurso.docentes.id_usuario$': user.id_usuario,
            '$materiaCurso.curso.cicloLectivo.anio$': cicloActual.toString()
        }
    } else if (user.rol === 'Director' || user.rol === 'Administrador') {
        // Solo tipo de calificación "Nota Final"
        whereClause = {
            ...alumnosWhereClause,
            //'$tipoCalificacion.descripcion$': 'Nota Final',
        };
    }

    const orderClause = [
        [{ model: Alumno, as: 'alumno' }, { model: Usuario, as: 'usuario' }, 'apellido', 'ASC'],
        [{ model: Alumno, as: 'alumno' }, { model: Usuario, as: 'usuario' }, 'nombre', 'ASC'],
        ['fecha', 'ASC']
    ];

    const calificaciones = await Calificacion.findAll({
        include: includeBase,
        where: whereClause,
        order: orderClause
    });

    return calificaciones;
};

export const getCalificacionesPorAlumno = async (idAlumno, user) => {
    const calificaciones = await Calificacion.findAll({
        include: [
            {
                model: Alumno,
                as: 'alumno',
                include: [
                    {
                        model: Usuario, 
                        as: 'usuario',
                        attributes: ['nombre', 'apellido']
                    }
                ]
            },
            {
                model: MateriasCurso,
                as: 'materiaCurso',
                include: [
                    {
                        model: Materia,
                        as: 'materia',
                        attributes: ['nombre']
                    },
                    {
                        model: Curso,
                        as: 'curso',
                        attributes: ['anio_escolar', 'division'],
                        include: [
                            {
                                model: CiclosLectivos,
                                as: 'cicloLectivo',
                                attributes: ['anio']
                            }
                        ]
                    },
                    {
                        model: Docente,
                        as: 'docentes',
                        attributes: ['id_docente'],
                        include: [
                            {
                                model: Usuario,
                                as: 'usuario',
                                attributes: ['nombre', 'apellido']
                            }
                        ]
                    }
                ]
            },
            {
                model: TipoCalificacion,
                as: 'tipoCalificacion',
                attributes: ['descripcion']
            }
        ],
        where: {
            id_alumno: idAlumno
        }
    });

    return calificaciones;
}

export const getTiposCalificacion = async () => {
    const tiposCalificacion = await TipoCalificacion.findAll();
    return tiposCalificacion;
}

export const updateManyCalificaciones = async (calificaciones, user) => {
    const docente = await Docente.findOne({
        where: { id_usuario: user.id_usuario },
        attributes: ['id_docente']
    });

    const updatePromises = calificaciones.map(calificacion => {
        const { id_calificacion, ...updateData } = calificacion;
        return Calificacion.update({
            nota: parseFloat(updateData.nota),
            observaciones: updateData.observaciones,
            id_tipo_calificacion: updateData.id_tipo_calificacion,
            id_docente: docente.id_docente,
            fecha: new Date()
        }, { where: { id_calificacion } });
    });
    await Promise.all(updatePromises);
}

export const createManyCalificaciones = async (calificaciones, user) => {
    const docente = await Docente.findOne({
        where: { id_usuario: user.id_usuario },
        attributes: ['id_docente']
    });

    const createPromises = calificaciones.map(async (calificacion) => {
        const materiaCurso = await MateriasCurso.findOne({
            where: {
                id_curso: calificacion.id_curso,
                id_materia: calificacion.id_materia
            }
        });

        return Calificacion.create({
            id_alumno: calificacion.id_alumno,
            id_docente: docente.id_docente,
            id_materia_curso: materiaCurso.id_materia_curso,
            id_tipo_calificacion: calificacion.id_tipo_calificacion,
            ciclo_lectivo: new Date().getFullYear(),
            nota: parseFloat(calificacion.nota),
            observaciones: calificacion.observaciones,
            fecha: new Date()
        });
    });
    await Promise.all(createPromises);
}
