import { Auxiliar, Curso, Usuario, AuxiliaresCurso, CiclosLectivos } from "../models/index.js";
import { Op } from "sequelize";

const mapAuxiliaresCurso = (auxiliarCurso) => {
    const plainAuxiliarCurso = auxiliarCurso.get({ plain: true });
    console.log(plainAuxiliarCurso);
    return {
        id_auxiliar: plainAuxiliarCurso.id_auxiliar,
        nombre: plainAuxiliarCurso.auxiliar.usuario.nombre,
        apellido: plainAuxiliarCurso.auxiliar.usuario.apellido,
        numero_documento: plainAuxiliarCurso.auxiliar.usuario.numero_documento,
        curso: {
            id_curso: plainAuxiliarCurso.curso.id_curso,
            anio_escolar: plainAuxiliarCurso.curso.anio_escolar,
            division: plainAuxiliarCurso.curso.division,
            ciclo_lectivo: plainAuxiliarCurso.curso.cicloLectivo.anio
        },
        fecha_inicio: plainAuxiliarCurso.fecha_inicio,
        fecha_fin: plainAuxiliarCurso.fecha_fin,
        rol: plainAuxiliarCurso.rol
    }
}

const decodeId = (id) => {
    const [id_auxiliar, id_curso, fecha_inicio] = id.split(':');
    return {
        id_auxiliar,
        id_curso,
        fecha_inicio
    }
}

export const getAuxiliaresCurso = async (limit, offset, auxiliar_numero_documento = null, id_auxiliar = null) => {
    const whereClause = {};

    if (auxiliar_numero_documento) {
        whereClause['$auxiliar.usuario.numero_documento$'] = {
            [Op.like]: `%${auxiliar_numero_documento}%`
        };
    }

    if (id_auxiliar) {
        whereClause['id_auxiliar'] = id_auxiliar;
    }

    const auxiliaresCurso = await AuxiliaresCurso.findAll({
        where: whereClause,
        include: [
            {
                model: Auxiliar,
                as: 'auxiliar',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido', 'numero_documento']
                    }
                ],
                attributes: ['id_auxiliar']
            },
            {
                model: Curso,
                as: 'curso',
                attributes: ['id_curso', 'anio_escolar', 'division'],
                include: [
                    {
                        model: CiclosLectivos,
                        as: 'cicloLectivo',
                        attributes: ['anio']
                    }
                ]
            }
        ],
        limit,
        offset,
        order: [
            [{ model: Curso, as: 'curso' }, { model: CiclosLectivos, as: 'cicloLectivo' }, 'anio', 'DESC'],
            [{ model: Curso, as: 'curso' }, 'anio_escolar', 'ASC'],
            [{ model: Curso, as: 'curso' }, 'division', 'ASC'],
            [{ model: Auxiliar, as: 'auxiliar' }, { model: Usuario, as: 'usuario' }, 'apellido', 'ASC'],
            [{ model: Auxiliar, as: 'auxiliar' }, { model: Usuario, as: 'usuario' }, 'nombre', 'ASC'],
        ]
    });

    return auxiliaresCurso.map(mapAuxiliaresCurso);
}

export const getAuxiliarCursoById = async (id) => {
    const { id_auxiliar, id_curso, fecha_inicio} = decodeId(id);

    const auxiliarCurso = await AuxiliaresCurso.findOne({
        where: {
            id_auxiliar,
            id_curso,
            fecha_inicio,
        },
        include: [
            {
                model: Auxiliar,
                as: 'auxiliar',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido', 'numero_documento']
                    }
                ],
                attributes: ['id_auxiliar']
            },
            {
                model: Curso,
                as: 'curso',
                attributes: ['id_curso', 'anio_escolar', 'division'],
                include: [
                    {
                        model: CiclosLectivos,
                        as: 'cicloLectivo',
                        attributes: ['anio']
                    }
                ]
            }
        ]
    });

    if (!auxiliarCurso) throw new Error('AuxiliarCurso no encontrado');

    return mapAuxiliaresCurso(auxiliarCurso);
}

