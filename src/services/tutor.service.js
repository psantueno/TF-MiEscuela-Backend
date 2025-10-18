import { Alumno, Tutor, Usuario, Curso } from "../models/index.js";

export const getHijos = async (idTutor) => {
    console.log("ID del tutor en getHijos:", idTutor); 
    const tutor = await Tutor.findOne({
        where: { id_tutor: idTutor },
        include: [
            {
                model: Alumno,
                as: 'alumnos',
                attributes: ['id_alumno'],
                include: [
                    { 
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre','apellido']
                    },
                    {
                        model: Curso,
                        as: 'curso',
                        attributes: ['id_curso', 'anio_escolar', 'division']
                    }
                ]
            }
        ],
        order: [[{ model: Alumno, as: 'alumnos' }, { model: Usuario, as: 'usuario' }, 'apellido', 'ASC'], [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']]
    });
    return tutor ? tutor.alumnos : [];
}
