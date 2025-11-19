import { Alumno, Docente, Usuario, Curso, Materia, Calificacion, MateriasCurso, TipoCalificacion, CiclosLectivos } from "../models/index.js";

const mapCalificaciones = (calificaciones) => {
    return calificaciones.map(calificacion => {
        const plainCalificacion = calificacion.get({ plain: true });
        return {
            id_calificacion: plainCalificacion.id_calificacion,
            nota: plainCalificacion.nota,
            fecha: plainCalificacion.fecha,
            publicado: plainCalificacion.publicado,
            materiaCurso: {
                id_materia: plainCalificacion.materiaCurso.id_materia,
                materia: {
                    nombre: plainCalificacion.materiaCurso.materia.nombre
                },
                curso: {
                    anio_escolar: plainCalificacion.materiaCurso.curso.anio_escolar,
                    division: plainCalificacion.materiaCurso.curso.division,
                    cicloLectivo: {
                        anio: plainCalificacion.materiaCurso.curso.cicloLectivo.anio
                    },
                },
                docentes: plainCalificacion.materiaCurso.docentes.map(docente => ({
                    id_docente: docente.id_docente,
                    rol: docente.DocentesMateriasCurso.rol_docente,
                }))
            },
            alumno: {
                id_alumno: plainCalificacion.alumno.id_alumno,
                usuario: {
                    nombre: plainCalificacion.alumno.usuario.nombre,
                    apellido: plainCalificacion.alumno.usuario.apellido
                }
            },
            docente: {
                id_docente: plainCalificacion.docente.id_docente,
                usuario: {
                    nombre: plainCalificacion.docente.usuario.nombre,
                    apellido: plainCalificacion.docente.usuario.apellido
                }
            },
            tipoCalificacion: {
                descripcion: plainCalificacion.tipoCalificacion.descripcion
            }
        };
    });
}

const mapCalificacionesPorAlumno = (calificaciones) => {
    return calificaciones.map(calificacion => {
        const plainCalificacion = calificacion.get({ plain: true });
        return {
            id_calificacion: plainCalificacion.id_calificacion,
            nota: plainCalificacion.nota,
            fecha: plainCalificacion.fecha,
            publicado: plainCalificacion.publicado,
            alumno: {
                id_alumno: plainCalificacion.alumno.id_alumno,
                usuario: {
                    nombre: plainCalificacion.alumno.usuario.nombre,
                    apellido: plainCalificacion.alumno.usuario.apellido
                }
            },
            materiaCurso:{
                id_materia: plainCalificacion.materiaCurso.id_materia_curso,
                materia: {
                    nombre: plainCalificacion.materiaCurso.materia.nombre
                },
                curso: {
                    anio_escolar: plainCalificacion.materiaCurso.curso.anio_escolar,
                    division: plainCalificacion.materiaCurso.curso.division,
                    cicloLectivo: {
                        anio: plainCalificacion.materiaCurso.curso.cicloLectivo.anio
                    },
                },
                docentes: plainCalificacion.materiaCurso.docentes.map(docente => ({
                    id_docente: docente.id_docente,
                    rol: docente.DocentesMateriasCurso.rol_docente,
                    usuario: {
                        nombre: docente.usuario.nombre,
                        apellido: docente.usuario.apellido
                    }
                }))
            },
            tipoCalificacion: {
                descripcion: plainCalificacion.tipoCalificacion.descripcion
            }
        }
    });
};

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
            ],
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
        [{ model: TipoCalificacion, as: 'tipoCalificacion' }, 'descripcion', 'ASC'],
        ['fecha', 'ASC']
    ];

    const calificaciones = await Calificacion.findAll({
        include: includeBase,
        where: whereClause,
        order: orderClause,
        attributes: ['id_calificacion', 'nota', 'fecha', 'publicado'],
    });

    return mapCalificaciones(calificaciones);
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
                ],
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
                        attributes: ['anio_escolar', 'division', 'id_curso'],
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
                ],
            },
            {
                model: TipoCalificacion,
                as: 'tipoCalificacion',
                attributes: ['descripcion']
            }
        ],
        where: {
            id_alumno: idAlumno
        },
    });

    return mapCalificacionesPorAlumno(calificaciones);
}

export const getTiposCalificacion = async () => {
    const tiposCalificacion = await TipoCalificacion.findAll();
    return tiposCalificacion;
}

export const updateManyCalificaciones = async (calificaciones, user) => {
    let idDocente = null;
    if(user.rol !== "Docente") {
        const docentes = await getCurrentActiveDocentePorCursoMateria(calificaciones[0].id_curso, calificaciones[0].id_materia);
        const plainDocentes = docentes.get({ plain: true });
        idDocente = plainDocentes.docentes.find(docente => docente.DocentesMateriasCurso.rol_docente === "Titular").id_docente;
    }
    if(user.rol === "Docente"){
        const docente = await Docente.findOne({
            where: { id_usuario: user.id_usuario },
            attributes: ['id_docente']
        });
        idDocente = docente.id_docente;
    }

    if(!idDocente) throw new Error("No se pudo determinar el docente para actualizar las calificaciones.");

    const updatePromises = calificaciones.map(calificacion => {
        const { id_calificacion, ...updateData } = calificacion;
        return Calificacion.update({
            nota: parseFloat(updateData.nota),
            id_tipo_calificacion: updateData.id_tipo_calificacion,
            id_docente: idDocente,
            fecha: new Date()
        }, { where: { id_calificacion } });
    });
    await Promise.all(updatePromises);
}

export const createManyCalificaciones = async (calificaciones, user) => {
        let idDocente = null;

        if(user.rol !== "Docente") {
            const docentes = await getCurrentActiveDocentePorCursoMateria(calificaciones[0].id_curso, calificaciones[0].id_materia);
            const plainDocentes = docentes.get({ plain: true });
            idDocente = plainDocentes.docentes.find(docente => docente.DocentesMateriasCurso.rol_docente === "Titular").id_docente;
        }
        if(user.rol === "Docente"){
            const docente = await Docente.findOne({
                where: { id_usuario: user.id_usuario },
                attributes: ['id_docente']
            });
            idDocente = docente.id_docente;
        }

    if(!idDocente) throw new Error("No se pudo determinar el docente para actualizar las calificaciones.");

    const createPromises = calificaciones.map(async (calificacion) => {
        const materiaCurso = await MateriasCurso.findOne({
            where: {
                id_curso: calificacion.id_curso,
                id_materia: calificacion.id_materia
            }
        });

        return Calificacion.create({
            id_alumno: calificacion.id_alumno,
            id_docente: idDocente,
            id_materia_curso: materiaCurso.id_materia_curso,
            id_tipo_calificacion: calificacion.id_tipo_calificacion,
            ciclo_lectivo: new Date().getFullYear(),
            nota: parseFloat(calificacion.nota),
            fecha: new Date()
        });
    });
    await Promise.all(createPromises);
}

const getCurrentActiveDocentePorCursoMateria = async (idCurso, idMateria) => {
    const docentes = MateriasCurso.findOne({
        include: [
            {
                model: Docente,
                as: 'docentes',
                attributes: ['id_docente', 'id_usuario'],
                through: {
                    attributes: ['rol_docente'],
                    where: {fecha_fin: null}
                }
            }
        ],
        where: {
            id_curso: idCurso,
            id_materia: idMateria
        }
    })
    return docentes;
}
