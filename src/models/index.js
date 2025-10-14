// DEFINIR TODAS LAS RELACIONES ENTRE LOS MODELOS
import { sequelize } from "../config/database.js";
import { Alumno } from "./Alumno.js";
import { Curso } from "./Curso.js";
import { Usuario } from "./Usuario.js";
import { Asistencia } from "./Asistencia.js";
import { AsistenciaEstado } from "./AsistenciaEstado.js";
import { Materia } from "./Materia.js";
import { Calificacion } from "./Calificacion.js";
import { Docente } from "./Docente.js";
import { CursoMateria } from "./CursoMateria.js";
import { Tutor } from "./Tutor.js";
import { AlumnoTutor } from "./AlumnoTutores.js";

// Alumno - usuario
Alumno.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });
// Usuario - alumno
Usuario.hasOne(Alumno, { foreignKey: "id_usuario", as: "alumno" });
// Alumno - asistencia
Alumno.hasMany(Asistencia, { foreignKey: "id_alumno" });
// Alumno - curso
Alumno.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
// Alumno - curso
Curso.hasMany(Alumno, { foreignKey: "id_curso", as: "alumnos" });

// asistencia - alumno
Asistencia.belongsTo(Alumno, { foreignKey: "id_alumno" });
// asistencia - usuario (quien registró la asistencia)
Asistencia.belongsTo(Usuario, { foreignKey: "registrado_por" });
// asistencia - estado
Asistencia.belongsTo(AsistenciaEstado, { foreignKey: "id_estado" });

// Calificacion - Alumno
Calificacion.belongsTo(Alumno, { foreignKey: "id_alumno", as: "alumno" });
// Calificacion - Materia
Calificacion.belongsTo(Materia, { foreignKey: "id_materia", as: "materia" });
// Calificacion - Curso
Calificacion.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
// Calificacion - Docente
Calificacion.belongsTo(Docente, { foreignKey: "id_docente", as: "docente" });

// Curso - Materia (Muchos a Muchos)
Curso.belongsToMany(Materia, { through: CursoMateria, foreignKey: 'id_curso', otherKey: 'id_materia', as: 'materias' });
Materia.belongsToMany(Curso, { through: CursoMateria, foreignKey: 'id_materia', otherKey: 'id_curso', as: 'cursos' });


// Docente - Usuario
Docente.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });
// Usuario - Docente
Usuario.hasOne(Docente, { foreignKey: "id_usuario", as: "docente" });

// Tutor - Usuario
Tutor.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });
// Usuario - Tutor
Usuario.hasOne(Tutor, { foreignKey: "id_usuario", as: "tutor" });
// Alumno - Tutor (Muchos a Muchos) a través de AlumnoPadre
Alumno.belongsToMany(Tutor, { through: AlumnoTutor, foreignKey: 'id_alumno', otherKey: 'id_tutor', as: 'tutores' });
Tutor.belongsToMany(Alumno, { through: AlumnoTutor, foreignKey: 'id_tutor', otherKey: 'id_alumno', as: 'alumnos' });


export {
  sequelize,
  Alumno,
  Curso,
  Usuario,
  Asistencia,
  AsistenciaEstado,
  Materia,
  Calificacion,
  Docente,
  CursoMateria,
  Tutor,
  AlumnoTutor
};
