// models/AsistenciaEstado.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AsistenciaEstado = sequelize.define("AsistenciaEstado", {
  id_estado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descripcion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  detalle: {
    type: DataTypes.TEXT
  }
}, {
  tableName: "asistencia_estados",
  timestamps: false
});
