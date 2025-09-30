// DEFINIR TODAS LAS RELACIONES ENTRE LOS MODELOS
import { sequelize } from "../config/database.js";
import { Alumno } from "./Alumno.js";
import { Curso } from "./Curso.js";
import { Usuario } from "./Usuario.js";
import { Asistencia } from "./Asistencia.js";
import { AsistenciaEstado } from "./AsistenciaEstado.js";

// Alumno - usuario
Alumno.belongsTo(Usuario, { foreignKey: "id_usuario" });
// Alumno - asistencia
Alumno.hasMany(Asistencia, { foreignKey: "id_alumno" });
// Alumno - curso
Alumno.belongsTo(Curso, { foreignKey: "id_curso" });


Usuario.hasOne(Alumno, { foreignKey: "id_usuario" });
// Alumno - curso
Curso.hasMany(Alumno, { foreignKey: "id_curso" });

// asistencia - alumno
Asistencia.belongsTo(Alumno, { foreignKey: "id_alumno" });
// asistencia - usuario (quien registró la asistencia)
Asistencia.belongsTo(Usuario, { foreignKey: "registrado_por" });
// asistencia - estado
Asistencia.belongsTo(AsistenciaEstado, { foreignKey: "id_estado" });


export {
  sequelize,
  Alumno,
  Curso,
  Usuario,
  Asistencia,
  AsistenciaEstado
};
