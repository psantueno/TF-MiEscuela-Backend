import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Tutor = sequelize.define("Tutor", {
    id_tutor: {
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
    tableName: "tutores",
    timestamps: false
});