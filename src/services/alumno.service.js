import { Alumno, Usuario, Curso } from "../models/index.js";

export const getAlumnos = async (idCurso) => {
    const whereClause = {};
    if (idCurso) whereClause.id_curso = idCurso;

    const alumnos = await Alumno.findAll({
        where: whereClause,
        include: [
            {
                model: Usuario,
                attributes: ["nombre", "apellido"],
                as: 'usuario'
            },
            {
                model: Curso,
                attributes: ['id_curso', 'anio_escolar', 'division'],
                as: 'curso'
            }
        ],
        attributes: ["id_alumno"],
        order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC'], [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']]
    });

    return alumnos;
}
