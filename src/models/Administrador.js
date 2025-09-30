import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Administrador = sequelize.define("Administrador", {
    id_administrador: {
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
    tableName: "administradores",
    timestamps: false
});