// controllers/curso.controller.js
import * as cursoService from "../services/curso.service.js";
import { Curso, CiclosLectivos, AlumnosCursos } from "../models/index.js";
import { Op } from "sequelize";

// Obtener todos los cursos, restringido por rol de usuario
export const getCursos = async (req, res) => {
  try{
    const user = req.usuario; 
    const cursos = await cursoService.getCursos(user);
    res.json(cursos);
  }catch(error){
    console.error(error);
    res.status(500).json({ error: "Error obteniendo cursos" });
  }
}

// Obtener todos los cursos
export const obtenerCursos = async (req, res) => {
  try {
    const { page = 1, perPage = 10, sort = 'id', order = 'ASC', anio_escolar, division, id_ciclo } = req.query;

    const where = {};
    if (anio_escolar) where.anio_escolar = anio_escolar;
    if (division) where.division = division;
    if (id_ciclo) where.id_ciclo = id_ciclo;

    const rawSort = String(sort);
    const sortOrder = String(order).toUpperCase() === "DESC" ? "DESC" : "ASC";
    const sortColumn = rawSort === 'id' ? 'id_curso' : rawSort;

    const limit = parseInt(perPage, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const { rows, count } = await Curso.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: CiclosLectivos, as: "cicloLectivo", attributes: ["id_ciclo", "anio", "estado"] }],
      attributes: ["id_curso", "anio_escolar", "division", "id_ciclo"],
      order: [[sortColumn, sortOrder]],
    });

    const data = rows.map((c) => ({ ...c.toJSON(), id: c.id_curso }));
    return res.json({ data, total: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo cursos" });
  }
};

// Obtener un curso por id
export const obtenerCursoPorId = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, {
      include: [{ model: CiclosLectivos, as: "cicloLectivo", attributes: ["id_ciclo", "anio", "estado"] }],
      attributes: ["id_curso", "anio_escolar", "division", "id_ciclo"],
    });
    if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
    const data = { ...curso.toJSON(), id: curso.id_curso };
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo curso" });
  }
};

// Crear curso
export const crearCurso = async (req, res) => {
  try {
    const { anio_escolar, division, id_ciclo } = req.body || {};
    if (!anio_escolar || !id_ciclo) {
      return res.status(400).json({ error: "anio_escolar e id_ciclo son requeridos" });
    }
    // Evitar duplicados por ciclo: (anio_escolar, division, id_ciclo)
    if (division) {
      const existing = await Curso.findOne({
        where: {
          id_ciclo,
          anio_escolar,
          division: { [Op.iLike]: division },
        },
      });
      if (existing) {
        return res.status(409).json({ error: "Ya existe un curso con el mismo año escolar y división en el ciclo seleccionado" });
      }
    } else {
      // Si no hay división (null/undefined), validar duplicado sin división
      const existingNoDiv = await Curso.findOne({
        where: { id_ciclo, anio_escolar, division: { [Op.is]: null } },
      });
      if (existingNoDiv) {
        return res.status(409).json({ error: "Ya existe un curso con el mismo año escolar (sin división) en el ciclo seleccionado" });
      }
    }
    const nuevo = await Curso.create({ anio_escolar, division, id_ciclo });
    const created = await Curso.findByPk(nuevo.id_curso, {
      include: [{ model: CiclosLectivos, as: "cicloLectivo", attributes: ["id_ciclo", "anio", "estado"] }],
      attributes: ["id_curso", "anio_escolar", "division", "id_ciclo"],
    });
    res.status(201).json({ ...created.toJSON(), id: created.id_curso });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando curso" });
  }
};

