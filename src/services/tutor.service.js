import { Alumno, Tutor, Usuario, Curso } from "../models/index.js";

const mapHijos = (hijos) => {
    return hijos.map(hijo => {
        const plainHijo = hijo.get({ plain: true });
        return {
            id_alumno: plainHijo.id_alumno,
            usuario: {
                nombre: plainHijo.usuario.nombre,
                apellido: plainHijo.usuario.apellido
            },
            curso: plainHijo.cursos.map(curso => ({
                id_curso: curso.id_curso,
                anio_escolar: curso.anio_escolar,
                division: curso.division
            })),
            tutor: {
                parentesco: plainHijo.AlumnoTutor.parentesco
            }
        }
    });
};

export const getHijos = async (idTutor) => {
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
                        attributes: ['nombre', 'apellido']
                    },
                    {
                        model: Curso,
                        as: 'cursos',
                        through: { where: { fecha_fin: null } },
                        attributes: ['id_curso', 'anio_escolar', 'division']
                    }
                ]
            }
        ],
        order: [
            [{ model: Alumno, as: 'alumnos' }, { model: Usuario, as: 'usuario' }, 'apellido', 'ASC'],
            [{ model: Alumno, as: 'alumnos' }, { model: Usuario, as: 'usuario' }, 'nombre', 'ASC'],
        ]
    });
    return tutor ? mapHijos(tutor.alumnos) : [];
}
