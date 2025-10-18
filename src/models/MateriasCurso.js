import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const MateriasCurso = sequelize.define("MateriasCurso", {
    id_materia_curso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_materia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {  
            model: "Materias",
            key: "id_materia"
        },
        unique: 'materia_curso_unico'
    },
    id_curso: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Cursos",
            key: "id_curso"
        },
        unique: 'materia_curso_unico'
    }
},{
    tableName: "materias_curso",
    timestamps: false
});