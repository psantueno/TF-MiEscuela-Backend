import { Op, fn, QueryTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import {
  Alumno,
  AlumnosCursos,
  AlumnoTutor,
  AsesorPedagogico,
  Asistencia,
  AsistenciaEstado,
  Auxiliar,
  AuxiliaresCurso,
  Calificacion,
  CiclosLectivos,
  Curso,
  Docente,
  DocentesMateriasCurso,
  InformePedagogico,
  JustificativosAsistencia,
  Materia,
  MateriasCurso,
  TipoCalificacion,
  Tutor,
  Usuario,
  UsuarioRol,
} from "../models/index.js";

const ROLE_IDS = {
  docente: 3,
  auxiliar: 4,
  alumno: 6,
};

const ROLE_ALIASES = {
  administrador: "admin",
  admin: "admin",
  director: "director",
  docente: "docente",
  auxiliar: "auxiliar",
  "asesor pedagogico": "asesor_pedagogico",
  asesor_pedagogico: "asesor_pedagogico",
  tutor: "tutor",
  alumno: "alumno",
  "jefe de auxiliares": "jefe_auxiliar",
  jefe_auxiliar: "jefe_auxiliar",
};

const APPROVED_THRESHOLD = 6;

const findOpenCiclo = async () => {
  const ciclos = await CiclosLectivos.findAll({
    where: { estado: { [Op.iLike]: "Abierto" } },
    order: [["anio", "DESC"]],
  });

  if (!ciclos.length) {
    const error = new Error("No hay ciclo lectivo abierto");
    error.status = 404;
    throw error;
  }

  if (ciclos.length > 1) {
    const error = new Error("Hay mas de un ciclo lectivo en estado abierto");
    error.status = 409;
    throw error;
  }

  return ciclos[0];
};

const normalizeRole = (rol) => {
  if (!rol) return null;
  const key = String(rol).toLowerCase();
  return ROLE_ALIASES[key] || null;
};

const percentage = (value, total) => {
  if (!total) return 0;
  return Number(((value * 100) / total).toFixed(2));
};

const asDateString = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const getLastWeekdays = (count = 5) => {
  const days = [];
  const cursor = new Date();

  while (days.length < count) {
    const day = cursor.getDay(); // 0 domingo, 6 sabado
    if (day !== 0 && day !== 6) {
      days.unshift(asDateString(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
};

// Parse YYYY-MM-DD without timezone shifts (treat as UTC noon) to get weekday reliably
const getWeekdayKey = (dateStr) => {
  if (!dateStr) return null;
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if ([y, m, d].some((n) => Number.isNaN(n))) return null;
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)); // noon UTC avoids DST jumps
  const day = utcDate.getUTCDay(); // 0 Sunday ... 6 Saturday
  const keyMap = { 1: "lun", 2: "mar", 3: "mie", 4: "jue", 5: "vie" };
  return keyMap[day] || null;
};

const categorizeEstado = (descripcion = "") => {
  const normalized = descripcion.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (normalized.includes("pres")) return "presente";
  if (normalized.includes("tar")) return "tarde";
  if (normalized.includes("just")) return "ausente_justificada";
  if (normalized.includes("aus")) return "ausente";
  return "otro";
};

const isPresent = (descripcion = "") => {
  const cat = categorizeEstado(descripcion);
  return cat === "presente" || cat === "tarde";
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

const computeTotalsByDate = (rows = []) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = asDateString(row.fecha);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, { total: 0, presentes: 0 });
    }
    const current = map.get(key);
    current.total += 1;
    if (isPresent(row.AsistenciaEstado?.descripcion || "")) {
      current.presentes += 1;
    }
  });
  return map;
};

const fetchAlumnoIdsPorCursos = async (cursoIds = []) => {
  if (!cursoIds.length) return [];
  const rows = await AlumnosCursos.findAll({
    where: {
      id_curso: { [Op.in]: cursoIds },
      fecha_fin: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: fn("NOW") }] },
    },
    attributes: ["id_alumno"],
  });
  return Array.from(new Set(rows.map((r) => r.id_alumno)));
};

