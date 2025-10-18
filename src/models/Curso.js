import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Curso = sequelize.define("Curso", {
  id_curso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  anio_escolar: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  division: {
    type: DataTypes.STRING,
    allowNull: true
  },
  id_ciclo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Ciclos",
      key: "id_ciclo"
    }
  }
}, {
  tableName: "cursos",
  timestamps: true,
  createdAt: "creado_el",
  updatedAt: "actualizado_el"
});
