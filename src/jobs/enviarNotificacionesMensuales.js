import cron from "node-cron";
import * as asistenciaController from "../controllers/asistencia.controller.js";
import * as alumnoController from "../controllers/alumno.controller.js";
import * as calificacionController from "../controllers/calificacion.controller.js";
import * as notificacionesController from "../controllers/notificaciones.controller.js";

cron.schedule(
    "00 09 1 * *", // el primer día de cada mes a las 09:00
    async () => {
        try{
            // Obtener alumnos con inasistencias críticas(+5) en el último mes
            const alumnosConInasistenciasCriticas = await asistenciaController.obtenerAlertasAsistenciasMensuales();
            
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
            await notificacionesController.createManyNotificaciones('ASISTENCIA_CRITICA_MENSUAL', notificacionesData);
            console.log("Notificaciones por inasistencias criticas mensuales creadas: ", notificacionesData.length);

            // Obtener alumnos con bajo rendimiento académico
            const alumnosConBajoRendimiento = await calificacionController.getAlertasBajoRendimiento();

            // Obtener tutores de cada alumno
            for (const alumnoData of alumnosConBajoRendimiento) {
                const tutores = await alumnoController.getTutoresAlumno(alumnoData.id_alumno);
                alumnoData.tutores = tutores;
            }

            // Filtrar alumnos que tienen tutores asignados
            const filteredAlumnosRendimiento = alumnosConBajoRendimiento.filter(alumno => alumno.tutores && alumno.tutores.length > 0);

            const notificacionesDataRendimiento = [];
            // Mapear datos para notificaciones
            filteredAlumnosRendimiento.forEach(alumno => {
                alumno.tutores.forEach(tutor => {
                    notificacionesDataRendimiento.push({
                        id_usuario: tutor,
                        nombre_completo: alumno.nombre_completo,
                        promedio: (alumno.notas.reduce((a, b) => a + parseFloat(b), 0) / alumno.notas.length).toFixed(2),
                        materia: alumno.nombre_materia
                    });
                });
            });

            // Crear notificaciones masivas
            await notificacionesController.createManyNotificaciones('BAJO_RENDIMIENTO', notificacionesDataRendimiento);
            console.log("Notificaciones de bajo rendimiento creadas: ", notificacionesDataRendimiento.length);
        }catch(error){
            //console.error("❌ Error al generar notificaciones mensuales:", error);
        }
    },
    {
        timezone: "America/Argentina/Buenos_Aires" // Asegura que se ejecute en la zona horaria correcta
    }
);