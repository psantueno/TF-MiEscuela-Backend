import { Materia } from '../models/Materia.js';
import { Curso } from '../models/Curso.js';
import { Alumno } from '../models/Alumno.js';
import { Usuario } from '../models/Usuario.js';

export const getMaterias = async (limit, offset) => {
    const materias = await Materia.findAll({ limit, offset });
    return materias;
}

export const getCursosPorMateria = async (idMateria) => {
    const cursos = await Materia.findByPk(idMateria, {
        include: [
            {
                model: Curso,
                as: 'cursos',
                through: { attributes: [] },
                attributes: ['id_curso', 'anio_escolar', 'division'],
                include: [
                    { 
                        model: Alumno, 
                        as: 'alumnos', 
                        attributes: ['id_alumno'],
                        include: [
                            { model: Usuario, as: 'usuario', attributes: ['nombre_completo'] }
                        ]
                    }
                ]
            }
        ],
        order: [[{ model: Curso, as: 'cursos' }, 'anio_escolar', 'ASC'], [{ model: Curso, as: 'cursos' }, 'division', 'ASC'], [{ model: Curso, as: 'cursos' }, { model: Alumno, as: 'alumnos' }, { model: Usuario, as: 'usuario' }, 'nombre_completo', 'ASC']]
    }).then(materia => materia ? materia.cursos : []);
    return cursos;
}