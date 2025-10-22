import { Materia, Curso, Alumno, Usuario, Docente, MateriasCurso, AlumnosCursos, CiclosLectivos, sequelize} from "../models/index.js";
import { Op } from "sequelize";

/** Retorna los cursos según el rol del usuario
 * Administrador y Director: todos los cursos
 * Docente: solo los cursos donde dicta clase
 * Asesor Pedagógico: solo cursos asignados (pendiente)
 */
export const getCursos = async (user) => {
    if(user.rol === "Administrador" || user.rol === "Director" || user.rol === "Asesor Pedagogico"){
        const cursos = await Curso.findAll({
            attributes: [
                [sequelize.fn('MAX', sequelize.col('id_curso')), 'id_curso'],
                'anio_escolar',
                'division'
            ],
            group: ['anio_escolar', 'division'],
            order: [['anio_escolar', 'ASC'], ['division', 'ASC']],
        });
        return cursos;
    }
    
    if(user.rol === "Docente"){
        const cicloActual = new Date().getFullYear();

        const docente = await Docente.findOne({
            where: { id_usuario: user.id_usuario },
            attributes: ['id_docente']
        });

        const cursos = await Curso.findAll({
            where: { 
                '$cicloLectivo.anio$': cicloActual.toString(),
                '$materiasCurso.docentes.id_docente$': docente.id_docente
            },
            include: [
                {
                    model: MateriasCurso,
                    as: 'materiasCurso',
                    include: [
                        {
                            model: Docente,
                            as: 'docentes',
                            attributes: []
                        }
                    ],
                    attributes: []
                },
                {
                    model: CiclosLectivos,
                    as: 'cicloLectivo',
                    attributes: []
                }
            ],
            attributes: [
                'id_curso',
                'anio_escolar',
                'division',
            ],
            order: [
                ['anio_escolar', 'ASC'],
                ['division', 'ASC']
            ],
        });
        return cursos;
    }
    return [];
}

export const getMateriasPorCurso = async (idCurso, user) => {
    if(user.rol === "Administrador" || user.rol === "Director" || user.rol === "Asesor Pedagogico"){
        const materias = await Materia.findAll({
            include: [
                {
                    model: MateriasCurso,
                    as: 'materiasCurso',
                    include: [
                        {
                            model: Curso,
                            as: 'curso',
                            attributes: []
                        }
                    ],
                    attributes: []
                }
            ],
            attributes: [
                'id_materia',
                'nombre',
            ],
            where: sequelize.where(sequelize.col('materiasCurso.curso.id_curso'), idCurso),
            order: [['nombre', 'ASC']]
        });

        return materias;
    }
    if(user.rol === "Docente"){
        const docente = await Docente.findOne({
            where: { id_usuario: user.id_usuario },
            attributes: ['id_docente']
        });
        const materias = await Materia.findAll({
            include: [
                {
                    model: MateriasCurso,
                    as: 'materiasCurso',
                    include: [
                        {
                            model: Curso,
                            as: 'curso',
                            attributes: []
                        },
                        {
                            model: Docente,
                            as: 'docentes',
                            attributes: []
                        }
                    ],
                    attributes: []
                }
            ],
            attributes: [
                'id_materia',
                'nombre',
            ],
            where: {
                '$materiasCurso.curso.id_curso$': idCurso,
                '$materiasCurso.docentes.id_docente$': docente.id_docente,
            },
            order: [['nombre', 'ASC']]
        });

        return materias;
    }
}

export const getAlumnosPorCurso = async (idCurso) => {
    const alumnos = await Alumno.findAll({
        include: [
            {
                model: Curso,
                as: 'cursos',
                where: { id_curso: idCurso },
                attributes: []
            },
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['apellido','nombre']
            }
        ],
        attributes: ['id_alumno'],
        order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC'], [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']]
    });

    return alumnos;
};

export const getDocentesPorCurso = async (idCurso) => {
    const docentes = await Docente.findAll({
        include: [
            {
                model: MateriasCurso,
                as: 'materiasCurso',
                where: { id_curso: idCurso },
                through: {
                    attributes: ['fecha_inicio', 'fecha_fin'],
                    where: {
                        // Docentes activos actualmente
                        [Op.and]: [
                            { fecha_inicio: { [Op.lte]: sequelize.fn('NOW') } },
                            {
                                [Op.or]: [
                                    { fecha_fin: { [Op.gte]: sequelize.fn('NOW') } },
                                    { fecha_fin: null } // sin fecha de fin => sigue activo
                                ]
                            }
                        ]
                    }
                },
                include: [
                    {
                        model: Curso,
                        as: 'curso',
                        attributes: []
                    },
                    {
                        model: Materia,
                        as: 'materia',
                        attributes: ['nombre', 'id_materia']
                    }
                ]
            },
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['apellido','nombre']
            }
        ],
        attributes: ['id_docente'],
    });

    return docentes;
};
