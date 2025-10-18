import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const TipoCalificacion = sequelize.define("TipoCalificacion", {
    id_tipo_calificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    }
},{
    tableName: "tipos_calificaciones",
    timestamps: false
});