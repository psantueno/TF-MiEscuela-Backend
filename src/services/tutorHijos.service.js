import { Op } from "sequelize";
import { Tutor, Alumno, Usuario, Curso, AlumnoTutor } from "../models/index.js";

const mapTutoresHijos = (tutoreshijos) => {
    return tutoreshijos.map(tutoreshijo => {
        const plainTutor = tutoreshijo.get({ plain: true });
        return {
            id_tutor: plainTutor.id_tutor,
            nombre: plainTutor.usuario.nombre,
            apellido: plainTutor.usuario.apellido,
            numero_documento: plainTutor.usuario.numero_documento,
            hijos: plainTutor.alumnos.map(hijo => ({
                id_alumno: hijo.id_alumno,
                usuario: {
                    nombre: hijo.usuario.nombre,
                    apellido: hijo.usuario.apellido
                },
                curso: { 
                    id_curso: hijo.cursos[0]?.id_curso,
                    anio_escolar: hijo.cursos[0]?.anio_escolar,
                    division: hijo.cursos[0]?.division
                },
                parentesco: hijo.AlumnoTutor.parentesco
            }))
        };
    });
}

const mapTutorHijos = (tutorHijos) => {
    const plainTutor = tutorHijos.get({ plain: true });
    return {
        id_tutor: plainTutor.id_tutor,
        nombre: plainTutor.usuario.nombre,
        apellido: plainTutor.usuario.apellido,
        numero_documento: plainTutor.usuario.numero_documento,
        hijos: plainTutor.alumnos.map(hijo => ({
            id_alumno: hijo.id_alumno,
            usuario: {
                nombre: hijo.usuario.nombre,
                apellido: hijo.usuario.apellido,
                numero_documento: hijo.usuario.numero_documento
            },
            curso: { 
                id_curso: hijo.cursos[0]?.id_curso,
                anio_escolar: hijo.cursos[0]?.anio_escolar,
                division: hijo.cursos[0]?.division
            },
            parentesco: hijo.AlumnoTutor.parentesco
        }))
    };
}

export const getTutoresHijos = async (limit, offset, filter = {}) => {
    const whereClause = {};

    if(filter.numero_documento){
        const tutor = await Tutor.findOne({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    where: {
                        numero_documento: {
                            [Op.iLike]: `%${filter.numero_documento}%`
                        }
                    }
                }
            ]
        });

        if(tutor) whereClause.id_tutor = tutor.id_tutor;
        else return [];
    }

    const tutoreshijos = await Tutor.findAll({
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
            },
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido', 'numero_documento']
            }
        ],
        limit: limit,
        offset: offset,
        order: [
            [{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC'],
            [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC'],
        ],
        where: whereClause
    });

    return mapTutoresHijos(tutoreshijos);
};

export const getTutorHijos = async (idTutor) => {
    const tutorHijos = await Tutor.findOne({
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
                        attributes: ['nombre', 'apellido', 'numero_documento']
                    },
                    {
                        model: Curso,
                        as: 'cursos',
                        through: { where: { fecha_fin: null } },
                        attributes: ['id_curso', 'anio_escolar', 'division']
                    }
                ]
            },
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido', 'numero_documento']
            }
        ],
        order: [
            [{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC'],
            [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC'],
        ]
    });

    return mapTutorHijos(tutorHijos);
}

export const updateTutorHijos = async (idTutor, hijosData) => {
    const tutor = await Tutor.findByPk(idTutor);

    if (!tutor) throw new Error("Tutor no encontrado");

    const updatedHijos = hijosData.updated || [];
    const addedHijos = hijosData.added || [];
    const deletedHijos = hijosData.deleted || [];

    if(updatedHijos.length > 0) {
        updatedHijos.forEach(async (hijo) => {
            await AlumnoTutor.update(
                { parentesco: hijo.parentesco },
                { where: { id_tutor: idTutor, id_alumno: hijo.id_alumno } }
            );
        });
    }

    if (addedHijos.length > 0) {
        addedHijos.forEach(async (hijo) => {
            await AlumnoTutor.create({ id_tutor: idTutor, id_alumno: hijo.id_alumno, parentesco: hijo.parentesco });
        });
    }

    if (deletedHijos.length > 0) {
        deletedHijos.forEach(async (id_alumno) => {
            await AlumnoTutor.destroy({ where: { id_tutor: idTutor, id_alumno } });
        });
    }
}

