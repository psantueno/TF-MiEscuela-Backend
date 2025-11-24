import { Asistencia, AsistenciaEstado, JustificativosAsistencia, Auxiliar, Usuario, Alumno } from "../models/index.js";
import { Op } from "sequelize";
import { formatLocalDate } from "../utils/formatLocalDate.js";

const mapInasistencias = (asistencias) => {
    return asistencias.map(a => ({
        id_asistencia: a.id_asistencia,
        fecha: formatLocalDate(a.fecha),
        estado: a.AsistenciaEstado?.descripcion || null,
        justificativo: a.justificativos?.length ? {
            estado: a.justificativos[0].estado,
            auxiliar: a.justificativos[0].auxiliar ? `${a.justificativos[0].auxiliar.usuario.apellido} ${a.justificativos[0].auxiliar.usuario.nombre}` : null,
            image_path: a.justificativos[0].image_path,
            detalle_justificativo: a.justificativos[0].detalle_justificativo,
            motivo_rechazo: a.justificativos[0].motivo_rechazo,
            id_justificativo: a.justificativos[0].id_justificativo
        } : null
    }))
}

export const getInasistenciasAlumno = async (id_alumno) => {
    const asistencias = await Asistencia.findAll({
        where: { id_alumno },
        include: [
            {
                model: AsistenciaEstado,
                where: { descripcion: 'Ausente' },
                attributes: ['descripcion']
            },
            {
                model: JustificativosAsistencia,
                required: false,
                attributes: ['estado', 'image_path', 'id_auxiliar', 'detalle_justificativo', 'motivo_rechazo', 'id_justificativo'],
                include: [
                    {
                        model: Auxiliar,
                        required: false,
                        include: [
                            { model: Usuario, attributes: ['nombre', 'apellido'], as: 'usuario' }
                        ],
                        as: 'auxiliar'
                    }
                ],
                limit: 1,
                order: [['id_justificativo', 'DESC']],
                as: 'justificativos'
            }
        ],
        order: [['fecha', 'DESC']],
        limit: 5
    })
    return mapInasistencias(asistencias)
}

export const getAlertasAsistenciasSemanales = async () => {
    const fechaActual = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaActual.getDate() - 4); // Últimos 5 días

    const asistencias = await Asistencia.findAll({
        where: {
            fecha: {
                [Op.between]: [fechaInicio, fechaActual]
            }
        },
        include: [
            {
                model: AsistenciaEstado,
                where: { descripcion: 'Ausente' },
                attributes: ['descripcion']
            },
            {
                model: Alumno,
                attributes: ['id_alumno'],
                include: [
                    {
                        model: Usuario,
                        attributes: ['nombre', 'apellido'],
                        as: 'usuario'
                    }
                ]
            }
        ]
    });
    const plainAsistencias = asistencias.map(a => a.get({ plain: true }));
    
    const alumnosConInasistenciasCriticas = [];

    plainAsistencias.forEach(asistencia => {
        if(alumnosConInasistenciasCriticas.some(a => a.id_alumno === asistencia.id_alumno)) {
            alumnosConInasistenciasCriticas.find(a => a.id_alumno === asistencia.id_alumno).inasistencias += 1;
        }else{
            alumnosConInasistenciasCriticas.push({
                id_alumno: asistencia.id_alumno,
                nombre_completo: `${asistencia.Alumno.usuario.apellido} ${asistencia.Alumno.usuario.nombre}`,
                inasistencias: 1
            });
        }
    });

    const filteredAlumnos = alumnosConInasistenciasCriticas.filter(a => a.inasistencias >= 3);

    return filteredAlumnos;
};

export const getAlertasAsistenciasMensuales = async () => {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;

    if(mesActual === 1 || mesActual === 2) throw new Error("No se pueden obtener alertas de asistencias para los meses de enero y febrero.");

    const anioActual = fechaActual.getFullYear();
    const fechaInicio = new Date(anioActual, mesActual - 2, 1); // Primer día del mes anterior
    const fechaFin = new Date(anioActual, mesActual - 1, 0); // Último día del mes anterior

    const asistencias = await Asistencia.findAll({
        where: {
            fecha: {
                [Op.between]: [fechaInicio, fechaFin]
            }
        },
        include: [
            {
                model: AsistenciaEstado,
                where: { descripcion: 'Ausente' },
                attributes: ['descripcion']
            },
            {
                model: Alumno,
                attributes: ['id_alumno'],
                include: [
                    {
                        model: Usuario,
                        attributes: ['nombre', 'apellido'],
                        as: 'usuario'
                    }
                ]
            }
        ]
    });

    const plainAsistencias = asistencias.map(a => a.get({ plain: true }));
    
    const alumnosConInasistenciasCriticas = [];

    plainAsistencias.forEach(asistencia => {
        if(alumnosConInasistenciasCriticas.some(a => a.id_alumno === asistencia.id_alumno)) {
            alumnosConInasistenciasCriticas.find(a => a.id_alumno === asistencia.id_alumno).inasistencias += 1;
        }else{
            alumnosConInasistenciasCriticas.push({
                id_alumno: asistencia.id_alumno,
                nombre_completo: `${asistencia.Alumno.usuario.apellido} ${asistencia.Alumno.usuario.nombre}`,
                inasistencias: 1
            });
        }
    });

    const filteredAlumnos = alumnosConInasistenciasCriticas.filter(a => a.inasistencias >= 5);

    return filteredAlumnos;
}