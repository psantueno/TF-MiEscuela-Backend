import { Materia } from "../models/Materia.js";
import { Curso } from "../models/Curso.js";
import { Alumno } from "../models/Alumno.js";
import { Usuario } from "../models/Usuario.js";
import { sequelize } from "../config/database.js";

export const getMateriasPorCurso = async (idCurso) => {
    const materias = await Curso.findByPk(idCurso,{
        include: [
            {
                model: Materia,
                as: 'materias',
                through: { attributes: [] },
                attributes: ['id_materia', 'nombre']
            }
        ]
    }).then(curso => curso ? curso.materias : []);
    return materias;
}

export const getAlumnosPorCurso = async (idCurso) => {
    const alumnos = await Curso.findByPk(idCurso, {
        include: [
            {
                model: Alumno,
                as: 'alumnos',
                attributes: ['id_alumno'],
                include: [
                    { 
                        model: Usuario, 
                        as: 'usuario',
                        attributes: ['nombre_completo']
                    },
                    {
                        model: Curso,
                        as: 'curso',
                        attributes: ['id_curso', 'anio_escolar', 'division']
                    }
                ]
            }
        ],
        order: [[{ model: Alumno, as: 'alumnos' }, { model: Usuario, as: 'usuario' }, 'nombre_completo', 'ASC']]
    }).then(curso => curso ? curso.alumnos : []);
    return alumnos;
};
