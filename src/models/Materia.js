import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Materia = sequelize.define("Materia", {
    id_materia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.STRING
    }
},{
    tableName: "materias",
    timestamps: false
});