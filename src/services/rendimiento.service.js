import { Op } from "sequelize";
import {
  Alumno,
  AlumnoTutor,
  Asistencia,
  AsistenciaEstado,
  Calificacion,
  CiclosLectivos,
  Curso,
  Docente,
  AsesorPedagogico,
  DocentesMateriasCurso,
  InformePedagogico,
  Materia,
  MateriasCurso,
  TipoCalificacion,
  Tutor,
  Usuario,
} from "../models/index.js";

const ROLE = {
  ADMIN: "admin",
  DIRECTOR: "director",
  AUXILIAR: "auxiliar",
  DOCENTE: "docente",
  ASESOR: "asesor_pedagogico",
  TUTOR: "tutor",
};

const APPROVED_THRESHOLD = 6;

const normalizeRole = (user) => (user?.rol || "").toLowerCase();

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const resolveDateRange = (fechaDesde, fechaHasta) => {
  const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
  const desde = fechaDesde ? new Date(fechaDesde) : addDays(hasta, -60);

  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
    throw new Error("Fechas invÃ¡lidas");
  }

  if (desde > hasta) {
    throw new Error("La fecha desde no puede ser posterior a la fecha hasta");
  }

  return { desde, hasta };
};

const asPlain = (records) => records.map((item) => item.get({ plain: true }));

const avg = (numbers = []) => {
  const list = numbers.filter((n) => Number.isFinite(n));
  if (!list.length) return null;
  const total = list.reduce((acc, curr) => acc + curr, 0);
  return Number((total / list.length).toFixed(2));
};

const percentage = (value, total) => {
  if (!total) return 0;
  return Number(((value * 100) / total).toFixed(2));
};

const categorizeEstado = (descripcion = "") => {
  const normalized = descripcion.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (normalized.includes("pres")) return "presente";
  if (normalized.includes("tar")) return "tarde";
  if (normalized.includes("just")) return "ausente_justificada";
  if (normalized.includes("aus")) return "ausente";
  return "otro";
};

// Clasifica tipos de evaluaciï¿½n en buckets usados para KPIs
const categorizeEvaluacion = (descripcion = "") => {
  const normalized = descripcion.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (normalized.includes("oral")) return "oral";
  if (normalized.includes("trab") || normalized.includes("pract") || normalized.includes("tp")) {
    return "tp";
  }
  return "escrita";
};

// Normaliza etiquetas de periodo a claves internas
const resolvePeriodKey = (label = "") => {
  const normalized = label.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (normalized.includes("primer")) return "primer";
  if (normalized.includes("segundo")) return "segundo";
  if (normalized.includes("final")) return "final";
  return null;
};
const resolvePeriodFromTipoCalificacion = (tipo = {}) => {
  const id = tipo.id_tipo_calificacion ?? tipo.id;
  if (id === 7) return "primer";
  if (id === 8) return "segundo";
  if (id === 9) return "final";

  const normalized = (tipo.descripcion || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  if (normalized.includes("1") && normalized.includes("cuatr")) return "primer";
  if (normalized.includes("2") && normalized.includes("cuatr")) return "segundo";
  if (normalized.includes("final")) return "final";

  return null;
};

const ensureRoleAllowed = (role, allowed = []) => {
  if (!allowed.includes(role)) {
    const error = new Error("El usuario no tiene permisos para esta operaciÃ³n");
    error.status = 403;
    throw error;
  }
};

const findTutorByUsuario = async (idUsuario) => {
  if (!idUsuario) return null;
  return Tutor.findOne({ where: { id_usuario: idUsuario } });
};

const findDocenteByUsuario = async (idUsuario) => {
  if (!idUsuario) return null;
  return Docente.findOne({ where: { id_usuario: idUsuario } });
};

const ensureAlumnoAccess = async (user, idAlumno) => {
  const role = normalizeRole(user);
  if (role === ROLE.TUTOR) {
    const tutor = await findTutorByUsuario(user.id_usuario);
    if (!tutor) {
      const error = new Error("El usuario no tiene tutor asignado");
      error.status = 403;
      throw error;
    }

    const vinculo = await AlumnoTutor.findOne({
      where: { id_tutor: tutor.id_tutor, id_alumno: idAlumno },
    });

    if (!vinculo) {
      const error = new Error("No puede acceder a otros alumnos");
      error.status = 403;
      throw error;
    }
  }
};

const ensureCursoAccess = async (user, idCurso) => {
  const role = normalizeRole(user);
  if ([ROLE.ADMIN, ROLE.DIRECTOR, ROLE.AUXILIAR].includes(role)) return;
  if (role === ROLE.TUTOR) {
    const error = new Error("Los tutores no pueden acceder a esta vista");
    error.status = 403;
    throw error;
  }
  if (role === ROLE.DOCENTE || role === ROLE.ASESOR) {
    const docente = await findDocenteByUsuario(user.id_usuario);
    if (!docente) {
      const error = new Error("No se encontrÃ³ el docente asociado");
      error.status = 403;
      throw error;
    }
    const vinculo = await DocentesMateriasCurso.findOne({
      where: { id_docente: docente.id_docente },
      include: [
        {
          model: MateriasCurso,
          as: "materiaCurso",
          where: { id_curso: idCurso },
          attributes: ["id_curso"],
        },
      ],
    });
    if (!vinculo) {
      const error = new Error("El docente no estÃ¡ asignado a este curso");
      error.status = 403;
      throw error;
    }
  }
};

const ensureMateriaAccess = async (user, idMateria) => {
  const role = normalizeRole(user);
  if ([ROLE.ADMIN, ROLE.DIRECTOR, ROLE.AUXILIAR].includes(role)) return;
  if (role === ROLE.TUTOR) {
    const error = new Error("Los tutores no pueden acceder a esta vista");
    error.status = 403;
    throw error;
  }
  if (role === ROLE.DOCENTE || role === ROLE.ASESOR) {
    const docente = await findDocenteByUsuario(user.id_usuario);
    if (!docente) {
      const error = new Error("No se encontrÃ³ el docente asociado");
      error.status = 403;
      throw error;
    }
    const vinculo = await DocentesMateriasCurso.findOne({
      where: { id_docente: docente.id_docente },
      include: [
        {
          model: MateriasCurso,
          as: "materiaCurso",
          where: { id_materia: idMateria },
          attributes: ["id_materia"],
        },
      ],
    });
    if (!vinculo) {
      const error = new Error("El docente no estÃ¡ asignado a esta materia");
      error.status = 403;
      throw error;
    }
  }
};

const aggregateAsistencia = (rows = []) => {
  const porAlumno = new Map();
  const total = {
    registros: 0,
    presentes: 0,
    ausentes: 0,
    ausentesJustificados: 0,
    tardanzas: 0,
  };

  rows.forEach((row) => {
    const categoria = categorizeEstado(row.AsistenciaEstado?.descripcion || "");
    total.registros += 1;
    if (categoria === "presente") total.presentes += 1;
    if (categoria === "ausente") total.ausentes += 1;
    if (categoria === "ausente_justificada") total.ausentesJustificados += 1;
    if (categoria === "tarde") total.tardanzas += 1;

    const alumnoId = row.Alumno?.id_alumno;
    if (!alumnoId) return;

    if (!porAlumno.has(alumnoId)) {
      porAlumno.set(alumnoId, {
        id_alumno: alumnoId,
        nombre: row.Alumno?.usuario?.nombre || "",
        apellido: row.Alumno?.usuario?.apellido || "",
        registros: 0,
        presentes: 0,
        ausentes: 0,
        ausentesJustificados: 0,
        tardanzas: 0,
      });
    }

    const current = porAlumno.get(alumnoId);
    current.registros += 1;
    if (categoria === "presente") current.presentes += 1;
    if (categoria === "ausente") current.ausentes += 1;
    if (categoria === "ausente_justificada") current.ausentesJustificados += 1;
    if (categoria === "tarde") current.tardanzas += 1;
  });

  return {
    total,
    porAlumno: Array.from(porAlumno.values()).map((item) => ({
      ...item,
      asistencia: percentage(item.presentes, item.registros),
    })),
  };
};

const aggregateNotas = (rows = []) => {
  const porAlumno = new Map();
  const porMateriaCurso = new Map();
  const notas = [];

  rows.forEach((row) => {
    const nota = Number(row.nota);
    if (!Number.isFinite(nota)) return;
    notas.push(nota);

    const alumnoId = row.alumno?.id_alumno;
    if (alumnoId) {
      if (!porAlumno.has(alumnoId)) {
        porAlumno.set(alumnoId, {
          id_alumno: alumnoId,
          nombre: row.alumno?.usuario?.nombre || "",
          apellido: row.alumno?.usuario?.apellido || "",
          notas: [],
          desaprobadas: 0,
          ultimasNotas: [],
        });
      }
      const current = porAlumno.get(alumnoId);
      current.notas.push(nota);
      current.ultimasNotas.push({ fecha: row.fecha, nota });
      if (nota < APPROVED_THRESHOLD) current.desaprobadas += 1;
    }

    const materiaCursoId = row.materiaCurso?.id_materia_curso;
    if (materiaCursoId) {
      if (!porMateriaCurso.has(materiaCursoId)) {
        porMateriaCurso.set(materiaCursoId, {
          id_materia_curso: materiaCursoId,
          id_materia: row.materiaCurso?.materia?.id_materia,
          materia: row.materiaCurso?.materia?.nombre,
          notas: [],
        });
      }
      porMateriaCurso.get(materiaCursoId).notas.push(nota);
    }
  });

  const resumenAlumnos = Array.from(porAlumno.values()).map((item) => {
    const ordenadas = [...item.ultimasNotas].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );
    const ultimasTres = ordenadas.slice(-3);
    return {
      id_alumno: item.id_alumno,
      nombre: item.nombre,
      apellido: item.apellido,
      promedio: avg(item.notas),
      desaprobadas: item.desaprobadas,
      ultimasTres,
    };
  });

  const resumenMaterias = Array.from(porMateriaCurso.values()).map((item) => ({
    id_materia_curso: item.id_materia_curso,
    id_materia: item.id_materia,
    materia: item.materia,
    promedio: avg(item.notas),
  }));

  return {
    promedioGeneral: avg(notas),
    porAlumno: resumenAlumnos,
    porMateria: resumenMaterias,
  };
};

