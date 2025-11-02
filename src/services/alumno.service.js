import { Alumno, Usuario, Curso } from "../models/index.js";

export const getAlumnos = async (idCurso) => {
    const include = [
        {
            model: Usuario,
            attributes: ["nombre", "apellido"],
            as: 'usuario'
        },
        {
            model: Curso,
            as: 'cursos',
            attributes: ['id_curso', 'anio_escolar', 'division'],
            ...(idCurso ? { where: { id_curso: idCurso } } : {})
        }
    ];

    const alumnos = await Alumno.findAll({
        include,
        attributes: ["id_alumno"],
        order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC'], [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']]
    });

    return alumnos;
}