const buildAdminSummary = async () => {
  const totalUsuarios = await Usuario.count();
  const usuariosConRol = await UsuarioRol.count({ distinct: true, col: "id_usuario" });

  const totalAlumnos = await Alumno.count();
  const alumnosConCurso = await AlumnosCursos.count({
    where: { fecha_fin: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: fn("NOW") }] } },
    distinct: true,
    col: "id_alumno",
  });

  const totalDocentes = await Docente.count();
  const docentesConAsignacion = await DocentesMateriasCurso.count({
    where: { fecha_fin: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: fn("NOW") }] } },
    distinct: true,
    col: "id_docente",
  });

  const totalAuxiliares = await Auxiliar.count();
  const auxiliaresConCurso = await AuxiliaresCurso.count({
    where: { fecha_fin: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: fn("NOW") }] } },
    distinct: true,
    col: "id_auxiliar",
  });

  return {
    usuariosSinRol: Math.max(totalUsuarios - usuariosConRol, 0),
    alumnosSinCurso: Math.max(totalAlumnos - alumnosConCurso, 0),
    docentesSinAsignacion: Math.max(totalDocentes - docentesConAsignacion, 0),
    auxiliaresSinCurso: Math.max(totalAuxiliares - auxiliaresConCurso, 0),
  };
};

const buildDirectorSummary = async () => {
  const today = asDateString(new Date());
  const asistencias = await Asistencia.findAll({
    where: { fecha: today },
    include: [{ model: AsistenciaEstado, attributes: ["descripcion"] }],
  });

  const totalHoy = asistencias.length;
  const presentesHoy = asistencias.filter((a) => isPresent(a.AsistenciaEstado?.descripcion || "")).length;
  const asistenciaHoy = totalHoy ? percentage(presentesHoy, totalHoy) : null;

  const calificaciones = await Calificacion.findAll({
    include: [{ model: TipoCalificacion, as: "tipoCalificacion", attributes: ["id_tipo_calificacion", "descripcion"] }],
  });

  const buckets = {
    primer: { total: 0, aprobados: 0 },
    segundo: { total: 0, aprobados: 0 },
    final: { total: 0, aprobados: 0 },
  };

  calificaciones.forEach((calif) => {
    const periodo = resolvePeriodFromTipoCalificacion(calif.tipoCalificacion || {});
    if (!periodo) return;
    const bucket = buckets[periodo];
    bucket.total += 1;
    if (Number(calif.nota) >= APPROVED_THRESHOLD) bucket.aprobados += 1;
  });

  const toPercent = (bucket) => (bucket.total ? percentage(bucket.aprobados, bucket.total) : null);

  return {
    asistenciaHoy,
    aprobados: {
      c1: toPercent(buckets.primer),
      c2: toPercent(buckets.segundo),
      final: toPercent(buckets.final),
    },
  };
};

