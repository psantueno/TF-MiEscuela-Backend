import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AlumnosCursos = sequelize.define("AlumnosCursos", {
    id_alumno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Alumnos",
            key: "id_alumno"
        },
        primaryKey: true
    },
    id_curso: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Cursos",
            key: "id_curso"
        },
        primaryKey: true
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: true
    },
}, {
    tableName: "alumnos_cursos",
    timestamps: false
});
