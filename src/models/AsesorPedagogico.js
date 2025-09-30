import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AsesorPedagogico = sequelize.define("AsesorPedagogico", {
    id_asesor: {
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
    tableName: "asesores_pedagogicos",
    timestamps: false
});