const buildAlertLevel = ({ promedio, asistencia, desaprobadas, ultimasTres }) => {
  if (promedio !== null && promedio < 6) return "high";
  if (desaprobadas >= 2) return "high";
  if (asistencia !== null && asistencia < 70) return "high";

  if (promedio !== null && promedio < 7) return "medium";
  if (asistencia !== null && asistencia < 80) return "medium";

  const notas = (ultimasTres || []).map((n) => n.nota);
  if (notas.length >= 2) {
    const diff = notas[notas.length - 1] - notas[0];
    if (diff <= -1.5) return "medium";
  }

  return null;
};

const buildAlerts = (alumnosMetrics = [], asistenciaPorAlumno = []) => {
  const asistenciaMap = new Map();
  asistenciaPorAlumno.forEach((item) => asistenciaMap.set(item.id_alumno, item));

  const alerts = [];
  alumnosMetrics.forEach((metric) => {
    const asistenciaMetric = asistenciaMap.get(metric.id_alumno);
    const asistencia = asistenciaMetric?.asistencia ?? null;
    const level = buildAlertLevel({
      promedio: metric.promedio,
      asistencia,
      desaprobadas: metric.desaprobadas,
      ultimasTres: metric.ultimasTres,
    });
    if (!level) return;

    alerts.push({
      id_alumno: metric.id_alumno,
      alumno: `${metric.apellido || ""} ${metric.nombre || ""}`.trim(),
      severity: level,
      promedio: metric.promedio,
      asistencia,
      desaprobadas: metric.desaprobadas,
      motivo: level === "high"
        ? "Indicadores crÃ­ticos detectados"
        : "Rendimiento en observaciÃ³n",
    });
  });

  return alerts;
};

const generateTextSummary = (scope, payload) => {
  if (scope === "curso") {
    const promedio = payload.kpis?.promedio_general ?? "N/D";
    const asistencia = payload.kpis?.asistencia_30d ?? "N/D";
    return `El curso ${payload.context?.anio_escolar || ""}${payload.context?.division || ""} presenta un promedio general de ${promedio} y una asistencia del ${asistencia}% en los Ãºltimos 30 dÃ­as.`;
  }

  if (scope === "materia") {
    const promedio = payload.kpis?.promedio_general ?? "N/D";
    return `La materia ${payload.context?.nombre || ""} posee un promedio general de ${promedio} en el perÃ­odo seleccionado.`;
  }

  if (scope === "alumno") {
    const promedio = payload.kpis?.promedio_general ?? "N/D";
    const asistencia = payload.kpis?.asistencia_30d ?? "N/D";
    return `El alumno ${payload.context?.nombre || ""} presenta un promedio general de ${promedio} y una asistencia del ${asistencia}% en los Ãºltimos 30 dÃ­as.`;
  }

  return "Resumen no disponible.";
};