export const updateAuxiliarCurso = async (id, data) => {
    const { id_auxiliar, id_curso, fecha_inicio} = decodeId(id);

    const auxiliarCurso = await AuxiliaresCurso.findOne({
        where: {
            id_auxiliar,
            id_curso,
            fecha_inicio,
        },
        include: [
            {
                model: Auxiliar,
                as: 'auxiliar',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido', 'numero_documento']
                    }
                ],
                attributes: ['id_auxiliar']
            },
            {
                model: Curso,
                as: 'curso',
                attributes: ['id_curso', 'anio_escolar', 'division'],
                include: [
                    {
                        model: CiclosLectivos,
                        as: 'cicloLectivo',
                        attributes: ['anio']
                    }
                ]
            }
        ]
    });

    if (!auxiliarCurso) throw new Error('AuxiliarCurso no encontrado');

    await auxiliarCurso.update({
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin || null,
        rol: data.rol
    });

    const updatedAuxiliarCurso = await AuxiliaresCurso.findOne({
        where: {
            id_auxiliar,
            id_curso,
            fecha_inicio,
        },
        include: [
            {
                model: Auxiliar,
                as: 'auxiliar',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido', 'numero_documento']
                    }
                ],
                attributes: ['id_auxiliar']
            },
            {
                model: Curso,
                as: 'curso',
                attributes: ['id_curso', 'anio_escolar', 'division'],
                include: [
                    {
                        model: CiclosLectivos,
                        as: 'cicloLectivo',
                        attributes: ['anio']
                    }
                ]
            }
        ]
    });

    return mapAuxiliaresCurso(updatedAuxiliarCurso);
}

export const createAuxiliarCurso = async (data) => {
    const newAuxiliarCurso = await AuxiliaresCurso.create({
        id_auxiliar: data.id_auxiliar,
        id_curso: data.id_curso,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin || null,
        rol: data.rol
    });

    const auxiliarCurso = await AuxiliaresCurso.findOne({
        where: {
            id_auxiliar: newAuxiliarCurso.id_auxiliar,
            id_curso: newAuxiliarCurso.id_curso,
            fecha_inicio: newAuxiliarCurso.fecha_inicio
        },
        include: [
            {
                model: Auxiliar,
                as: 'auxiliar',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido', 'numero_documento']
                    }
                ],
                attributes: ['id_auxiliar']
            },
            {
                model: Curso,
                as: 'curso',
                attributes: ['id_curso', 'anio_escolar', 'division'],
                include: [
                    {
                        model: CiclosLectivos,
                        as: 'cicloLectivo',
                        attributes: ['anio']
                    }
                ]
            }
        ]
    });

    return mapAuxiliaresCurso(auxiliarCurso);
}

export const deleteAuxiliarCurso = async (id) => {
    const { id_auxiliar, id_curso, fecha_inicio} = decodeId(id);

    const auxiliarCurso = await AuxiliaresCurso.findOne({
        where: {
            id_auxiliar,
            id_curso,
            fecha_inicio
        }
    });

    if (!auxiliarCurso) throw new Error('AuxiliarCurso no encontrado');

    await auxiliarCurso.update({
        fecha_fin: new Date()
    })

    const updatedAuxiliarCurso = await AuxiliaresCurso.findOne({
        where: {
            id_auxiliar,
            id_curso,
            fecha_inicio
        },
        include: [
            {
                model: Auxiliar,
                as: 'auxiliar',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido', 'numero_documento']
                    }
                ],
                attributes: ['id_auxiliar']
            },
            {
                model: Curso,
                as: 'curso',
                attributes: ['id_curso', 'anio_escolar', 'division'],
                include: [
                    {
                        model: CiclosLectivos,
                        as: 'cicloLectivo',
                        attributes: ['anio']
                    }
                ]
            }
        ]
    });

    return mapAuxiliaresCurso(updatedAuxiliarCurso);
}