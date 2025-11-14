import { Tutor, JustificativosAsistencia, Usuario, Curso, Alumno, Asistencia, Auxiliar } from "../models/index.js";
import { Op } from "sequelize";
import { formatLocalDate } from "../utils/formatLocalDate.js";

const mapJustificativos = (justificativos) => {
    return justificativos.map(j => ({
        id_justificativo: j.id_justificativo,
        id_asistencia: j.id_asistencia,
        image_path: j.image_path,
        tutor: `${j.tutor.usuario.apellido} ${j.tutor.usuario.nombre}`,
        fecha_asistencia: formatLocalDate(j.asistencia.fecha),
        alumno: `${j.asistencia.Alumno.usuario.apellido} ${j.asistencia.Alumno.usuario.nombre}`,
        detalle_justificativo: j.detalle_justificativo,
        motivo_rechazo: j.motivo_rechazo,
        estado: j.estado
    }));
}

export const getJustificativosCurso = async (id_curso, id_alumno = null) => {
    const whereClause = {};
    if (id_alumno) {
        whereClause[`$asistencia.Alumno.id_alumno$`] = id_alumno
    }else{
        const alumnosInCurso = await Curso.findOne({
            where: { id_curso },
            include: [
                {
                    model: Alumno,
                    as: 'alumnos',
                    attributes: ['id_alumno'],
                    through: { 
                        attributes: ['fecha_fin'],
                        where: { fecha_fin: null }
                    },
                    include: [
                        {
                            model: Usuario,
                            as: 'usuario',
                            attributes: ['nombre', 'apellido']
                        }
                    ]
                }
            ]
        });

        const alumnoIds = alumnosInCurso.alumnos.map(a => a.id_alumno);
        whereClause[`$asistencia.Alumno.id_alumno$`] = { [Op.in]: alumnoIds };
    }

    const justificativos = await JustificativosAsistencia.findAll({
        include: [
            {
                model: Tutor,
                as: 'tutor',
                include: [  
                    { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
                ],
                attributes: ['id_tutor']
            },
            {
                model: Asistencia,
                attributes: ['id_asistencia', 'id_alumno', 'fecha'],
                include: [
                    {
                        model: Alumno,
                        include: [
                            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
                        ],
                        attributes: ['id_alumno']
                    }
                ],
                as: 'asistencia'
            }
        ],
        where: whereClause,
        order: [[{ model: Asistencia, as: 'asistencia' }, 'fecha', 'DESC']]
    });

    return mapJustificativos(justificativos);
}

export const createJustificativo = async (data) => {
    console.log("data servicio justificativo:", data);
    const tutor = await Tutor.findOne({ where: { id_usuario: data.usuario.id_usuario } });

    const justificativo = await JustificativosAsistencia.create({
        id_asistencia: data.id_asistencia,
        id_tutor: tutor.id_tutor,
        estado: 'Pendiente',
        image_path: data.image_path || null,
        detalle_justificativo: data.detalle_justificativo || null,
        motivo_rechazo: data.motivo_rechazo || null
    });

    return justificativo;
}

export const updateJustificativoEstado = async (id_justificativo, estado, motivo_rechazo = null, detalle_justificativo = null) => {
    const justificativo = await JustificativosAsistencia.findByPk(id_justificativo);

    if (!justificativo) throw new Error("Justificativo no encontrado");

    justificativo.estado = estado;

    if(estado === "Pendiente"){
        justificativo.motivo_rechazo = null;
        justificativo.id_auxiliar = null;
        justificativo.detalle_justificativo = detalle_justificativo || null;
        await justificativo.save();
        return justificativo;
    }

    if(estado === 'Rechazado') if (motivo_rechazo) justificativo.motivo_rechazo = motivo_rechazo;

    const asistencia = await Asistencia.findByPk(justificativo.id_asistencia, {
        include: [
            {
                model: Alumno,
                include: [
                    {
                        model: Curso,
                        as: 'cursos',
                        through: { where: { fecha_fin: null } }
                    }
                ]
            }
        ]
    });

    const alumno = await Alumno.findOne({
        include: [
            {
                model: Curso,
                as: 'cursos',
                through: {
                    where: { fecha_fin: null }
                }
            }
        ],
        where: { id_alumno: asistencia.id_alumno }
    });

    const curso = alumno.cursos[0];

    const auxiliarAsignado = await Auxiliar.findOne({
        include: [
            {
                model: Curso,
                as: 'cursos',
                where: { id_curso: curso.id_curso },
            }
        ]
    });

    if (auxiliarAsignado) {
        justificativo.id_auxiliar = auxiliarAsignado.id_auxiliar;
    }

    await justificativo.save();

    if(estado === 'Aceptado'){
        const asistencia = await Asistencia.findByPk(justificativo.id_asistencia);
        if(asistencia){
            asistencia.id_estado = 3;
            await asistencia.save();
        }
    }

    return justificativo;
}