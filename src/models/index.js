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
import { Tutor } from "./Tutor.js";
import { AlumnoTutor } from "./AlumnoTutores.js";
import { Administrador } from "./Administrador.js";
import { Rol } from "./Rol.js";
import { AlumnosCursos } from "./AlumnosCursos.js";
import { MateriasCurso } from "./MateriasCurso.js";
import { AuxiliaresCurso } from "./AuxiliaresCurso.js";
import { CiclosLectivos } from "./CiclosLectivos.js";
import { DocentesMateriasCurso } from "./DocentesMateriasCurso.js";
import { TipoCalificacion } from "./TipoCalificacion.js";
import { InformePedagogico } from "./InformePedagogico.js";
import { AsesorPedagogico } from "./AsesorPedagogico.js";

// Alumno - usuario
Alumno.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });
// Usuario - alumno
Usuario.hasOne(Alumno, { foreignKey: "id_usuario", as: "alumno" });

// Docente - Usuario
Docente.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });
// Usuario - Docente
Usuario.hasOne(Docente, { foreignKey: "id_usuario", as: "docente" });

// Tutor - Usuario
Tutor.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });
// Usuario - Tutor
Usuario.hasOne(Tutor, { foreignKey: "id_usuario", as: "tutor" });

// AsesorPedagogico - Usuario
AsesorPedagogico.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });
// Usuario - AsesorPedagogico
Usuario.hasOne(AsesorPedagogico, { foreignKey: "id_usuario", as: "asesorPedagogico" });

// Curso - Alumno (Muchos a Muchos) a través de AlumnosCursos
Curso.belongsToMany(Alumno, {
  through: AlumnosCursos,
  foreignKey: 'id_curso',
  otherKey: 'id_alumno',
  as: 'alumnos'
});

// Alumno - Curso (Muchos a Muchos) a través de AlumnosCursos
Alumno.belongsToMany(Curso, {
  through: AlumnosCursos,
  foreignKey: 'id_alumno',
  otherKey: 'id_curso',
  as: 'cursos'
});

// Alumno - asistencia
Alumno.hasMany(Asistencia, { foreignKey: "id_alumno" });
// Relaciones directas sobre la tabla pivote para facilitar includes/filters
AlumnosCursos.belongsTo(Alumno, { foreignKey: 'id_alumno', as: 'alumno' });
AlumnosCursos.belongsTo(Curso, { foreignKey: 'id_curso', as: 'curso' });

// asistencia - alumno
Asistencia.belongsTo(Alumno, { foreignKey: "id_alumno" });
// asistencia - usuario (quien registró la asistencia)
Asistencia.belongsTo(Usuario, { foreignKey: "registrado_por" });
// asistencia - estado
Asistencia.belongsTo(AsistenciaEstado, { foreignKey: "id_estado" });

// Curso - Materia (Muchos a Muchos) a través de MateriasCurso
Curso.hasMany(MateriasCurso, {
  foreignKey: 'id_curso',
  as: 'materiasCurso'
});
// Materia - Curso (Muchos a Muchos) a través de MateriasCurso
MateriasCurso.belongsTo(Curso, {
  foreignKey: 'id_curso',
  as: 'curso'
});

// Curso - CicloLectivo (Muchos a 1)
Curso.belongsTo(CiclosLectivos, {
  foreignKey: 'id_ciclo',
  as: 'cicloLectivo'
});
// CicloLectivo - Curso (1 a Muchos)
CiclosLectivos.hasMany(Curso, {
  foreignKey: 'id_ciclo',
  as: 'cursos'
});

// Materia - Curso (Muchos a Muchos) a través de MateriasCurso
Materia.hasMany(MateriasCurso, {
  foreignKey: 'id_materia',
  as: 'materiasCurso'
});
// Curso - Materia (Muchos a Muchos) a través de MateriasCurso
MateriasCurso.belongsTo(Materia, {
  foreignKey: 'id_materia',
  as: 'materia'
});

// Docente - MateriasCurso (Muchos a Muchos) a través de DocentesMateriasCurso
Docente.belongsToMany(MateriasCurso, {
  through: DocentesMateriasCurso,
  foreignKey: 'id_docente',
  otherKey: 'id_materia_curso',
  as: 'materiasCurso'
});

MateriasCurso.belongsToMany(Docente, {
  through: DocentesMateriasCurso,
  foreignKey: 'id_materia_curso',
  otherKey: 'id_docente',
  as: 'docentes'
});

