import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const CursoMateria = sequelize.define("CursoMateria", {
    id_curso: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Curso',
            key: 'id_curso'
        },
        primaryKey: true
    },
    id_materia: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Materia',
            key: 'id_materia'
        },
        primaryKey: true
    }
},{
    tableName: "cursos_materias",
    timestamps: false
});