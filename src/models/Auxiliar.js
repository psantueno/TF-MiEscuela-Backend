import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Auxiliar = sequelize.define("Auxiliar", {
    id_auxiliar: {
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
    tableName: "auxiliares",
    timestamps: false
});