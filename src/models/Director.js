import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Director = sequelize.define("Director", {
    id_director: {
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
    tableName: "directores",
    timestamps: false
});