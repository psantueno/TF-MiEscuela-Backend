import { Materia, Curso, Alumno, Usuario, Docente, MateriasCurso, AlumnosCursos, sequelize} from "../models/index.js";

/** Retorna los cursos según el rol del usuario
 * Administrador y Director: todos los cursos
 * Docente: solo los cursos donde dicta clase
 */
export const getCursos = async (user) => {
    if(user.rol === "Administrador" || user.rol === "Director"){
        console.log("Obteniendo todos los cursos para rol:", user.rol);
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
        console.log("Obteniendo todos los cursos para rol:", user.rol);
        const cicloActual = new Date().getFullYear();

        const docente = await Docente.findOne({
            where: { id_usuario: user.id_usuario },
            attributes: ['id_docente']
        });

        const cursos = await Curso.findAll({
            where: { ciclo_lectivo: cicloActual },
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
            order: [
                ['anio_escolar', 'ASC'],
                ['division', 'ASC']
            ],
        });
        return cursos;
    }
}

export const getMateriasPorCurso = async (idCurso) => {
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
                        id_curso: idCurso
                    },
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
    });

    return materias;
}

export const getAlumnosPorCurso = async (idCurso) => {
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