const buildDocenteSummary = async (user) => {
  const docente = await Docente.findOne({ where: { id_usuario: user.id_usuario } });
  if (!docente) {
    const error = new Error("No se encontro el docente asociado al usuario");
    error.status = 404;
    throw error;
  }

  const asignaciones = await DocentesMateriasCurso.findAll({
    where: {
      id_docente: docente.id_docente,
      fecha_fin: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: fn("NOW") }] },
    },
    include: [
      {
        model: MateriasCurso,
        as: "materiaCurso",
        include: [
          { model: Materia, as: "materia", attributes: ["nombre"] },
          { model: Curso, as: "curso", attributes: ["id_curso", "anio_escolar", "division"] },
        ],
      },
    ],
  });

  const cursosAsignados = asignaciones
    .map((a) => {
      const curso = a.materiaCurso?.curso;
      if (!curso) return null;
      return {
        id_curso: curso.id_curso,
        id_materia_curso: a.materiaCurso?.id_materia_curso,
        etiqueta: `${a.materiaCurso?.materia?.nombre || "Materia"} - ${`${curso.anio_escolar || ""}${curso.division || ""}`.trim()}`,
      };
    })
    .filter(Boolean);

  const cursoIds = Array.from(new Set(cursosAsignados.map((c) => c.id_curso)));
  const alumnoPorCurso = await AlumnosCursos.findAll({
    where: {
      id_curso: { [Op.in]: cursoIds },
      fecha_fin: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: fn("NOW") }] },
    },
    attributes: ["id_alumno", "id_curso"],
  });

  const alumnoToCurso = new Map();
  alumnoPorCurso.forEach((row) => {
    if (!alumnoToCurso.has(row.id_alumno)) {
      alumnoToCurso.set(row.id_alumno, row.id_curso);
    }
  });

  const alumnoIds = Array.from(alumnoToCurso.keys());
  const fechas = getLastWeekdays();

  const asistencias = alumnoIds.length
    ? await Asistencia.findAll({
        where: { id_alumno: { [Op.in]: alumnoIds }, fecha: { [Op.in]: fechas } },
        include: [{ model: AsistenciaEstado, attributes: ["descripcion"] }],
      })
    : [];

  const totalsByCurso = new Map();
  asistencias.forEach((row) => {
    const cursoId = alumnoToCurso.get(row.id_alumno);
    if (!cursoId) return;
    if (!totalsByCurso.has(cursoId)) {
      totalsByCurso.set(cursoId, new Map());
    }
    const mapByDate = totalsByCurso.get(cursoId);
    const key = asDateString(row.fecha);
    if (!key) return;
    if (!mapByDate.has(key)) {
      mapByDate.set(key, { total: 0, presentes: 0 });
    }
    const current = mapByDate.get(key);
    current.total += 1;
    if (isPresent(row.AsistenciaEstado?.descripcion || "")) {
      current.presentes += 1;
    }
  });

  const asistenciaPorCurso = cursosAsignados.map((curso) => {
    const mapByDate = totalsByCurso.get(curso.id_curso) || new Map();
    const asistenciaSemanaFechas = fechas.map((fechaStr) => {
      const stats = mapByDate.get(fechaStr);
      return {
        fecha: fechaStr,
        porcentaje: stats ? percentage(stats.presentes, stats.total) : null,
      };
    });

    return {
      ...curso,
      asistenciaSemana: asistenciaSemanaFechas, // ahora con fechas explícitas
    };
  });

  return { cursos: asistenciaPorCurso };
};

