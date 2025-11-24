import cron from 'node-cron';
import * as notificacionesService from '../services/notificaciones.service.js';

// Cron job mensual el primer día de cada mes a las 00:00 AM
cron.schedule(
    '0 0 1 * *', // El primer día de cada mes a las 00:00
    async () => {
        try {
            const notificacionesEliminadas = await notificacionesService.deleteOldNotificaciones();
            console.log(`✅ Notificaciones antiguas eliminadas: ${notificacionesEliminadas}`);
        } catch (error) {
            console.error('❌ Error al limpiar notificaciones antiguas:', error);
        }
    },
    {
        timezone: 'America/Argentina/Buenos_Aires' // Asegura que se ejecute en la zona horaria correcta
    }
);