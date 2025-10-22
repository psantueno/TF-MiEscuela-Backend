import * as informePedagogicoService from "../services/informePedagogico.service.js";

export const getInformesPedagogicos = async (req, res) => {
    try{
        const { id_alumno, id_curso, id_materia } = req.query;
        const informes =  await informePedagogicoService.getInformesPedagogicos({id_alumno, id_curso, id_materia});
        res.status(200).json(informes);
    }catch(error){
        console.error("Error al obtener los informes pedagógicos:", error);
        res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
}

export const crearInformePedagogico = async (req, res) => {
    try{
        const user = req.usuario;
        const informeData = req.body;
        const nuevoInforme = await informePedagogicoService.crearInformePedagogico(informeData, user);
        res.status(201).json(nuevoInforme);
    }catch(error){
        console.error("Error al crear el informe pedagógico:", error);
        res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
}