import { Op } from "sequelize";
import { Asistencia, Alumno, Curso, Usuario, AsistenciaEstado } from "../models/index.js";

// Crear asistencia (lote por curso)
export const tomarAsistenciaCurso = async (req, res) => {
  const { id_curso, fecha, items } = req.body;
  const usuarioId = req.user?.id; // opcional si usás auth

  if (!id_curso || !fecha || !Array.isArray(items)) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  try {
    const registros = items.map((i) => ({
      id_alumno: i.id_alumno,
      fecha,
      id_estado: i.id_estado,
      observaciones: i.observaciones || null,
      registrado_por: usuarioId || null,
    }));

    await Asistencia.bulkCreate(registros, {
      updateOnDuplicate: ["id_estado", "observaciones", "registrado_por", "actualizado_el"],
    });

    res.json({ ok: true, total: registros.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registrando asistencia" });
  }
};

// =========================
// 1) Asistencias de un curso en una fecha determinada
// =========================
// controllers/asistencia.controller.js
export const obtenerAsistenciasCursoFecha = async (req, res) => {
  const { id_curso } = req.params;
  const { fecha } = req.query;                        // <-- tomar query param
  const fechaConsulta = fecha || new Date().toISOString().split("T")[0];

  try {
    const asistencias = await Asistencia.findAll({
      include: [
        {
          model: Alumno,
          where: { id_curso },
          include: [
            { model: Curso, attributes: ["anio_escolar", "division"], as: 'curso' },
            { model: Usuario, attributes: ["nombre", "apellido"], as: 'usuario' },
          ],
        },
        { model: AsistenciaEstado, attributes: ["descripcion"] },
      ],
      where: { fecha: fechaConsulta },                // <-- usar la fecha pedida
    });

    const data = asistencias.map((a) => ({
      id_asistencia: a.id_asistencia,
      fecha: a.fecha,
      id_estado: a.id_estado,
      estado_nombre: a.AsistenciaEstado?.descripcion,
      alumno_id: a.Alumno?.id_alumno,
      alumno_nombre: `${a.Alumno?.usuario?.apellido || ""} ${a.Alumno?.usuario?.nombre || ""}`.trim(),
      alumno_apellido: a.Alumno?.usuario?.apellido,
      alumno_nombre_prop: a.Alumno?.usuario?.nombre,
      curso_anio: a.Alumno?.curso?.anio_escolar,
      curso_division: a.Alumno?.curso?.division,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo asistencias del curso" });
  }
};

// =========================
// 2) Asistencias de un curso entre fechas
// =========================
export const obtenerAsistenciasCursoEntreFechas = async (req, res) => {
  const { id_curso } = req.params;
  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return res.status(400).json({ error: "Faltan fechas 'desde' y 'hasta'" });
  }

  try {
    const asistencias = await Asistencia.findAll({
      include: [
        {
          model: Alumno,
          where: { id_curso },
          include: [
            { model: Curso, attributes: ["anio_escolar", "division"], as: 'curso' },
            { model: Usuario, attributes: ["nombre", "apellido"], as: 'usuario' },
          ],
        },
        { model: AsistenciaEstado, attributes: ["descripcion"] },
      ],
      where: { fecha: { [Op.between]: [desde, hasta] } },
    });

    const data = asistencias.map((a) => ({
      id_asistencia: a.id_asistencia,
      fecha: a.fecha,
      id_estado: a.id_estado,
      estado_nombre: a.AsistenciaEstado?.descripcion,
      alumno_id: a.Alumno?.id_alumno,
      alumno_nombre: `${a.Alumno?.usuario?.apellido || ""} ${a.Alumno?.usuario?.nombre || ""}`.trim(),
      alumno_apellido: a.Alumno?.usuario?.apellido,
      alumno_nombre_prop: a.Alumno?.usuario?.nombre,
      curso_anio: a.Alumno?.curso?.anio_escolar,
      curso_division: a.Alumno?.curso?.division,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo asistencias del curso entre fechas" });
  }
};

// =========================
// 3) Asistencias de un alumno entre fechas
// =========================
export const obtenerAsistenciasAlumnoEntreFechas = async (req, res) => {
  const { id_alumno } = req.params;
  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return res.status(400).json({ error: "Faltan fechas 'desde' y 'hasta'" });
  }

  try {
    const asistencias = await Asistencia.findAll({
      include: [
        {
          model: Alumno,
          where: { id_alumno },
          include: [
            { model: Curso, attributes: ["anio_escolar", "division"], as: 'curso' },
            { model: Usuario, attributes: ["nombre", "apellido"], as: 'usuario' },
          ],
        },
        { model: AsistenciaEstado, attributes: ["descripcion"] },
      ],
      where: { fecha: { [Op.between]: [desde, hasta] } },
    });

    const data = asistencias.map((a) => ({
      id_asistencia: a.id_asistencia,
      fecha: a.fecha,
      id_estado: a.id_estado,
      estado_nombre: a.AsistenciaEstado?.descripcion,
      alumno_id: a.Alumno?.id_alumno,
      alumno_nombre: `${a.Alumno?.usuario?.apellido || ""} ${a.Alumno?.usuario?.nombre || ""}`.trim(),
      alumno_apellido: a.Alumno?.usuario?.apellido,
      alumno_nombre_prop: a.Alumno?.usuario?.nombre,
      curso_anio: a.Alumno?.Curso?.anio_escolar,
      curso_division: a.Alumno?.Curso?.division, 
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo asistencias del alumno entre fechas" });
  }
};

export const obtenerPromedioAsistenciasCurso = async (req, res) => { 
  try {
    const { id_curso } = req.params;
    const { desde, hasta } = req.query;

    const asistencias = await Asistencia.findAll({
      include: [
        {
          model: Alumno,
          where: { id_curso },
          include: [
            { model: Curso, attributes: ["anio_escolar", "division"], as: "curso" },
            { model: Usuario, attributes: ["nombre", "apellido"], as: "usuario" },
          ],
        },
        { model: AsistenciaEstado, attributes: ["descripcion"] },
      ],
      where: { fecha: { [Op.between]: [desde, hasta] } },
    });

    const plainAsistencias = asistencias.map((a) => a.get({ plain: true }));

    const asistenciaPorAlumno = {};

    plainAsistencias.forEach((a) => {
      const id = a.Alumno?.id_alumno;
      if (!id) return;

      if (!asistenciaPorAlumno[id]) {
        asistenciaPorAlumno[id] = {
          id_alumno: id,
          nombre: a.Alumno?.usuario?.nombre || "",
          apellido: a.Alumno?.usuario?.apellido || "",
          total: 0,
          presentes: 0,
        };
      }

      asistenciaPorAlumno[id].total += 1;
      if (a.AsistenciaEstado?.descripcion === "Presente") {
        asistenciaPorAlumno[id].presentes += 1;
      }
    });

    const resultados = Object.values(asistenciaPorAlumno).map((alumno) => ({
      id_alumno: alumno.id_alumno,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      promedio:
        alumno.total > 0
          ? Number(((alumno.presentes / alumno.total) * 100).toFixed(2))
          : 0,
    }));

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo el promedio de asistencias del alumno" });
  }
};

// DELETE /api/asistencias/curso/:id_curso?fecha=YYYY-MM-DD
export const eliminarAsistenciasCurso = async (req, res) => {
  const { id_curso } = req.params;
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "Debe especificar la fecha" });
  }

  try {
    // 1️⃣ Buscar los alumnos del curso
    const alumnos = await Alumno.findAll({
      where: { id_curso },
      attributes: ["id_alumno"],
    });

    if (!alumnos.length) {
      return res.status(404).json({ error: "No hay alumnos en este curso" });
    }

    // 2️⃣ Extraer sus IDs
    const idsAlumnos = alumnos.map((a) => a.id_alumno);

    // 3️⃣ Eliminar asistencias de esos alumnos en la fecha indicada
    const eliminados = await Asistencia.destroy({
      where: {
        id_alumno: idsAlumnos,
        fecha,
      },
    });

    res.json({ ok: true, eliminados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando asistencias del curso" });
  }
};
