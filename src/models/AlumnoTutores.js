import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AlumnoTutor = sequelize.define("AlumnoTutor", {
    id_alumno: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Alumno',
            key: 'id_alumno',
        },
        primaryKey: true
    },
    id_tutor: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Tutor',
            key: 'id_tutor',
        },
        primaryKey: true
    },
    parentesco: {
        type: DataTypes.STRING,
        allowNull: false
    }
},{
    tableName: "alumnos_tutores",
    timestamps: false
});