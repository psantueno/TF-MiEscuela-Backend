// models/Asistencia.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Alumno } from "./Alumno.js";
import { Curso } from "./Curso.js";
import { Usuario } from "./Usuario.js";
import { AsistenciaEstado } from "./AsistenciaEstado.js";

export const Asistencia = sequelize.define("Asistencia", {
  id_asistencia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "asistencias",
  timestamps: false
});

// Relaciones
Asistencia.belongsTo(Alumno, { foreignKey: "id_alumno" });
Asistencia.belongsTo(Curso, { foreignKey: "id_curso" });
Asistencia.belongsTo(Usuario, { foreignKey: "registrado_por" });
Asistencia.belongsTo(AsistenciaEstado, { foreignKey: "id_estado" });
