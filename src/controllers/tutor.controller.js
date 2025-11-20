import * as tutorService from "../services/tutor.service.js";

export const getHijos = async (req, res) => {
    const { id_tutor } = req.tutor;
    const hijos = await tutorService.getHijos(id_tutor);
    res.json(hijos);
}

export const getTutores = async (req, res) => {
    try{
        const tutores = await tutorService.getTutores();
        res.json(tutores);
    }catch(error){
        console.error("Error fetching tutors:", error);
        res.status(500).json({ message: "Error al obtener tutores" });
    }
}