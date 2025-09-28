// models/Asistencia.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Asistencia = sequelize.define("Asistencia", {
  id_asistencia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_alumno: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  id_estado: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  registrado_por: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "asistencias",
  timestamps: true,            // Sequelize maneja creado_el / actualizado_el
  createdAt: "creado_el",
  updatedAt: "actualizado_el"
});

