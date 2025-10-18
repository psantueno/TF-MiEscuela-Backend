import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Rol } from "./Rol.js";

export const Usuario = sequelize.define("Usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numero_documento: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  legajo: {
    type: DataTypes.STRING,
    unique: true,    
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
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('telefono');
      return rawValue ? rawValue : 'No proporcionado';
    },
    set(value) {
      const restrictedValues = ["No proporcionado"];
      if (restrictedValues.includes(value)){
        this.setDataValue('telefono', null);
      }else{
        this.setDataValue('telefono', value);
      }
    }
  },
  domicilio: {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('domicilio');
      return rawValue ? rawValue : 'No proporcionado';
    },
    set(value) {
      const restrictedValues = ["No proporcionado"];
      if (restrictedValues.includes(value)){
        this.setDataValue('domicilio', null);
      }else{
        this.setDataValue('domicilio', value);
      }
    },
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('fecha_nacimiento');
      return rawValue ? rawValue : 'No proporcionado';
    },
    set(value) {
      const restrictedValues = ["No proporcionado"];
      if (restrictedValues.includes(value)){
        this.setDataValue('fecha_nacimiento', null);
      }else{
        this.setDataValue('fecha_nacimiento', value);
      }
    }
  },
  genero: {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('genero');
      return rawValue ? rawValue : 'No proporcionado';
    },
    set(value) {
      const restrictedValues = ["No proporcionado"];
      if (restrictedValues.includes(value)){
        this.setDataValue('genero', null);
      }else{
        this.setDataValue('genero', value);
      }
    }
  }
}, {
  tableName: "usuarios",
  timestamps: true,
  createdAt: "creado_el",
  updatedAt: "actualizado_el"
});