export const getCursoSummary = async (filters, user) => {
  const { id_curso, id_materia, fecha_desde, fecha_hasta } = filters || {};
  if (!id_curso) {
    const error = new Error("id_curso es obligatorio");
    error.status = 400;
    throw error;
  }

  const cursoId = Number(id_curso);
  if (Number.isNaN(cursoId)) {
    const error = new Error("id_curso debe ser numÃ©rico");
    error.status = 400;
    throw error;
  }

  const materiaId = id_materia != null ? Number(id_materia) : null;
  if (id_materia !== undefined && id_materia !== null && Number.isNaN(materiaId)) {
    const error = new Error("id_materia debe ser numÇ¸rico");
    error.status = 400;
    throw error;
  }

  await ensureCursoAccess(user, cursoId);
  if (materiaId) {
    await ensureMateriaAccess(user, materiaId);
  }
  const range = resolveDateRange(fecha_desde, fecha_hasta);

  const curso = await Curso.findByPk(cursoId, {
    include: [
      {
        model: CiclosLectivos,
        as: "cicloLectivo",
        attributes: ["anio", "fecha_inicio", "fecha_fin"],
      },
    ],
  });

  if (!curso) {
    const error = new Error("Curso no encontrado");
    error.status = 404;
    throw error;
  }

  const materiasCurso = await MateriasCurso.findAll({
    where: {
      id_curso: cursoId,
      ...(materiaId ? { id_materia: materiaId } : {}),
    },
    include: [{ model: Materia, as: "materia", attributes: ["id_materia", "nombre"] }],
  });

  const calificaciones = await Calificacion.findAll({
    where: {
      fecha: { [Op.between]: [range.desde, range.hasta] },
    },
    include: [
      {
        model: MateriasCurso,
        as: "materiaCurso",
        where: {
          id_curso: cursoId,
          ...(materiaId ? { id_materia: materiaId } : {}),
        },
        include: [{ model: Materia, as: "materia", attributes: ["id_materia", "nombre"] }],
      },
      {
        model: Alumno,
        as: "alumno",
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
      },
      { model: TipoCalificacion, as: "tipoCalificacion", attributes: ["id_tipo_calificacion", "descripcion"] },
    ],
  });

  const asistencias = await Asistencia.findAll({
    where: {
      fecha: { [Op.between]: [range.desde, range.hasta] },
    },
    include: [
      {
        model: Alumno,
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["nombre", "apellido"],
          },
          {
            model: Curso,
            as: "cursos",
            where: { id_curso: cursoId },
            attributes: [],
            through: {
              attributes: [],
            },
          },
        ],
      },
      { model: AsistenciaEstado, attributes: ["descripcion"] },
    ],
  });

  const plainCalificaciones = asPlain(calificaciones);
  const notas = aggregateNotas(plainCalificaciones);
  const asistencia = aggregateAsistencia(asPlain(asistencias));

  const asistenciaPorcentaje = asistencia.total.registros
    ? percentage(asistencia.total.presentes, asistencia.total.registros)
    : null;

  const periodAverages = { primer: [], segundo: [], final: [] };
  const approvalStats = {
    escrita: { total: 0, aprobadas: 0 },
    oral: { total: 0, aprobadas: 0 },
    tp: { total: 0, aprobadas: 0 },
  };
  const rankingPeriodMap = {
    primer: new Map(),
    segundo: new Map(),
    final: new Map(),
  };
  const materiasPeriodMap = new Map();

  plainCalificaciones.forEach((row) => {
    const nota = Number(row.nota);
    if (!Number.isFinite(nota)) return;
    const periodoKey = resolvePeriodFromTipoCalificacion(row.tipoCalificacion);
    const evalType = categorizeEvaluacion(row.tipoCalificacion?.descripcion || "");

    if (periodoKey && periodAverages[periodoKey]) {
      periodAverages[periodoKey].push(nota);
    }

    if (evalType && approvalStats[evalType]) {
      approvalStats[evalType].total += 1;
      if (nota >= APPROVED_THRESHOLD) approvalStats[evalType].aprobadas += 1;
    }

    if (periodoKey && rankingPeriodMap[periodoKey] && row.alumno) {
      const alumnoId = row.alumno.id_alumno;
      if (!rankingPeriodMap[periodoKey].has(alumnoId)) {
        rankingPeriodMap[periodoKey].set(alumnoId, {
          id_alumno: alumnoId,
          nombre: row.alumno.usuario?.nombre || "",
          apellido: row.alumno.usuario?.apellido || "",
          notas: [],
        });
      }
      rankingPeriodMap[periodoKey].get(alumnoId).notas.push(nota);
    }

    const materiaRowId = row.materiaCurso?.materia?.id_materia;
    const materiaNombre = row.materiaCurso?.materia?.nombre;
    if (periodoKey && materiaRowId) {
      if (!materiasPeriodMap.has(materiaRowId)) {
        materiasPeriodMap.set(materiaRowId, {
          id_materia: materiaRowId,
          id_materia_curso: row.materiaCurso?.id_materia_curso,
          materia: materiaNombre,
          notas: { primer: [], segundo: [], final: [] },
        });
      }
      materiasPeriodMap.get(materiaRowId).notas[periodoKey].push(nota);
    }
  });

  const promedioPrimer = avg(periodAverages.primer);
  const promedioSegundo = avg(periodAverages.segundo);
  const promedioFinal = avg(periodAverages.final);

  const buildRanking = (map) =>
    Array.from(map.values())
      .map((item) => ({
        id_alumno: item.id_alumno,
        nombre: item.nombre,
        apellido: item.apellido,
        promedio: avg(item.notas),
      }))
      .sort((a, b) => (b.promedio || 0) - (a.promedio || 0));

  const rankingPorPeriodo = {
    primer_cuatrimestre: buildRanking(rankingPeriodMap.primer),
    segundo_cuatrimestre: buildRanking(rankingPeriodMap.segundo),
    nota_final: buildRanking(rankingPeriodMap.final),
  };

  const rankingMateriasTop = Array.from(materiasPeriodMap.values())
    .map((item) => {
      const promedios = {
        primer_cuatrimestre: avg(item.notas.primer),
        segundo_cuatrimestre: avg(item.notas.segundo),
        nota_final: avg(item.notas.final),
      };
      return {
        id_materia: item.id_materia,
        id_materia_curso: item.id_materia_curso,
        materia: item.materia,
        promedios,
      };
    })
    .sort((a, b) => {
      const score = (p) =>
        p.promedios.nota_final ??
        p.promedios.segundo_cuatrimestre ??
        p.promedios.primer_cuatrimestre ??
        -Infinity;
      return score(b) - score(a);
    })
    .slice(0, 10);

  const materias = materiasCurso.map((item) => {
    const resumen = notas.porMateria.find((m) => m.id_materia_curso === item.id_materia_curso);
    return {
      id_materia_curso: item.id_materia_curso,
      id_materia: item.materia?.id_materia,
      materia: item.materia?.nombre,
      promedio: resumen?.promedio ?? null,
    };
  });

  const ranking = notas.porAlumno
    .map((item) => {
      const asistenciaAlumno = asistencia.porAlumno.find((a) => a.id_alumno === item.id_alumno);
      return {
        id_alumno: item.id_alumno,
        nombre: item.nombre,
        apellido: item.apellido,
        promedio: item.promedio,
        asistencia: asistenciaAlumno?.asistencia ?? null,
        desaprobadas: item.desaprobadas,
      };
    })
    .sort((a, b) => (b.promedio || 0) - (a.promedio || 0));

  const alertas = buildAlerts(notas.porAlumno, asistencia.porAlumno);

  const payload = {
    context: {
      id_curso: curso.id_curso,
      anio_escolar: curso.anio_escolar,
      division: curso.division,
      ciclo: curso.cicloLectivo?.anio,
      id_materia: materiaId || null,
    },
    kpis: {
      promedio_general: notas.promedioGeneral,
      promedio_primer_cuatrimestre: promedioPrimer,
      promedio_segundo_cuatrimestre: promedioSegundo,
      promedio_final: promedioFinal,
      asistencia: asistenciaPorcentaje,
      asistencia_30d: asistenciaPorcentaje,
      desaprobados: notas.porAlumno.reduce((acc, curr) => acc + (curr.desaprobadas || 0), 0),
    },
    materias,
    ranking_alumnos: ranking,
    ranking_alumnos_por_periodo: rankingPorPeriodo,
    ranking_materias_top10: rankingMateriasTop,
    aprobaciones_por_tipo: Object.entries(approvalStats).reduce((acc, [key, value]) => {
      acc[key] = {
        total: value.total,
        aprobadas: value.aprobadas,
        porcentaje: value.total ? percentage(value.aprobadas, value.total) : null,
      };
      return acc;
    }, {}),
    alertas,
    ia_summary: generateTextSummary("curso", {
      context: {
        anio_escolar: curso.anio_escolar,
        division: curso.division,
      },
      kpis: { promedio_general: notas.promedioGeneral, asistencia_30d: asistenciaPorcentaje },
    }),
  };

  return payload;
};