const buildAuxiliarSummary = async (user, { includeIncidencias = false } = {}) => {
  let auxiliar = null;
  let cursoIds = [];
  let alumnoIds = [];
  let fechas = [];

  try {
    auxiliar = await Auxiliar.findOne({ where: { id_usuario: user.id_usuario } });

    if (!auxiliar) {
      const error = new Error("No se encontro el auxiliar asociado al usuario");
      error.status = 404;
      throw error;
    }

    const cursosAsignados = await AuxiliaresCurso.findAll({
      where: {
        id_auxiliar: auxiliar.id_auxiliar,
        fecha_inicio: { [Op.lte]: fn("NOW") },
        fecha_fin: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: fn("NOW") }] },
      },
      attributes: ["id_curso"],
      include: [
        {
          model: Curso,
          as: "curso",
          attributes: ["id_curso", "anio_escolar", "division"],
        },
      ],
    });
    cursoIds = Array.from(new Set(cursosAsignados.map((c) => c.id_curso)));

    // alumnos actuales por curso (vigentes hoy)
    const alumnoPorCurso = cursoIds.length
      ? await AlumnosCursos.findAll({
          where: {
            id_curso: { [Op.in]: cursoIds },
            fecha_inicio: { [Op.lte]: fn("NOW") },
            fecha_fin: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: fn("NOW") }] },
          },
          attributes: ["id_alumno", "id_curso"],
        })
      : [];

    const alumnoToCurso = new Map();
    alumnoPorCurso.forEach((row) => {
      if (!alumnoToCurso.has(row.id_alumno)) {
        alumnoToCurso.set(row.id_alumno, row.id_curso);
      }
    });

    alumnoIds = Array.from(alumnoToCurso.keys());
    fechas = getLastWeekdays(5);

    const asistencias = alumnoIds.length
      ? await Asistencia.findAll({
          where: { id_alumno: { [Op.in]: alumnoIds }, fecha: { [Op.in]: fechas } },
          include: [{ model: AsistenciaEstado, attributes: ["descripcion"] }],
        })
      : [];

    const totalsByDate = computeTotalsByDate(asistencias);
    let totalRegistros = 0;
    let totalPresentes = 0;
    totalsByDate.forEach((val) => {
      totalRegistros += val.total;
      totalPresentes += val.presentes;
    });
    const asistenciaSemana = fechas
      .map((fechaStr) => {
        const stats = totalsByDate.get(fechaStr);
        if (!stats || !stats.total) return null; // no contar días sin registros (feriados, etc)
        return {
          fecha: fechaStr,
          porcentaje: percentage(stats.presentes, stats.total),
        };
      })
      .filter(Boolean);

    // Totales por curso
    const totalsByCurso = new Map();
    asistencias.forEach((row) => {
      const cursoId = alumnoToCurso.get(row.id_alumno);
      if (!cursoId) return;
      if (!totalsByCurso.has(cursoId)) {
        totalsByCurso.set(cursoId, new Map());
      }
      const mapByDate = totalsByCurso.get(cursoId);
      const key = asDateString(row.fecha);
      if (!key) return;
      if (!mapByDate.has(key)) {
        mapByDate.set(key, { total: 0, presentes: 0 });
      }
      const current = mapByDate.get(key);
      current.total += 1;
      if (isPresent(row.AsistenciaEstado?.descripcion || "")) {
        current.presentes += 1;
      }
    });

    const cursos = cursosAsignados.map((c) => {
      const mapByDate = totalsByCurso.get(c.id_curso) || new Map();
      const asistenciaSemanaFechas = fechas.map((fechaStr) => {
        const stats = mapByDate.get(fechaStr);
        if (!stats || !stats.total) return null;
        return {
          fecha: fechaStr,
          porcentaje: percentage(stats.presentes, stats.total),
        };
      }).filter(Boolean);

      const etiquetaBase =
        c.curso && (c.curso.anio_escolar || c.curso.division)
          ? `Curso ${c.curso.anio_escolar || ""}${c.curso.anio_escolar ? "°" : ""}${c.curso.division ? ` ${c.curso.division}` : ""}`.trim()
          : `Curso ${c.id_curso}`;

      return {
        id_curso: c.id_curso,
        etiqueta: etiquetaBase,
        asistenciaSemana: asistenciaSemanaFechas,
      };
    });

    const whereCurso = cursoIds.length
      ? {
          model: Curso,
          as: "cursos",
          where: { id_curso: { [Op.in]: cursoIds } },
          through: { where: { fecha_fin: null } },
          required: true,
          attributes: [],
        }
      : null;

    const cursoJoin = cursoIds.length
      ? `
        JOIN alumnos_cursos ac ON ac.id_alumno = al.id_alumno
          AND ac.id_curso IN (:cursoIds)
          AND ac.fecha_inicio <= NOW()
          AND (ac.fecha_fin IS NULL OR ac.fecha_fin >= NOW())
        JOIN cursos c ON c.id_curso = ac.id_curso
      `
      : `
        LEFT JOIN alumnos_cursos ac ON ac.id_alumno = al.id_alumno
          AND ac.fecha_inicio <= NOW()
          AND (ac.fecha_fin IS NULL OR ac.fecha_fin >= NOW())
        LEFT JOIN cursos c ON c.id_curso = ac.id_curso
      `;

    const justificativosPendientes = await sequelize.query(
      `
        SELECT
          j.id_justificativo,
          a.fecha AS asistencia_fecha,
          u.apellido AS alumno_apellido,
          u.nombre AS alumno_nombre,
          c.id_curso AS curso_id,
          c.anio_escolar AS curso_anio,
          c.division AS curso_division
        FROM justificativos_asistencia j
        JOIN asistencias a ON a.id_asistencia = j.id_asistencia
        JOIN alumnos al ON al.id_alumno = a.id_alumno
        JOIN usuarios u ON u.id_usuario = al.id_usuario
        ${cursoJoin}
        WHERE j.estado = 'Pendiente'
        ORDER BY a.fecha DESC
        LIMIT 5
      `,
      {
        replacements: { cursoIds },
        type: QueryTypes.SELECT,
      }
    );

    return {
      justificativosPendientes: justificativosPendientes.map((j) => ({
        id: j.id_justificativo,
        title: `${j.alumno_apellido || ""} ${j.alumno_nombre || ""}`.trim() || "Justificativo",
        fecha: asDateString(j.asistencia_fecha),
        curso_id: j.curso_id || null,
        curso_anio: j.curso_anio || null,
        curso_division: j.curso_division || null,
      })),
      cursos,
      asistenciaSemana, // array de {fecha, porcentaje} solo días con registros
      ...(includeIncidencias ? { incidencias: { abiertas: 0, cerradas: 0 } } : {}),
    };
  } catch (err) {
    console.error("[buildAuxiliarSummary] ERROR", {
      userId: user?.id_usuario,
      auxiliarId: auxiliar?.id_auxiliar,
      cursoIds,
      alumnoIds,
      fechas,
      message: err?.message,
      stack: err?.stack,
    });
    throw err;
  }
};

