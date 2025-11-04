import { Materia, Curso, MateriasCurso, CiclosLectivos, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { DatabaseError } from '../utils/databaseError.util.js';

export const getMaterias = async (limit, offset, filters = {}) => {
    const where = {};
    if (filters.nombre) where.nombre = { [Op.iLike]: `%${filters.nombre}%` };
    if (filters.descripcion) where.descripcion = { [Op.iLike]: `%${filters.descripcion}%` };

    // Sorting support (React-Admin friendly)
    const rawSort = String(filters.sort || '').trim();
    const sortOrder = String(filters.order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    // Allow only known columns; map 'id' to primary key
    const allowed = ['id', 'id_materia', 'nombre', 'descripcion'];
    const sortColumn = allowed.includes(rawSort) ? (rawSort === 'id' ? 'id_materia' : rawSort) : 'nombre';

    const { rows, count } = await Materia.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortColumn, sortOrder]],
        attributes: [
            'id_materia',
            'nombre',
            'descripcion',
            [sequelize.literal("EXISTS (SELECT 1 FROM materias_curso mc WHERE mc.id_materia = \"Materia\".\"id_materia\")"), 'bloquear_borrado'],
            [
                sequelize.literal(
                    "EXISTS (SELECT 1 FROM materias_curso mc JOIN cursos cu ON cu.id_curso = mc.id_curso JOIN ciclos_lectivos cl ON cl.id_ciclo = cu.id_ciclo WHERE mc.id_materia = \"Materia\".\"id_materia\" AND LOWER(cl.estado) IN ('abierto','planeamiento'))"
                ),
                'bloquear_edicion'
            ],
            [
                sequelize.literal(
                    "EXISTS (SELECT 1 FROM materias_curso mc JOIN cursos cu ON cu.id_curso = mc.id_curso JOIN ciclos_lectivos cl ON cl.id_ciclo = cu.id_ciclo WHERE mc.id_materia = \"Materia\".\"id_materia\" AND LOWER(cl.estado) = 'cerrado')"
                ),
                'bloquear_nombre_historico'
            ]
        ]
    });
    return { data: rows, total: count };
}

// (Se removieron variantes sin/con curso; mantenemos solo listado general)

export const getMateria = async (id_materia) => {
    return await Materia.findByPk(id_materia, {
        attributes: [
            'id_materia',
            'nombre',
            'descripcion',
            [sequelize.literal("EXISTS (SELECT 1 FROM materias_curso mc WHERE mc.id_materia = \"Materia\".\"id_materia\")"), 'bloquear_borrado'],
            [
                sequelize.literal(
                    "EXISTS (SELECT 1 FROM materias_curso mc JOIN cursos cu ON cu.id_curso = mc.id_curso JOIN ciclos_lectivos cl ON cl.id_ciclo = cu.id_ciclo WHERE mc.id_materia = \"Materia\".\"id_materia\" AND LOWER(cl.estado) IN ('abierto','planeamiento'))"
                ),
                'bloquear_edicion'
            ],
            [
                sequelize.literal(
                    "EXISTS (SELECT 1 FROM materias_curso mc JOIN cursos cu ON cu.id_curso = mc.id_curso JOIN ciclos_lectivos cl ON cl.id_ciclo = cu.id_ciclo WHERE mc.id_materia = \"Materia\".\"id_materia\" AND LOWER(cl.estado) = 'cerrado')"
                ),
                'bloquear_nombre_historico'
            ]
        ]
    });
}

export const createMateria = async (payload) => {
    const materia = await Materia.create({
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? null,
    });
    return materia;
}

export const updateMateria = async (id_materia, payload) => {
    const materia = await Materia.findByPk(id_materia);
    if (!materia) return null;
    // Si intenta cambiar el nombre y la materia est asociada a cursos de ciclos cerrados, bloquear
    const quiereCambiarNombre = Object.prototype.hasOwnProperty.call(payload, 'nombre') && String(payload.nombre) !== String(materia.nombre);
    if (quiereCambiarNombre) {
        const existeEnCicloCerrado = await MateriasCurso.findOne({
            where: { id_materia },
            include: [
                {
                    model: Curso,
                    as: 'curso',
                    required: true,
                    include: [
                        {
                            model: CiclosLectivos,
                            as: 'cicloLectivo',
                            required: true,
                            where: { estado: { [Op.iLike]: 'cerrado' } },
                            attributes: []
                        }
                    ],
                    attributes: []
                }
            ],
            attributes: ['id_materia_curso']
        });
        if (existeEnCicloCerrado) {
            throw new DatabaseError('No se puede modificar el nombre de la materia porque est asociada a cursos de ciclos lectivos cerrados. Para preservar la informacin histrica, cree una nueva materia o edite atributos no crticos (por ejemplo, la descripcin).', 409);
        }
    }
    await materia.update({
        nombre: payload.nombre ?? materia.nombre,
        descripcion: payload.descripcion ?? materia.descripcion,
    });
    return materia;
}

export const deleteMateria = async (id_materia) => {
    // Evitar eliminar si tiene cursos asociados
    const vinculos = await MateriasCurso.count({ where: { id_materia } });
    if (vinculos > 0) {
        const err = new Error('No se puede eliminar la materia porque tiene cursos asociados. Debe quitar las asignaciones de curso antes de eliminarla.');
        err.name = 'SequelizeForeignKeyConstraintError';
        throw err;
    }
    return await Materia.destroy({ where: { id_materia } });
}

// Relaciones auxiliares
export const getCursosPorMateria = async (id_materia) => {
    const cursos = await Curso.findAll({
        include: [
            {
                model: MateriasCurso,
                as: 'materiasCurso',
                where: { id_materia },
                attributes: [],
            },
        ],
        attributes: ['id_curso', 'anio_escolar', 'division'],
        order: [["anio_escolar", "ASC"], ["division", "ASC"]],
    });
    return cursos;
}

export const assignCursoAMateria = async (id_materia, id_curso) => {
    const [rel] = await MateriasCurso.findOrCreate({
        where: { id_materia, id_curso },
        defaults: { id_materia, id_curso },
    });
    return rel;
}

export const unassignCursoDeMateria = async (id_materia, id_curso) => {
    const deleted = await MateriasCurso.destroy({ where: { id_materia, id_curso } });
    return deleted; // number of rows deleted
}
