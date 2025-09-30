import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Rol = sequelize.define("Rol", {
    id_rol:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_rol:{
        type: DataTypes.STRING,
        allowNull: false
    }
},{
    tableName: "roles",
    timestamps: true,
    createdAt: "creado_el",
    updatedAt: "actualizado_el"
})

