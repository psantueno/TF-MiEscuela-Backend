import cron from "node-cron";
import { Calificacion } from "../models/index.js";
import { Op } from "sequelize";
import { DateTime } from "luxon";

const FECHAS_PUBLICACION = ["2025-10-30"];

// Cron job diario a la medianoche
cron.schedule(
    "26 21 * * *", // todos los días a las 21:15
    async () => {
        const hoy = DateTime.now().setZone("America/Argentina/Buenos_Aires");
        const hoyStr = hoy.toISODate(); // "YYYY-MM-DD"

        if (FECHAS_PUBLICACION.includes(hoyStr)) {
            try {
                const [actualizados] = await Calificacion.update(
                    { publicado: true },
                    {
                        where: {
                            publicado: false,
                            fecha: { [Op.lte]: hoy }
                        }
                    }
                );

                console.log(`✅ ${actualizados} calificaciones publicadas automáticamente.`);
            } catch (error) {
                console.error("❌ Error al actualizar calificaciones:", error);
            }
        } else {
            console.log(`🕒 Aún no se alcanzó la fecha de publicación (${FECHAS_PUBLICACION.map(fecha => fecha).join(", ")}).`);
        }
    },
    {
        timezone: "America/Argentina/Buenos_Aires" 
    }
);
