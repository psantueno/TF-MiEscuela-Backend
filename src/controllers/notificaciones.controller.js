import * as notificacionesService from "../services/notificaciones.service.js";

export const getNotificaciones = async (req, res) => {
    try{
        const user = req.usuario;
        const notificaciones = await notificacionesService.getNotificaciones(user);
        res.json(notificaciones);
    }catch(error){
        console.error("Error al obtener notificaciones:", error);
        res.status(500).json({ message: "Error al obtener notificaciones", error: error.message });
    }
}

export const updateNotificacion = async (req, res) => {
    try {
        const { id_notificacion } = req.params;
        const data = req.body;
        await notificacionesService.updateNotificacion(id_notificacion, data);
        res.json({ message: "Notificación actualizada correctamente" });
    } catch (error) {
        console.error("Error al actualizar notificación:", error);
        res.status(500).json({ message: "Error al actualizar notificación", error: error.message });
    }
}

export const createManyNotificaciones = async (type, data) => {
    try{
        await notificacionesService.createManyNotificaciones(type, data);
    }catch(error){
        throw new Error("Error al crear notificaciones masivas", error);
    }
}

export const deleteOldNotificaciones = async () => {
    try{
        const notificacionesEliminadas = await notificacionesService.deleteOldNotificaciones();
        return notificacionesEliminadas;
    }catch(error){
        console.error("Error al eliminar notificaciones antiguas:", error);
        res.status(500).json({ message: "Error al eliminar notificaciones antiguas", error: error.message });
    }
}