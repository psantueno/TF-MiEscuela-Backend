// models/Asistencia.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js"; 

export const Asistencia = sequelize.define("Asistencia", {
  id_asistencia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_alumno: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  id_estado: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
  },
  registrado_por: {
    type: DataTypes.INTEGER,
  }
}, {
  tableName: "asistencias",
  timestamps: true,
  createdAt: "creado_el",
  updatedAt: "actualizado_el",  
  indexes: [
    {
      unique: true,
      fields: ["id_alumno", "fecha"],
    },
  ],
});


