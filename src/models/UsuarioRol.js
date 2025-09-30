import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const UsuarioRol = sequelize.define("UsuarioRol", {
    id_usuario: {
        type: DataTypes.INTEGER,
        references: {
            model: "Usuarios",
            key: "id_usuario"
        },
        primaryKey: true
    },
    id_rol: {
        type: DataTypes.INTEGER,
        references: {
            model: "Roles",
            key: "id_rol"
        },
        primaryKey: true
    }
}, {
    tableName: "usuarios_roles",
    timestamps: false
});

