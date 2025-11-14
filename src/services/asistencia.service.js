import { Asistencia, AsistenciaEstado, JustificativosAsistencia, Auxiliar, Usuario } from "../models/index.js";
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