export const getMateriaSummary = async (filters, user) => {
  const { id_materia, id_ciclo, fecha_desde, fecha_hasta } = filters || {};
  if (!id_materia) {
    const error = new Error("id_materia es obligatorio");
    error.status = 400;
    throw error;
  }

  const materiaId = Number(id_materia);
  if (Number.isNaN(materiaId)) {
    const error = new Error("id_materia debe ser numÃ©rico");
    error.status = 400;
    throw error;
  }

  await ensureMateriaAccess(user, materiaId);
  const range = resolveDateRange(fecha_desde, fecha_hasta);

  const whereCurso = {};
  if (id_ciclo) {
    const cicloId = Number(id_ciclo);
    if (Number.isNaN(cicloId)) {
      const error = new Error("id_ciclo debe ser numÃ©rico");
      error.status = 400;
      throw error;
    }
    whereCurso.id_ciclo = cicloId;
  }

  const materiasCurso = await MateriasCurso.findAll({
    where: { id_materia: materiaId },
    include: [
      {
        model: Curso,
        as: "curso",
        where: whereCurso,
        include: [
          {
            model: CiclosLectivos,
            as: "cicloLectivo",
            attributes: ["anio"],
          },
        ],
      },
      {
        model: Materia,
        as: "materia",
      },
    ],
  });

  if (!materiasCurso.length) {
    const error = new Error("No se encontraron cursos para la materia");
    error.status = 404;
    throw error;
  }

  const ids = materiasCurso.map((mc) => mc.id_materia_curso);

  const calificaciones = await Calificacion.findAll({
    where: {
      fecha: { [Op.between]: [range.desde, range.hasta] },
      id_materia_curso: ids,
    },
    include: [
      {
        model: MateriasCurso,
        as: "materiaCurso",
        include: [
          {
            model: Curso,
            as: "curso",
            include: [
              { model: CiclosLectivos, as: "cicloLectivo", attributes: ["anio"] },
            ],
          },
          { model: Materia, as: "materia", attributes: ["id_materia", "nombre"] },
        ],
      },
      {
        model: Alumno,
        as: "alumno",
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
      },
    ],
  });

  const notas = aggregateNotas(asPlain(calificaciones));

  const cursos = materiasCurso.map((item) => {
    const promedioCurso = notas.porMateria.find(
      (m) => m.id_materia_curso === item.id_materia_curso
    );
    return {
      id_curso: item.curso.id_curso,
      curso: `${item.curso.anio_escolar}Â° ${item.curso.division}`,
      ciclo: item.curso.cicloLectivo?.anio,
      promedio: promedioCurso?.promedio ?? null,
    };
  });

  const alertas = buildAlerts(notas.porAlumno, []);

  const payload = {
    context: {
      id_materia,
      nombre: materiasCurso[0].materia?.nombre,
    },
    kpis: {
      promedio_general: notas.promedioGeneral,
      cursos_con_datos: cursos.length,
    },
    cursos,
    alertas,
    ia_summary: generateTextSummary("materia", {
      context: { nombre: materiasCurso[0].materia?.nombre },
      kpis: { promedio_general: notas.promedioGeneral },
    }),
  };

  return payload;
};