const buildAsesorSummary = async (user) => {
  const asesor = await AsesorPedagogico.findOne({ where: { id_usuario: user.id_usuario } });
  if (!asesor) {
    const error = new Error("No se encontro el asesor pedagogico asociado al usuario");
    error.status = 404;
    throw error;
  }

  const alumnosEnAsesoramiento = await InformePedagogico.count({
    where: { id_asesor: asesor.id_asesor },
    distinct: true,
    col: "id_alumno",
  });

  const intervenciones = await InformePedagogico.findAll({
    where: { id_asesor: asesor.id_asesor },
    include: [
      {
        model: Alumno,
        as: "alumno",
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
        attributes: ["id_alumno"],
      },
      {
        model: MateriasCurso,
        as: "materiaCurso",
        include: [
          { model: Materia, as: "materia", attributes: ["nombre"] },
          { model: Curso, as: "curso", attributes: ["anio_escolar", "division"] },
        ],
      },
    ],
    order: [["fecha", "DESC"]],
    limit: 5,
  });

  return {
    alumnosEnAsesoramiento,
    intervenciones: intervenciones.map((item) => ({
      id: item.id_informe,
      fecha: asDateString(item.fecha),
      alumno: `${item.alumno?.usuario?.apellido || ""} ${item.alumno?.usuario?.nombre || ""}`.trim(),
      materia:
        item.materiaCurso?.materia?.nombre ||
        `${item.materiaCurso?.curso?.anio_escolar || ""}${item.materiaCurso?.curso?.division || ""}`.trim() ||
        null,
    })),
  };
};