// Actualizar curso
export const actualizarCurso = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, { include: [{ model: CiclosLectivos, as: "cicloLectivo", attributes: ["estado"] }] });
    if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
    if (String(curso?.cicloLectivo?.estado || '').toLowerCase() === 'cerrado') {
      return res.status(409).json({ error: "No se puede editar un curso que pertenece a un ciclo lectivo cerrado" });
    }
    const { anio_escolar, division, id_ciclo } = req.body || {};
    // Validar duplicados al actualizar (considerando posibles cambios de ciclo/año/división)
    const targetIdCiclo = id_ciclo !== undefined && id_ciclo !== null ? id_ciclo : curso.id_ciclo;
    const targetAnio = anio_escolar !== undefined && anio_escolar !== null ? anio_escolar : curso.anio_escolar;
    const targetDivision = division !== undefined ? division : curso.division;

    if (targetDivision) {
      const dup = await Curso.findOne({
        where: {
          id_curso: { [Op.ne]: curso.id_curso },
          id_ciclo: targetIdCiclo,
          anio_escolar: targetAnio,
          division: { [Op.iLike]: targetDivision },
        },
      });
      if (dup) {
        return res.status(409).json({ error: "Ya existe otro curso con el mismo año escolar y división en el ciclo seleccionado" });
      }
    } else {
      const dupNoDiv = await Curso.findOne({
        where: {
          id_curso: { [Op.ne]: curso.id_curso },
          id_ciclo: targetIdCiclo,
          anio_escolar: targetAnio,
          division: { [Op.is]: null },
        },
      });
      if (dupNoDiv) {
        return res.status(409).json({ error: "Ya existe otro curso con el mismo año escolar (sin división) en el ciclo seleccionado" });
      }
    }
    if (id_ciclo !== undefined && id_ciclo !== null) {
      const cicloDestino = await CiclosLectivos.findByPk(id_ciclo, { attributes: ['estado'] });
      if (!cicloDestino) {
        return res.status(400).json({ error: 'El ciclo lectivo destino no existe' });
      }
      if (String(cicloDestino.estado || '').toLowerCase() === 'cerrado') {
        return res.status(409).json({ error: 'No se puede mover el curso a un ciclo lectivo cerrado' });
      }
    }
    await curso.update({
      ...(anio_escolar !== undefined ? { anio_escolar } : {}),
      ...(division !== undefined ? { division } : {}),
      ...(id_ciclo !== undefined ? { id_ciclo } : {}),
    });
    const updated = await Curso.findByPk(req.params.id, {
      include: [{ model: CiclosLectivos, as: "cicloLectivo", attributes: ["id_ciclo", "anio", "estado"] }],
      attributes: ["id_curso", "anio_escolar", "division", "id_ciclo"],
    });
    res.json({ ...updated.toJSON(), id: updated.id_curso });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando curso" });
  }
};

// Eliminar curso
export const eliminarCurso = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, { include: [{ model: CiclosLectivos, as: "cicloLectivo", attributes: ["estado"] }] });
    if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
    if (String(curso?.cicloLectivo?.estado || '').toLowerCase() === 'cerrado') {
      return res.status(409).json({ error: "No se puede eliminar un curso que pertenece a un ciclo lectivo cerrado" });
    }
    // Validación clara: no eliminar si tiene alumnos asociados
    const alumnosAsociados = await AlumnosCursos.count({ where: { id_curso: curso.id_curso } });
    if (alumnosAsociados > 0) {
      return res.status(409).json({ error: "No se puede eliminar el curso porque tiene alumnos cargados" });
    }
    const id = curso.id_curso;
    await curso.destroy();
    // Para react-admin, devolver el id del eliminado
    res.status(200).json({ id });
  } catch (err) {
    console.error(err);
    if (err?.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ error: 'No se puede eliminar el curso: tiene registros asociados' });
    }
    res.status(500).json({ error: "Error eliminando curso" });
  }
};

// Obtener materias por curso
export const getMateriasPorCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.usuario;
    const materias = await cursoService.getMateriasPorCurso(id, user);
    res.json(materias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo materias por curso" });
  }
}

// Obtener alumnos por curso
export const getAlumnosPorCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const alumnos = await cursoService.getAlumnosPorCurso(id);
    res.json(alumnos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo alumnos por curso" });
  }
}

// Obtener docentes por curso
export const getDocentesPorCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const docentes = await cursoService.getDocentesPorCurso(id);
    res.json(docentes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo docentes por curso" });
  }
}