export const getAlumnoSummary = async (filters, user) => {
  const { id_alumno, fecha_desde, fecha_hasta } = filters || {};
  if (!id_alumno) {
    const error = new Error("id_alumno es obligatorio");
    error.status = 400;
    throw error;
  }

  const alumnoId = Number(id_alumno);
  if (Number.isNaN(alumnoId)) {
    const error = new Error("id_alumno debe ser numÃ©rico");
    error.status = 400;
    throw error;
  }

  await ensureAlumnoAccess(user, alumnoId);
  const range = resolveDateRange(fecha_desde, fecha_hasta);

  const alumno = await Alumno.findByPk(alumnoId, {
    include: [
      { model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] },
      {
        model: Curso,
        as: "cursos",
        attributes: ["anio_escolar", "division", "id_curso"],
        through: { attributes: [] },
      },
    ],
  });

  if (!alumno) {
    const error = new Error("Alumno no encontrado");
    error.status = 404;
    throw error;
  }

  const calificaciones = await Calificacion.findAll({
    where: {
      id_alumno: alumnoId,
      fecha: { [Op.between]: [range.desde, range.hasta] },
    },
    include: [
      {
        model: MateriasCurso,
        as: "materiaCurso",
        include: [
          { model: Materia, as: "materia", attributes: ["id_materia", "nombre"] },
          {
            model: Curso,
            as: "curso",
            attributes: ["anio_escolar", "division"],
          },
        ],
      },
      {
        model: Docente,
        as: "docente",
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
      },
      {
        model: TipoCalificacion,
        as: "tipoCalificacion",
        attributes: ["descripcion", "id_tipo_calificacion"],
      },
    ],
  }).catch(() => []);

  const asistencias = await Asistencia.findAll({
    where: {
      id_alumno: alumnoId,
      fecha: { [Op.between]: [range.desde, range.hasta] },
    },
    include: [{ model: AsistenciaEstado, attributes: ["descripcion"] }],
  });

  const informes = await InformePedagogico.findAll({
    where: { id_alumno: alumnoId },
    order: [["fecha", "DESC"]],
    limit: 20,
    include: [
      {
        model: AsesorPedagogico,
        as: "asesorPedagogico",
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
      },
      {
        model: MateriasCurso,
        as: "materiaCurso",
        include: [{ model: Materia, as: "materia", attributes: ["id_materia", "nombre"] }],
      },
      {
        model: Docente,
        as: "docente",
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
      },
    ],
  });

  const plainCalificaciones = asPlain(calificaciones);
  const plainAsistencias = asPlain(asistencias);
  const plainInformes = asPlain(informes).map((row) => {
    const asesorNombre = `${row.asesorPedagogico?.usuario?.apellido || ""} ${
      row.asesorPedagogico?.usuario?.nombre || ""
    }`
      .trim()
      .replace(/\s+/g, " ");
    const docenteNombre = `${row.docente?.usuario?.apellido || ""} ${
      row.docente?.usuario?.nombre || ""
    }`
      .trim()
      .replace(/\s+/g, " ");
    return {
      ...row,
      asesor_detalle: row.asesorPedagogico
        ? {
            id_asesor: row.asesorPedagogico.id_asesor,
            nombre: asesorNombre || null,
          }
        : null,
      docente_detalle: row.docente
        ? {
            id_docente: row.docente.id_docente,
            nombre: docenteNombre || null,
          }
        : null,
      materia_detalle: row.materiaCurso?.materia
        ? {
            id_materia: row.materiaCurso.materia.id_materia,
            nombre: row.materiaCurso.materia.nombre,
          }
        : null,
    };
  });

  const notas = aggregateNotas(plainCalificaciones);
  const asistencia = aggregateAsistencia(
    plainAsistencias.map((row) => ({
      ...row,
      Alumno: {
        id_alumno,
        usuario: alumno.usuario,
      },
    }))
  );

  const metricAlumno = notas.porAlumno.find((item) => item.id_alumno === alumnoId);
  const asistenciaAlumno = asistencia.porAlumno.find((item) => item.id_alumno === alumnoId);

  const closingGrades = (() => {
    const map = { cierre_1: null, cierre_2: null, nota_final: null };
    plainCalificaciones.forEach((row) => {
      const tipo = (row.tipoCalificacion?.descripcion || "").toLowerCase();
      const idTipo = row.tipoCalificacion?.id_tipo_calificacion;
      if (tipo.includes("1") || idTipo === 7) {
        map.cierre_1 = row.nota;
      } else if (tipo.includes("2") || idTipo === 8) {
        map.cierre_2 = row.nota;
      } else if (tipo.includes("final") || idTipo === 9) {
        map.nota_final = row.nota;
      }
    });
    return map;
  })();

  let courseAverage = null;
  const cursoActualId = alumno.cursos?.[0]?.id_curso;
  if (cursoActualId) {
    const calificacionesCurso = await Calificacion.findAll({
      where: {
        fecha: { [Op.between]: [range.desde, range.hasta] },
      },
      include: [
        {
          model: MateriasCurso,
          as: "materiaCurso",
          where: { id_curso: cursoActualId },
          include: [{ model: Materia, as: "materia", attributes: ["nombre"] }],
        },
      ],
    }).catch(() => []);
    if (calificacionesCurso.length) {
      const notasCurso = aggregateNotas(asPlain(calificacionesCurso));
      courseAverage = notasCurso.promedioGeneral;
    }
  }

  const materias = notas.porMateria.map((item) => ({
    id_materia: item.id_materia,
    materia: item.materia,
    promedio: item.promedio,
  }));

  const payload = {
    context: {
      id_alumno: alumno.id_alumno,
      nombre: `${alumno.usuario?.apellido || ""} ${alumno.usuario?.nombre || ""}`.trim(),
      curso: alumno.cursos?.[0]
        ? `${alumno.cursos[0].anio_escolar}Â° ${alumno.cursos[0].division}`
        : null,
    },
    kpis: {
      promedio_general: metricAlumno?.promedio ?? null,
      asistencia_30d: asistenciaAlumno?.asistencia ?? null,
      desaprobadas: metricAlumno?.desaprobadas ?? 0,
    },
    materias,
    timeline: {
      calificaciones: plainCalificaciones.map((row) => ({
        id_calificacion: row.id_calificacion,
        materia: row.materiaCurso?.materia?.nombre,
        fecha: row.fecha,
        nota: row.nota,
        tipo: row.tipoCalificacion?.descripcion,
      })),
      asistencias: plainAsistencias.map((row) => ({
        id_asistencia: row.id_asistencia,
        fecha: row.fecha,
        estado: row.AsistenciaEstado?.descripcion,
      })),
    },
    informes_pedagogicos: plainInformes,
    alertas: buildAlerts(metricAlumno ? [metricAlumno] : [], asistenciaAlumno ? [asistenciaAlumno] : []),
    closing_grades: closingGrades,
    course_stats: {
      promedio_curso: courseAverage,
      diferencia_vs_curso:
        metricAlumno?.promedio != null && courseAverage != null
          ? Number((metricAlumno.promedio - courseAverage).toFixed(2))
          : null,
    },
    ia_summary: generateTextSummary("alumno", {
      context: { nombre: `${alumno.usuario?.nombre || ""} ${alumno.usuario?.apellido || ""}` },
      kpis: {
        promedio_general: metricAlumno?.promedio ?? null,
        asistencia_30d: asistenciaAlumno?.asistencia ?? null,
      },
    }),
  };

  return payload;
};

