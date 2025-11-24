import cron from "node-cron";
import * as cicloLectivoController from "../controllers/cicloLectivo.controller.js";
import * as calificacionController from "../controllers/calificacion.controller.js";

// Cron job diario a la medianoche
cron.schedule(
    "00 22 * * *", // todos los días a las 22:00
    async () => {
        try{
            const { fechaInicio, fechaCierre } = await cicloLectivoController.getFechaPublicacionCalificaciones();

            if(fechaInicio && fechaCierre){
                const publicados = await calificacionController.publicarCalificaciones(fechaInicio, fechaCierre);
                console.log(`Calificaciones publicadas: ${publicados.length}`);
            }else{
                console.log("No es la fecha de publicación de calificaciones.");
            }
        }catch(error){  
            console.error("Error en job de publicación de calificaciones:", error);
        }
    },
    {
        timezone: "America/Argentina/Buenos_Aires" 
    }
);
