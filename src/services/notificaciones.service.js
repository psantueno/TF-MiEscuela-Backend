import { Notificacion } from "../models/index.js";
import { transformUTCToLocalDate } from "../utils/formatLocalDate.js";
import { DateTime } from "luxon";

const NOTIFICACIONES = {
    'ASISTENCIA_CRITICA_SEMANAL': {
        titulo: 'Alerta de Asistencia Semanal',
        detalle: 'El alumno ${nombre_completo} ha tenido ${inasistencias} inasistencias en la última semana. Por favor, revise su situación. Recuerde que puede entrar a la sección "Cargar justificativos" para gestionar las inasistencias.'
    },
    'ASISTENCIA_CRITICA_MENSUAL': {
        titulo: 'Alerta de Asistencia Mensual',
        detalle: 'El alumno ${nombre_completo} ha tenido ${inasistencias} inasistencias en el último mes. Por favor, revise su situación. Recuerde que puede entrar a la sección "Cargar justificativos" para gestionar las inasistencias.'
    },
    'BAJO_RENDIMIENTO': {
        titulo: 'Alerta de Bajo Rendimiento Académico',
        detalle: 'El alumno ${nombre_completo} tiene un promedio de ${promedio} en la materia ${materia}, lo cual indica un bajo rendimiento académico. Le recomendamos tomar las medidas necesarias para apoyar al alumno. Recuerde que puede revisar las calificaciones en la sección "Calificaciones de mis hijos"'
    },
    'JUSTIFICATIVO_VALIDADO': {
        titulo: 'Justificativo Revisado',
        detalle: 'El justificativo para el alumno ${nombre_completo} para la fecha ${fecha_inasistencia} ha sido revisado. El auxiliar del curso ha cambiado el estado de su justificativo a "${estado}". Puede revisar el estado de sus justificativos en la sección "Cargar justificativos".'
    }
}

const generateNotificacion = (tipo, data) => {
    const plantilla = NOTIFICACIONES[tipo];

    if (!plantilla) throw new Error("Tipo de notificación no válido");

    let detalle = plantilla.detalle;
    for (const key in data) {
        const placeholder = `\${${key}}`;
        detalle = detalle.replace(placeholder, data[key]);
    }

    return {
        titulo: plantilla.titulo,
        detalle
    };
}

const mapNotificacion = (notificacion) => {
    return {
        id_notificacion: notificacion.id_notificacion,
        titulo: notificacion.titulo,
        detalle: notificacion.detalle,
        fecha: transformUTCToLocalDate(notificacion.fecha),
        leido: notificacion.leido,
    }
}

export const getNotificaciones = async (user) => {
    const notificaciones = await Notificacion.findAll({
        where: { id_usuario: user.id_usuario },
        order: [['fecha', 'DESC']]
    });
    return notificaciones.map(mapNotificacion);
}

export const updateNotificacion = async (id_notificacion, data) => {
    const notificacion = await Notificacion.findByPk(id_notificacion);

    if (!notificacion) throw new Error("Notificacion no encontrada");

    await notificacion.update(data);
}

export const createManyNotificaciones = async (type, data) => {
    const notificacionesData = data.map(d => {
        const idUsuario = d.id_usuario;
        delete d.id_usuario;
        const notificacion = generateNotificacion(type, d);
        return {
            ...notificacion,
            id_usuario: idUsuario,
        }
    });

    await Notificacion.bulkCreate(notificacionesData);
}

export const deleteOldNotificaciones = async () => {
    const fechaLimite = DateTime.now().minus({ months: 3 }).toJSDate();
    const notificacionesEliminadas = await Notificacion.destroy({
        where: {
            fecha: {
                [Op.lt]: fechaLimite
            }
        }
    });

    return notificacionesEliminadas;
}