export const getAlertas = async (filters, user) => {
  const { id_curso, id_ciclo, fecha_desde, fecha_hasta, severity } = filters || {};
  if (!id_curso && !id_ciclo) {
    const error = new Error("Debe indicar id_curso o id_ciclo");
    error.status = 400;
    throw error;
  }

  let cursoId = null;
  if (id_curso) {
    cursoId = Number(id_curso);
    if (Number.isNaN(cursoId)) {
      const error = new Error("id_curso debe ser numÃ©rico");
      error.status = 400;
      throw error;
    }
    await ensureCursoAccess(user, cursoId);
  }

  let cicloId = null;
  if (id_ciclo) {
    cicloId = Number(id_ciclo);
    if (Number.isNaN(cicloId)) {
      const error = new Error("id_ciclo debe ser numÃ©rico");
      error.status = 400;
      throw error;
    }
  }

  const range = resolveDateRange(fecha_desde, fecha_hasta);

  const whereCurso = {};
  if (cursoId) whereCurso.id_curso = cursoId;
  if (cicloId) whereCurso.id_ciclo = cicloId;

  const cursos = await Curso.findAll({
    where: whereCurso,
    include: [{ model: Alumno, as: "alumnos", through: { attributes: [] } }],
  });

  const alumnoIds = cursos.flatMap((curso) =>
    (curso.alumnos || []).map((alumno) => alumno.id_alumno)
  );
  const uniqueAlumnoIds = [...new Set(alumnoIds)];

  if (!uniqueAlumnoIds.length) {
    return [];
  }

  const calificaciones = await Calificacion.findAll({
    where: {
      id_alumno: uniqueAlumnoIds,
      fecha: { [Op.between]: [range.desde, range.hasta] },
    },
    include: [
      {
        model: Alumno,
        as: "alumno",
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
      },
    ],
  });

  const asistencias = await Asistencia.findAll({
    where: {
      id_alumno: uniqueAlumnoIds,
      fecha: { [Op.between]: [range.desde, range.hasta] },
    },
    include: [
      { model: AsistenciaEstado, attributes: ["descripcion"] },
      {
        model: Alumno,
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
      },
    ],
  });

  const notas = aggregateNotas(asPlain(calificaciones));
  const asistencia = aggregateAsistencia(
    asPlain(asistencias).map((row) => ({
      ...row,
      Alumno: {
        id_alumno: row.Alumno?.id_alumno,
        usuario: row.Alumno?.usuario,
      },
    }))
  );

  let alertas = buildAlerts(notas.porAlumno, asistencia.porAlumno);
  if (severity) {
    alertas = alertas.filter((alerta) => alerta.severity === severity);
  }

  return alertas;
};

