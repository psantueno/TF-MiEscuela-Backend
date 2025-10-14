import * as tutorService from "../services/tutor.service.js";

export const getHijos = async (req, res) => {
    const { id_tutor } = req.tutor;
    const hijos = await tutorService.getHijos(id_tutor);
    res.json(hijos);
}