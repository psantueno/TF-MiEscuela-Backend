import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Rol } from "./Rol.js";

export const Usuario = sequelize.define("Usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numero_documento: {
    type: DataTypes.STRING,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  contrasenia: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  genero: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "usuarios",
  timestamps: true,
  createdAt: "creado_el",
  updatedAt: "actualizado_el"
});

Usuario.belongsToMany(Rol,
  {
    through: {
      model: "usuarios_roles",
      unique: false,
      timestamps: false
    },
    foreignKey: "id_usuario",
    otherKey: "id_rol",
    as: "roles"
  }
)