const buildTutorSummary = async (user) => {
  const tutor = await Tutor.findOne({ where: { id_usuario: user.id_usuario } });
  if (!tutor) {
    const error = new Error("No se encontro el tutor asociado al usuario");
    error.status = 404;
    throw error;
  }

  const vinculos = await AlumnoTutor.findAll({
    where: { id_tutor: tutor.id_tutor },
    attributes: ["id_alumno"],
  });


  const alumnoIds = Array.from(new Set(vinculos.map((v) => v.id_alumno)));

  if (!alumnoIds.length) {
    return { calificacionesRecientes: [], asistencia30d: null, justificativosRecientes: [] };
  }

  const calificacionesRecientes = await Calificacion.findAll({
    where: { id_alumno: { [Op.in]: alumnoIds } },
    include: [
      {
        model: Alumno,
        as: "alumno",
        attributes: ["id_alumno"],
        include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
      },
      {
        model: MateriasCurso,
        as: "materiaCurso",
        include: [
          { model: Materia, as: "materia", attributes: ["nombre"] },
          { model: Curso, as: "curso", attributes: ["anio_escolar", "division"] },
        ],
      },
    ],
    order: [["fecha", "DESC"]],
    limit: 6,
  });

  const start = asDateString(new Date(new Date().setDate(new Date().getDate() - 30)));
  const end = asDateString(new Date());

  const asistencias = await Asistencia.findAll({
    where: { id_alumno: { [Op.in]: alumnoIds }, fecha: { [Op.between]: [start, end] } },
    include: [{ model: AsistenciaEstado, attributes: ["descripcion"] }],
  });

  const asistenciaTotals = asistencias.reduce(
    (acc, row) => {
      acc.total += 1;
      if (isPresent(row.AsistenciaEstado?.descripcion || "")) acc.presentes += 1;
      return acc;
    },
    { total: 0, presentes: 0 }
  );

  const justificativosRecientes = await JustificativosAsistencia.findAll({
    where: { id_tutor: tutor.id_tutor },
    include: [
      {
        model: Asistencia,
        as: "asistencia",
        attributes: ["fecha"],
        include: [
          {
            model: Alumno,
            attributes: ["id_alumno"],
            include: [{ model: Usuario, as: "usuario", attributes: ["nombre", "apellido"] }],
          },
        ],
      },
    ],
    order: [["id_justificativo", "DESC"]],
    limit: 5,
  });

  return {
    calificacionesRecientes: calificacionesRecientes.map((c) => ({
      id: c.id_calificacion,
      hijo: `${c.alumno?.usuario?.apellido || ""} ${c.alumno?.usuario?.nombre || ""}`.trim(),
      materia:
        c.materiaCurso?.materia?.nombre ||
        `${c.materiaCurso?.curso?.anio_escolar || ""}${c.materiaCurso?.curso?.division || ""}`.trim() ||
        null,
      nota: c.nota,
      fecha: asDateString(c.fecha),
    })),
    asistencia30d: asistenciaTotals.total ? percentage(asistenciaTotals.presentes, asistenciaTotals.total) : null,
    justificativosRecientes: justificativosRecientes.map((j) => ({
      id: j.id_justificativo,
      title: `${j.asistencia?.Alumno?.usuario?.apellido || ""} ${j.asistencia?.Alumno?.usuario?.nombre || ""}`.trim() || "Justificativo",
      fecha: asDateString(j.asistencia?.fecha),
      estado: j.estado,
    })),
  };
};

export const getResumenPanelGeneral = async () => {
  const cicloAbierto = await findOpenCiclo();

  const [alumnos, docentes, auxiliares, cursos] = await Promise.all([
    UsuarioRol.count({ where: { id_rol: ROLE_IDS.alumno } }),
    UsuarioRol.count({ where: { id_rol: ROLE_IDS.docente } }),
    UsuarioRol.count({ where: { id_rol: ROLE_IDS.auxiliar } }),
    Curso.count({ where: { id_ciclo: cicloAbierto.id_ciclo } }),
  ]);

  return { alumnos, docentes, auxiliares, cursos };
};

export const getPanelPorRol = async (user = {}) => {
  const role = normalizeRole(user.rol);
  if (!role) {
    const error = new Error("Rol no reconocido");
    error.status = 400;
    throw error;
  }

  if (role === "alumno") {
    const error = new Error("El rol alumno no tiene informacion en esta vista");
    error.status = 403;
    throw error;
  }

  if (role === "admin") {
    return { role, data: await buildAdminSummary() };
  }
  if (role === "director") {
    return { role, data: await buildDirectorSummary() };
  }
  if (role === "docente") {
    return { role, data: await buildDocenteSummary(user) };
  }
  if (role === "auxiliar") {
    return { role, data: await buildAuxiliarSummary(user) };
  }
  if (role === "jefe_auxiliar") {
    return { role, data: await buildAuxiliarSummary(user, { includeIncidencias: true }) };
  }
  if (role === "asesor_pedagogico") {
    return { role, data: await buildAsesorSummary(user) };
  }
  if (role === "tutor") {
    return { role, data: await buildTutorSummary(user) };
  }

  const error = new Error("Rol no soportado");
  error.status = 400;
  throw error;
};
