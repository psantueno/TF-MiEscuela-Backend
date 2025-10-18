import { Tutor } from "../models/index.js";

export const isTutor = async (req, res, next) => {
    try{
        const userId = req.usuario?.id_usuario;
    
        const tutor = await Tutor.findOne({ where: { id_usuario: userId } });
        //const admin = await Administrador.findOne({ where: { id_usuario: userId } });

       // if(admin) return next();

        if(!tutor) return res.status(403).json({ message: "No autorizado. El usuario no es tutor." });

        req.tutor = tutor;
        next();
    }catch(error){
        console.error("Error en el middleware isTutor:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
}