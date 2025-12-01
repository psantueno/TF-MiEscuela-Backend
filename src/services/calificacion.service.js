import { Alumno, Docente, Usuario, Curso, Materia, Calificacion, MateriasCurso, TipoCalificacion, CiclosLectivos } from "../models/index.js";
import { Op } from "sequelize";
import { transformUTCDateOnly } from "../utils/formatLocalDate.js";

const mapCalificaciones = (calificaciones) => {
    return calificaciones.map(calificacion => {
        const plainCalificacion = calificacion.get({ plain: true });
        return {
            id_calificacion: plainCalificacion.id_calificacion,
            nota: plainCalificacion.nota,
            fecha: transformUTCDateOnly(plainCalificacion.fecha),
            publicado: plainCalificacion.publicado,
            materia: {
                id_materia: plainCalificacion.materiaCurso.id_materia,
                nombre: plainCalificacion.materiaCurso.materia.nombre
            },
            curso: {
                anio_escolar: plainCalificacion.materiaCurso.curso.anio_escolar,
                division: plainCalificacion.materiaCurso.curso.division,
                cicloLectivo: plainCalificacion.materiaCurso.curso.cicloLectivo.anio
            },
            
            alumno: {
                id_alumno: plainCalificacion.alumno.id_alumno,
                nombre: plainCalificacion.alumno.usuario.nombre,
                apellido: plainCalificacion.alumno.usuario.apellido
            },
            docente: {
                id_docente: plainCalificacion.docente.id_docente,
                nombre: plainCalificacion.docente.usuario.nombre,
                apellido: plainCalificacion.docente.usuario.apellido
            },
            tipoCalificacion: {
                descripcion: plainCalificacion.tipoCalificacion.descripcion,
                id_tipo_calificacion: plainCalificacion.tipoCalificacion.id_tipo_calificacion
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
                nombre: plainCalificacion.alumno.usuario.nombre,
                apellido: plainCalificacion.alumno.usuario.apellido
            },
            materia: {
                nombre: plainCalificacion.materiaCurso.materia.nombre
            },
            curso: {
                anio_escolar: plainCalificacion.materiaCurso.curso.anio_escolar,
                division: plainCalificacion.materiaCurso.curso.division,
                cicloLectivo: plainCalificacion.materiaCurso.curso.cicloLectivo.anio
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
            attributes: ['descripcion', 'id_tipo_calificacion']
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
        idDocente = plainDocentes.docentes.find(docente => docente.DocentesMateriasCurso.rol_docente === "Titular" || docente.DocentesMateriasCurso.rol_docente === "Interino").id_docente;
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
            id_docente: idDocente
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
        console.log("calificacion.fecha:", calificacion.fecha);
        let fecha = calificacion.fecha
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            fecha = calificacion.fecha;
        }
        console.log("fecha after validation:", fecha);

        return Calificacion.create({
            id_alumno: calificacion.id_alumno,
            id_docente: idDocente,
            id_materia_curso: materiaCurso.id_materia_curso,
            id_tipo_calificacion: calificacion.id_tipo_calificacion,
            nota: parseFloat(calificacion.nota),
            fecha: fecha,
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

export const getAlumnosConBajoRendimiento = async () => {
    const cicloLectivoAbierto = await CiclosLectivos.findOne({
        where: { estado: 'Abierto' },
        attributes: ['anio', 'id_ciclo', 'estado', 'inicio_primer_cuatrimestre', 'cierre_primer_cuatrimestre', 'inicio_segundo_cuatrimestre', 'cierre_segundo_cuatrimestre'],
    });
    const plainCiclo = cicloLectivoAbierto.get({ plain: true });

    const fechaActual = new Date();
    const fechaInicioPrimerCuatrimestre = new Date(plainCiclo.inicio_primer_cuatrimestre);
    const fechaCierrePrimerCuatrimestre = new Date(plainCiclo.cierre_primer_cuatrimestre);
    const fechaInicioSegundoCuatrimestre = new Date(plainCiclo.inicio_segundo_cuatrimestre);
    const fechaCierreSegundoCuatrimestre = new Date(plainCiclo.cierre_segundo_cuatrimestre);

    let fechaInicioFilter = null;
    let fechaCierreFilter = null;

    if(fechaActual >= fechaInicioPrimerCuatrimestre && fechaActual <= fechaCierrePrimerCuatrimestre){
        fechaInicioFilter = fechaInicioPrimerCuatrimestre;
        fechaCierreFilter = fechaCierrePrimerCuatrimestre;
    }else if(fechaActual >= fechaInicioSegundoCuatrimestre && fechaActual <= fechaCierreSegundoCuatrimestre){
        fechaInicioFilter = fechaInicioSegundoCuatrimestre;
        fechaCierreFilter = fechaCierreSegundoCuatrimestre;
    }

    if(!fechaInicioFilter || !fechaCierreFilter) throw new Error("No se pudo determinar el cuatrimestre actual para análisis de bajo rendimiento.");    

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
                        attributes: ['nombre', 'id_materia']
                    },
                    {
                        model: Curso,
                        as: 'curso',
                        attributes: ['anio_escolar', 'division'],
                        include: [
                            {
                                model: CiclosLectivos,
                                as: 'cicloLectivo',
                                attributes: ['anio', 'estado']
                            }
                        ]
                    }
                ]
            }
        ],
        where: { 
            id_tipo_calificacion: { [Op.in]: [1, 2] },
            '$materiaCurso.curso.cicloLectivo.estado$': 'Abierto',
            fecha: {
                [Op.between]: [fechaInicioFilter, fechaCierreFilter]
            }
        }
    });

    const plainCalificaciones = calificaciones.map(calificacion => calificacion.get({ plain: true }));

    const mappedResults = [];
    plainCalificaciones.forEach(calificacion => {
        if(mappedResults.some(r => r.id_alumno === calificacion.alumno.id_alumno && r.id_materia === calificacion.materiaCurso.materia.id_materia)) {
            mappedResults.find(r => r.id_alumno === calificacion.alumno.id_alumno && r.id_materia === calificacion.materiaCurso.materia.id_materia).notas.push(calificacion.nota);
        }else{
            mappedResults.push({
                id_alumno: calificacion.alumno.id_alumno,
                nombre_completo: `${calificacion.alumno.usuario.apellido} ${calificacion.alumno.usuario.nombre}`,
                id_materia: calificacion.materiaCurso.materia.id_materia,
                nombre_materia: calificacion.materiaCurso.materia.nombre,
                notas: [calificacion.nota]
            });
        }
    });

    const filteredResults = mappedResults.filter(alumno => {
        const notasNumericas = alumno.notas.map(n => parseFloat(n));
        const promedio = notasNumericas.reduce((acc, val) => acc + val, 0) / notasNumericas.length;

        return notasNumericas.length >= 3 && promedio < 6;
    });

    return filteredResults;
}

export const publicarCalificaciones = async (fechaInicio, fechaCierre) => {
    const [updated] = await Calificacion.update(
        { publicado: true },
        {
            where: {
                fecha: {
                    [Op.between]: [fechaInicio, fechaCierre]
                }
            }
        }
    );

    return calificacionesToUpdate;
}