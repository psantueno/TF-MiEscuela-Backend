import { Materia, Curso, Alumno, Usuario, Docente, MateriasCurso, AlumnosCursos} from "../models/index.js";

/** Retorna los cursos según el rol del usuario
 * Administrador y Director: todos los cursos
 * Docente: solo los cursos donde dicta clase
 */
export const getCursos = async (user) => {
    if(user.rol === "Administrador" || user.rol === "Director"){
        const cursos = await Curso.findAll({
            attributes: ["id_curso", "anio_escolar", "division"],
            order: [["anio_escolar", "ASC"], ["division", "ASC"]],
            group: ["anio_escolar", "division"]
        });
        return cursos;
    }

    if(user.rol === "Docente"){
        const docente = await Docente.findOne({
            where: { id_usuario: user.id_usuario },
            attributes: ['id_docente']
        });

        const cursos = await Curso.findAll({
            include: [
                {
                    model: MateriasCurso,
                    as: 'materiasCurso',
                    include: [
                        {
                        model: Docente,
                            as: 'docentes',
                            where: { id_docente: docente.id_docente },
                            attributes: []
                        }
                    ],
                    attributes: []
                }
            ],
            attributes: [
                'id_curso',
                'anio_escolar',
                'division',
                'ciclo_lectivo'
            ],
            group: ['Curso.id_curso', 'Curso.anio_escolar', 'Curso.division', 'Curso.ciclo_lectivo'],
            order: [["anio_escolar", "ASC"], ["division", "ASC"]]
        });
        return cursos;
    }
}

export const getMateriasPorCurso = async (anio_escolar, division) => {
    /*const materias = await Curso.findByPk(idCurso,{
        include: [
            {
                model: Materia,
                as: 'materias',
                through: { attributes: [] },
                attributes: ['id_materia', 'nombre']
            }
        ]
    }).then(curso => curso ? curso.materias : []);
    return materias;*/

    const materias = await Materia.findAll({
    include: [
        {
            model: MateriasCurso,
            as: 'materiasCurso',
            include: [
                {
                    model: Curso,
                    as: 'curso',
                    where: {
                        anio_escolar: anio_escolar,
                        division: division
                    },
                    attributes: []
                }
            ],
            attributes: []
        }
    ],
    attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('Materia.id_materia')), 'id_materia'],
        'nombre',
    ],
    });

    return materias;
}

export const getAlumnosPorCurso = async (anio_escolar, division) => {
    /*const alumnos = await Curso.findByPk(idCurso, {
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
    return alumnos;*/

    const curso = await Curso.findOne({
        where: { anio_escolar, division },
        order: [['ciclo_lectivo', 'DESC']],
        attributes: ['id_curso', 'anio_escolar', 'division', 'ciclo_lectivo']
    });

    if (!curso) return [];

    const alumnos = await Alumno.findAll({
        include: [
            {
                model: AlumnosCursos,
                as: 'cursos',
                where: { id_curso: curso.id_curso },
                attributes: []
            },
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre_completo']
            }
        ],
        attributes: ['id_alumno'],
        order: [['nombre_completo', 'ASC']]
    });

    return alumnos;
};
