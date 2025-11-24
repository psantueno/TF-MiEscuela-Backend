import cron from "node-cron";
import * as asistenciaController from "../controllers/asistencia.controller.js";
import * as alumnoController from "../controllers/alumno.controller.js";
import * as notificacionesController from "../controllers/notificaciones.controller.js";

cron.schedule(
    "00 22 * * 5", // todos los viernes a las 22:00
    async () => {
        try{
            // Obtener alumnos con inasistencias críticas(+3) en la última semana
            const alumnosConInasistenciasCriticas = await asistenciaController.obtenerAlertasAsistenciasSemanales();

            // Obtener tutores de cada alumno
            for (const alumnoData of alumnosConInasistenciasCriticas) {
                const tutores = await alumnoController.getTutoresAlumno(alumnoData.id_alumno);
                alumnoData.tutores = tutores;
            }

            // Filtrar alumnos que tienen tutores asignados
            const filteredAlumnos = alumnosConInasistenciasCriticas.filter(alumno => alumno.tutores && alumno.tutores.length > 0);

            const notificacionesData = [];

            // Mapear datos para notificaciones
            filteredAlumnos.forEach(alumno => {
                alumno.tutores.forEach(tutor => {
                    notificacionesData.push({
                        id_usuario: tutor,
                        nombre_completo: alumno.nombre_completo,
                        inasistencias: alumno.inasistencias
                    });
                });
            });

            // Crear notificaciones masivas
            await notificacionesController.createManyNotificaciones('ASISTENCIA_CRITICA_SEMANAL', notificacionesData);
            console.log("Notificaciones por inasistencias criticas creadas: ", notificacionesData.length);
        }catch(error){
            console.error("Error en job de notificaciones de inasistencias críticas:", error);
        }
    },
    {
        timezone: "America/Argentina/Buenos_Aires" 
    }
)