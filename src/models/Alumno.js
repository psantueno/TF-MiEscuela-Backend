import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Alumno = sequelize.define("Alumno", {
  id_alumno: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  id_curso: {   // 🔹 FK hacia cursos
    type: DataTypes.INTEGER,
    allowNull: false
  },
  legajo: {
    type: DataTypes.STRING,
    unique: true
  }
}, {
  tableName: "alumnos",
  timestamps: true,
  createdAt: "creado_el",
  updatedAt: "actualizado_el"
});