// TipoCalificacion - Calificacion (1 a Muchos)
TipoCalificacion.hasMany(Calificacion, {
  foreignKey: 'id_tipo_calificacion',
  as: 'calificaciones'
});

// Calificacion - TipoCalificacion (Muchos a 1)
Calificacion.belongsTo(TipoCalificacion, {
  foreignKey: 'id_tipo_calificacion',
  as: 'tipoCalificacion'
});

// Alumno - Calificacion (1 a Muchos)
Alumno.hasMany(Calificacion, {
  foreignKey: 'id_alumno',
  as: 'calificaciones'
});
// Calificacion - Alumno (Muchos a 1)
Calificacion.belongsTo(Alumno, {
  foreignKey: 'id_alumno',
  as: 'alumno'
});

// Docente - Calificacion (1 a Muchos)
Docente.hasMany(Calificacion, {
  foreignKey: 'id_docente',
  as: 'calificaciones'
});
// Calificacion - Docente (Muchos a 1)
Calificacion.belongsTo(Docente, {
  foreignKey: 'id_docente',
  as: 'docente'
});

// MateriasCurso - Calificacion (1 a Muchos)
MateriasCurso.hasMany(Calificacion, {
  foreignKey: 'id_materia_curso',
  as: 'calificaciones'
});
// Calificacion - MateriasCurso (Muchos a 1)
Calificacion.belongsTo(MateriasCurso, {
  foreignKey: 'id_materia_curso',
  as: 'materiaCurso'
});

// AuxiliaresCurso - Curso (Muchos a 1)
AuxiliaresCurso.belongsTo(Curso, {
  foreignKey: 'id_curso',
  as: 'curso'
});
// Curso - AuxiliaresCurso (1 a Muchos)
Curso.hasMany(AuxiliaresCurso, {
  foreignKey: 'id_curso',
  as: 'auxiliaresCurso'
});

// Alumno - Tutor (Muchos a Muchos) a través de AlumnoPadre
Alumno.belongsToMany(Tutor, { through: AlumnoTutor, foreignKey: 'id_alumno', otherKey: 'id_tutor', as: 'tutores' });
Tutor.belongsToMany(Alumno, { through: AlumnoTutor, foreignKey: 'id_tutor', otherKey: 'id_alumno', as: 'alumnos' });

// Usuario - Rol (Muchos a Muchos) a través de usuarios_roles
Usuario.belongsToMany(Rol,
  {
    through: {
      model: "usuarios_roles",
      unique: false,
      timestamps: false
    },
    foreignKey: "id_usuario",
    otherKey: "id_rol",
    as: "roles"
  }
)

// InformePedagogico - AsesorPedagogico (Muchos a 1)
InformePedagogico.belongsTo(AsesorPedagogico, { foreignKey: "id_asesor", as: "asesorPedagogico" });
// AsesorPedagogico - InformePedagogico (1 a Muchos)
AsesorPedagogico.hasMany(InformePedagogico, { foreignKey: "id_asesor", as: "informesPedagogicos" });

// InformePedagogico - Alumno (Muchos a 1)
InformePedagogico.belongsTo(Alumno, { foreignKey: "id_alumno", as: "alumno" });
// Alumno - InformePedagogico (1 a Muchos)
Alumno.hasMany(InformePedagogico, { foreignKey: "id_alumno", as: "informesPedagogicos" });

// InformePedagogico - Docente (Muchos a 1)
InformePedagogico.belongsTo(Docente, { foreignKey: "id_docente", as: "docente" });
// Docente - InformePedagogico (1 a Muchos)
Docente.hasMany(InformePedagogico, { foreignKey: "id_docente", as: "informesPedagogicos" });

// InformePedagogico - MateriasCurso (Muchos a 1)
InformePedagogico.belongsTo(MateriasCurso, { foreignKey: "id_materia_curso", as: "materiaCurso" });
// MateriasCurso - InformePedagogico (1 a Muchos)
MateriasCurso.hasMany(InformePedagogico, { foreignKey: "id_materia_curso", as: "informesPedagogicos" });

export {
  sequelize,
  Usuario,
  Alumno,
  Curso,
  AlumnosCursos,
  Asistencia,
  AsistenciaEstado,
  Materia,
  MateriasCurso,
  Calificacion,
  Docente,
  DocentesMateriasCurso,
  Tutor,
  AlumnoTutor,
  Administrador,
  Rol,
  AuxiliaresCurso,
  CiclosLectivos,
  TipoCalificacion,
  InformePedagogico,
  AsesorPedagogico
};
