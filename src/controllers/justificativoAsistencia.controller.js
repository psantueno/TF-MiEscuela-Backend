import * as justificativoAsistenciaService from "../services/justificativoAsistencia.service.js";

export const getJustificativosCurso = async (req, res) => {
    const { id_curso } = req.params;
    const { id_alumno } = req.query;
    try{
        const justificativos = await justificativoAsistenciaService.getJustificativosCurso(id_curso, id_alumno);
        res.status(200).json(justificativos);
    }catch(error){
        res.status(500).json({ message: "Error al obtener los justificativos de asistencia", error: error.message });
    }
}

export const crearJustificativoAsistencia = async (req, res) => {
    const { id_asistencia } = req.params;
    const image_path = req.file ? req.file.path : null;

    const data = {
        id_asistencia,
        image_path,
        detalle_justificativo: req.body.detalle_justificativo,
        usuario: req.usuario
    }

    try{
        await justificativoAsistenciaService.createJustificativo(data);
        res.status(201).json({ message: "Justificativo de asistencia creado exitosamente" });
    }catch(error){
        res.status(500).json({ message: "Error al crear el justificativo de asistencia", error: error.message });
    }
}

export const actualizarEstadoJustificativo = async (req, res) => {
    const { id_justificativo } = req.params;
    const { estado, motivo_rechazo, detalle_justificativo } = req.body;
    try{
        await justificativoAsistenciaService.updateJustificativoEstado(id_justificativo, estado, motivo_rechazo, detalle_justificativo);
        res.status(200).json({ message: "Estado del justificativo actualizado exitosamente" });
    }catch(error){
        res.status(500).json({ message: "Error al actualizar el estado del justificativo", error: error.message });
        console.error("Error al actualizar el estado del justificativo:", error);
    }
}