export const getTutorHijos = async (user) => {
  const role = normalizeRole(user);
  ensureRoleAllowed(role, [ROLE.TUTOR]);

  const tutor = await Tutor.findOne({
    where: { id_usuario: user.id_usuario },
    include: [
      {
        model: Alumno,
        as: "alumnos",
        include: [
          { model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] },
          {
            model: Curso,
            as: "cursos",
            attributes: ["anio_escolar", "division"],
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  if (!tutor) return [];

  return (tutor.alumnos || []).map((alumno) => ({
    id_alumno: alumno.id_alumno,
    nombre: `${alumno.usuario?.apellido || ""} ${alumno.usuario?.nombre || ""}`.trim(),
    curso: alumno.cursos?.[0]
      ? `${alumno.cursos[0].anio_escolar}Â° ${alumno.cursos[0].division}`
      : null,
  }));
};

export const buildInforme = async ({ scope, ids = {}, fecha_desde, fecha_hasta }, user) => {
  if (!scope) {
    const error = new Error("scope es obligatorio");
    error.status = 400;
    throw error;
  }

  let data;
  if (scope === "curso") {
    data = await getCursoSummary({ id_curso: ids.id_curso, fecha_desde, fecha_hasta }, user);
  } else if (scope === "materia") {
    data = await getMateriaSummary(
      { id_materia: ids.id_materia, fecha_desde, fecha_hasta },
      user
    );
  } else if (scope === "alumno") {
    data = await getAlumnoSummary({ id_alumno: ids.id_alumno, fecha_desde, fecha_hasta }, user);
  } else {
    const error = new Error("scope no soportado");
    error.status = 400;
    throw error;
  }

  const summary = generateTextSummary(scope, data);
  return {
    scope,
    data,
    resumen: summary,
  };
};

const IA_STYLE_INSTRUCTIONS =
  "Redacta un informe pedagÃ³gico con mÃ¡ximo 2 carillas (A4) con tono profesional, incluye observaciones sobre desempeÃ±o, asistencia y sugerencias para la mejora en lÃ­nea con lo que marca el asesor pedagÃ³gico.";

const longDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const toDateInstance = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatLongDate = (value) => {
  const date = toDateInstance(value);
  if (!date) return null;
  return longDateFormatter.format(date);
};

const formatRangeLabel = (from, to) => {
  const start = formatLongDate(from);
  const end = formatLongDate(to);
  if (start && end) return `${start} al ${end}`;
  return start || end || null;
};

const deriveAcademicPeriods = (ciclo = {}) => {
  const start = toDateInstance(ciclo.fecha_inicio);
  const end = toDateInstance(ciclo.fecha_fin);
  if (!start || !end) return null;

  const firstEnd = new Date(start);
  firstEnd.setMonth(firstEnd.getMonth() + 4);
  firstEnd.setDate(firstEnd.getDate() - 1);
  if (firstEnd > end) firstEnd.setTime(end.getTime());

  const secondStart = addDays(firstEnd, 1);
  if (secondStart > end) secondStart.setTime(firstEnd.getTime());
  const secondEnd = new Date(end);

  const definitions = {
    primer_cuatrimestre: {
      nombre: "Primer Cuatrimestre",
      descripcion: `Comprende aproximadamente de marzo a julio. En el ciclo ${ciclo.anio} abarca del ${formatLongDate(start)} al ${formatLongDate(firstEnd)}.`,
      desde: start.toISOString(),
      hasta: firstEnd.toISOString(),
      rango_legible: formatRangeLabel(start, firstEnd),
    },
    segundo_cuatrimestre: {
      nombre: "Segundo Cuatrimestre",
      descripcion: `Comprende aproximadamente de agosto a diciembre. En el ciclo ${ciclo.anio} abarca del ${formatLongDate(secondStart)} al ${formatLongDate(secondEnd)}.`,
      desde: secondStart.toISOString(),
      hasta: secondEnd.toISOString(),
      rango_legible: formatRangeLabel(secondStart, secondEnd),
    },
    nota_final: {
      nombre: "Nota Final",
      descripcion: `CalificaciÃ³n integradora registrada al cierre del ciclo ${ciclo.anio} que pondera ambos cuatrimestres.`,
      referencia: formatLongDate(secondEnd),
    },
  };

  return {
    clarifications: definitions,
    boundaries: {
      primer: { end: firstEnd },
      segundo: { end: secondEnd },
    },
  };
};

const resolvePeriodLabel = (dateValue, boundaries = {}) => {
  const date = toDateInstance(dateValue);
  if (!date) return "Sin perÃ­odo definido";
  const primerEnd = toDateInstance(boundaries.primer?.end);
  if (primerEnd && date <= primerEnd) return "Primer Cuatrimestre";
  const segundoEnd = toDateInstance(boundaries.segundo?.end);
  if (segundoEnd && date <= segundoEnd) return "Segundo Cuatrimestre";
  return "Etapa Final / Nota Final";
};

const buildCalificacionesDataset = (
  calificaciones = [],
  boundaries = {},
  materias = [],
  closingGrades = {}
) => {
  const sorted = [...calificaciones].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const details = sorted.map((row) => {
    const periodo = resolvePeriodLabel(row.fecha, boundaries);
    return {
      id_calificacion: row.id_calificacion,
      fecha: row.fecha,
      fecha_legible: formatLongDate(row.fecha),
      materia: row.materia,
      tipo: row.tipo || "Sin tipo",
      nota: row.nota,
      periodo_referencial: periodo,
    };
  });

  const tipos = [...new Set(details.map((item) => item.tipo).filter(Boolean))];
  const aprobadas = details.filter((item) => Number(item.nota) >= APPROVED_THRESHOLD).length;
  const desaprobadas = details.filter((item) => Number(item.nota) < APPROVED_THRESHOLD).length;
  const periodos = {};

  const periodAverages = {
    primer: [],
    segundo: [],
    final: [],
  };

  details.forEach((item) => {
    const key = item.periodo_referencial || "Sin perÃ­odo definido";
    if (!periodos[key]) {
      periodos[key] = { cantidad: 0, notas: [] };
    }
    periodos[key].cantidad += 1;
    periodos[key].notas.push(Number(item.nota));

    const notaNum = Number(item.nota);
    if (Number.isFinite(notaNum)) {
      if (item.periodo_referencial === "Primer Cuatrimestre") {
        periodAverages.primer.push(notaNum);
      } else if (item.periodo_referencial === "Segundo Cuatrimestre") {
        periodAverages.segundo.push(notaNum);
      } else if (item.periodo_referencial === "Etapa Final / Nota Final") {
        periodAverages.final.push(notaNum);
      }
    }
  });

  const resumenPorPeriodo = Object.entries(periodos).reduce((acc, [key, value]) => {
    acc[key] = {
      cantidad: value.cantidad,
      promedio: avg(value.notas),
    };
    return acc;
  }, {});

  const resumenPorMateria = (materias || []).map((item) => ({
    id_materia: item.id_materia,
    materia: item.materia,
    promedio: item.promedio,
  }));

  const promediosGenerales = {
    primer_cuatrimestre: avg(periodAverages.primer),
    segundo_cuatrimestre: avg(periodAverages.segundo),
    nota_final:
      periodAverages.final.length
        ? avg(periodAverages.final)
        : closingGrades?.nota_final ?? null,
  };

  return {
    detalles: details,
    tipos,
    totales: {
      total: details.length,
      aprobadas,
      desaprobadas,
      ultimas_tres: details.slice(-3),
    },
    resumenPorPeriodo,
    resumenPorMateria,
    promediosGenerales,
  };
};

const buildAttendanceDataset = (records = [], periodo) => {
  const counters = {
    registros: 0,
    presentes: 0,
    ausentes: 0,
    ausentes_justificados: 0,
    tardanzas: 0,
  };

  (records || []).forEach((row) => {
    const categoria = categorizeEstado(row.estado || "");
    counters.registros += 1;
    if (categoria === "presente") counters.presentes += 1;
    if (categoria === "ausente") counters.ausentes += 1;
    if (categoria === "ausente_justificada") counters.ausentes_justificados += 1;
    if (categoria === "tarde") counters.tardanzas += 1;
  });

  const porcentaje = counters.registros
    ? Number(((counters.presentes * 100) / counters.registros).toFixed(2))
    : null;

  return {
    porcentaje_ciclo: porcentaje,
    detalle_registros: counters,
    periodo_observado: periodo,
  };
};

const buildInformesDataset = (informes = []) =>
  (informes || []).map((row) => ({
    id_informe: row.id_informe,
    fecha: row.fecha,
    fecha_legible: formatLongDate(row.fecha),
    materia: row.materia_detalle?.nombre || null,
    asesor_pedagogico: row.asesor_detalle?.nombre || "Asesor pedagÃ³gico no identificado",
    texto_informe: row.contenido,
  }));

const buildSystemPrompt = (styleInstructions) =>
  [
    "Eres un asesor pedagÃ³gico especializado en anÃ¡lisis acadÃ©mico que elabora informes profesionales para equipos directivos, docentes y tutores.",
    "Realiza un diagnÃ³stico automÃ¡tico del rendimiento del estudiante analizando calificaciones, tipos de evaluaciÃ³n y porcentaje de asistencia.",
    "Aplica anÃ¡lisis inferencial y correlacional para identificar cÃ³mo se relacionan asistencia y calificaciones, detectar patrones de comportamiento, explicar posibles causas del rendimiento y generar insights acadÃ©micos claros.",
    "Detecta riesgos acadÃ©micos, logros, tendencias y oportunidades de mejora enfocados en el alumno y no en la gestiÃ³n institucional. Evita indicar como oportunidad de mejora o sugerencia la falta de un registro de calificacion(por ejemplo, calificaciÃ³n final).",
    "Integra los aportes del asesor pedagÃ³gico institucional y expone sugerencias accionables y fundamentadas orientadas a mejorar el desempeÃ±o del estudiante.",
    "No debes listar calificaciones ni las intervenciones del asesor pedagÃ³gico literalmente. Usa esos datos como insumos para tu anÃ¡lisis.",
    styleInstructions,
  ].join(" ");


const buildUserPromptFromPayload = (payload) => {
  const lines = [];
  const contexto = payload.contexto_general || {};
  const resumen = payload.resumen_calificaciones || {};
  const asistencia = payload.asistencia || {};

  lines.push("Contexto general:");
  lines.push(`- Alumno: ${contexto.alumno || "Sin datos"}`);
  lines.push(`- Curso/DivisiÃ³n: ${contexto.curso || contexto.curso_detalle?.division || "N/D"}`);
  lines.push(`- Ciclo lectivo: ${contexto.ciclo_lectivo?.anio || "N/D"}`);
  lines.push(`- Periodo analizado: ${contexto.periodo_solicitado?.rango_legible || "Sin rango"}`);
  lines.push("");

  if (payload.clarificacion_periodos) {
    lines.push("ClarificaciÃ³n de perÃ­odos acadÃ©micos:");
    Object.values(payload.clarificacion_periodos).forEach((item) => {
      lines.push(`- ${item.nombre}: ${item.descripcion}`);
    });
    lines.push("");
  }

  lines.push("Detalle de calificaciones (insumo para tu anÃ¡lisis, no incluir literalmente en el informe):");
  if (payload.calificaciones?.length) {
    payload.calificaciones.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.fecha_legible || item.fecha} - ${item.materia || "Materia"} (${
          item.periodo_referencial
        }) â†’ ${item.tipo}: nota ${item.nota}`
      );
    });
  } else {
    lines.push("- No se registran calificaciones en el perÃ­odo solicitado.");
  }
  if (resumen.promedios_generales) {
    const primer = resumen.promedios_generales.primer_cuatrimestre;
    const segundo = resumen.promedios_generales.segundo_cuatrimestre;
    const final = resumen.promedios_generales.nota_final;
    lines.push("Promedios generales por perÃ­odo:");
    lines.push(`- Primer cuatrimestre: ${primer != null ? primer : "Sin datos"}`);
    lines.push(`- Segundo cuatrimestre: ${segundo != null ? segundo : "Sin datos"}`);
    lines.push(`- Nota final: ${final != null ? final : "Sin registro"}`);
    lines.push("");
  }

  lines.push("Asistencia anual:");
  if (asistencia.porcentaje_ciclo != null) {
    lines.push(
      `- ${asistencia.porcentaje_ciclo}% de asistencia (${asistencia.detalle_registros.presentes} presentes, ${asistencia.detalle_registros.ausentes} ausentes, ${asistencia.detalle_registros.ausentes_justificados} ausentes justificadas, ${asistencia.detalle_registros.tardanzas} tardanzas)`
    );
  } else {
    lines.push("- No hay registros de asistencia para el perÃ­odo observado.");
  }
  lines.push("");

  lines.push("Intervenciones del asesor pedagÃ³gico (insumos para el anÃ¡lisis, no para el contexto):");
  if (payload.informes_pedagogicos?.length) {
    payload.informes_pedagogicos.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.fecha_legible || item.fecha} - ${
          item.materia || "Materia general"
        } | Asesor pedagÃ³gico: ${item.asesor_pedagogico}. Informe: ${item.texto_informe}`
      );
    });
  } else {
    lines.push("- No hay intervenciones registradas en el perÃ­odo.");
  }
  lines.push("");

  lines.push("Instrucciones de estilo:");
  lines.push(payload.instrucciones_estilo || IA_STYLE_INSTRUCTIONS);
  lines.push(
    "Analiza las calificaciones y el porcentaje de asistencia para inferir logros, alertas y sugerencias alineadas a las intervenciones del asesor pedagÃ³gico."
  );
  lines.push(
    "No enumeres todas las calificaciones ni reproduzcas listados de cada evaluaciÃ³n; sintetiza hallazgos por perÃ­odo/cuatrimestre."
  );

  return lines.join("\n");
};

export const buildInformeIA = async (payload = {}, user) => {
  const { id_ciclo, id_curso, id_alumno } = payload;
  if (!id_ciclo || !id_curso || !id_alumno) {
    const error = new Error("id_ciclo, id_curso e id_alumno son obligatorios");
    error.status = 400;
    throw error;
  }

  const cicloId = Number(id_ciclo);
  const cursoId = Number(id_curso);
  const alumnoId = Number(id_alumno);

  if ([cicloId, cursoId, alumnoId].some((value) => Number.isNaN(value))) {
    const error = new Error("Los identificadores deben ser numÃ©ricos");
    error.status = 400;
    throw error;
  }

  await ensureAlumnoAccess(user, alumnoId);
  await ensureCursoAccess(user, cursoId);

  const curso = await Curso.findByPk(cursoId, {
    include: [
      {
        model: CiclosLectivos,
        as: "cicloLectivo",
      },
      {
        model: Alumno,
        as: "alumnos",
        attributes: ["id_alumno"],
        through: { attributes: [] },
      },
    ],
  });

  if (!curso) {
    const error = new Error("Curso no encontrado");
    error.status = 404;
    throw error;
  }

  if (curso.id_ciclo !== cicloId) {
    const error = new Error("El curso no pertenece al ciclo indicado");
    error.status = 400;
    throw error;
  }

  const alumnoEnCurso = (curso.alumnos || []).some((alumno) => alumno.id_alumno === alumnoId);
  if (!alumnoEnCurso) {
    const error = new Error("El alumno no pertenece al curso indicado");
    error.status = 400;
    throw error;
  }

  const ciclo = curso.cicloLectivo;
  if (!ciclo) {
    const error = new Error("No se encontrÃ³ informaciÃ³n del ciclo lectivo");
    error.status = 404;
    throw error;
  }

  const cicloInicio = toDateInstance(ciclo.fecha_inicio);
  const cicloFin = toDateInstance(ciclo.fecha_fin);
  if (!cicloInicio || !cicloFin) {
    const error = new Error("El ciclo lectivo no tiene fechas vÃ¡lidas");
    error.status = 400;
    throw error;
  }

  const alumnoSummary = await getAlumnoSummary(
    { id_alumno: alumnoId, fecha_desde: cicloInicio.toISOString(), fecha_hasta: cicloFin.toISOString() },
    user
  );

  const periodoInfo = deriveAcademicPeriods(ciclo) || {};
  const clarificacionPeriodos = periodoInfo.clarifications || null;

  const calificacionesDataset = buildCalificacionesDataset(
    alumnoSummary.timeline?.calificaciones || [],
    periodoInfo.boundaries || {},
    alumnoSummary.materias || [],
    alumnoSummary.closing_grades || {}
  );

  const periodoSolicitado = {
    desde: cicloInicio.toISOString(),
    hasta: cicloFin.toISOString(),
    rango_legible: formatRangeLabel(cicloInicio, cicloFin),
  };

  const contextoGeneral = {
    alumno: alumnoSummary.context?.nombre || null,
    curso: alumnoSummary.context?.curso || `${curso.anio_escolar} ${curso.division || ""}`.trim(),
    ciclo_lectivo: {
      id_ciclo: ciclo.id_ciclo,
      anio: ciclo.anio,
    },
    periodo_solicitado: periodoSolicitado,
  };

  const asistenciaDataset = buildAttendanceDataset(
    alumnoSummary.timeline?.asistencias || [],
    periodoSolicitado
  );

  const structuredPayload = {
    contexto_general: contextoGeneral,
    clarificacion_periodos: clarificacionPeriodos,
    calificaciones: calificacionesDataset.detalles,
    resumen_calificaciones: {
      promedios_generales: calificacionesDataset.promediosGenerales,
      tipos_presentes: calificacionesDataset.tipos,
      totales: calificacionesDataset.totales,
      por_periodo: calificacionesDataset.resumenPorPeriodo,
      por_materia: calificacionesDataset.resumenPorMateria,
    },
    asistencia: asistenciaDataset,
    informes_pedagogicos: buildInformesDataset(alumnoSummary.informes_pedagogicos || []),
    instrucciones_estilo: IA_STYLE_INSTRUCTIONS,
    generado_en: new Date().toISOString(),
  };

  const systemPrompt = buildSystemPrompt(IA_STYLE_INSTRUCTIONS);
  const userPrompt = buildUserPromptFromPayload(structuredPayload);

  return {
    payload: structuredPayload,
    prompt: {
      system: systemPrompt,
      user: userPrompt,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
  };
};



