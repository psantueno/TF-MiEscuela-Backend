import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Docente = sequelize.define("Docente", {
    id_docente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    }
}, {
    tableName: "docentes",
    timestamps: false
});