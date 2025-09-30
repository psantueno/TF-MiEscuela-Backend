import { Usuario } from '../models/Usuario.js';
import { Rol } from '../models/Rol.js';
import { UsuarioRol } from '../models/UsuarioRol.js';
import { Administrador } from "../models/Administrador.js";
import { Director } from "../models/Director.js";
import { Docente } from "../models/Docente.js";
import { Auxiliar } from "../models/Auxiliar.js";
import { AsesorPedagogico } from "../models/AsesorPedagogico.js";
import { Alumno } from "../models/Alumno.js";
import { Tutor } from "../models/Tutor.js";
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

const createUserInRoleTable = async (roleId, userId, transaction) => {
    switch(roleId){
        case 1: // Admin
            await Administrador.create({ id_usuario: userId }, { transaction: transaction });
            break;
        case 2: // Director
            await Director.create({ id_usuario: userId }, { transaction: transaction });
            break;
        case 3: // Docente
            await Docente.create({ id_usuario: userId }, { transaction: transaction });
            break;
        case 4: // Auxiliar
            await Auxiliar.create({ id_usuario: userId }, { transaction: transaction });
            break;
        case 5: // Asesor Pedagógico
            await AsesorPedagogico.create({ id_usuario: userId }, { transaction: transaction });
            break;
        case 6: // Alumno
            await Alumno.create({ id_usuario: userId }, { transaction: transaction });
            break;
        case 7: // Tutor
            await Tutor.create({ id_usuario: userId }, { transaction: transaction });
            break;
    }
}

const deleteUserInRoleTable = async (oldRole, userId, transaction) => {
    switch(oldRole){
        case 1: // Admin
            await Administrador.destroy({ where: { id_usuario: userId } }, { transaction: transaction });
            break;
        case 2: // Director
            await Director.destroy({ where: { id_usuario: userId } }, { transaction: transaction });
            break;
        case 3: // Docente
            await Docente.destroy({ where: { id_usuario: userId } }, { transaction: transaction });
            break;
        case 4: // Auxiliar
            await Auxiliar.destroy({ where: { id_usuario: userId } }, { transaction: transaction });
            break;
        case 5: // Asesor Pedagógico
            await AsesorPedagogico.destroy({ where: { id_usuario: userId } }, { transaction: transaction });
            break;
        case 6: // Alumno
            await Alumno.destroy({ where: { id_usuario: userId } }, { transaction: transaction });
            break;
        case 7: // Tutor
            await Tutor.destroy({ where: { id_usuario: userId } }, { transaction: transaction });
                break;
    }
}


export const getUsuarios = async (limit, offset, filters) => {
    const whereClause = {};
    if(filters.nombre_completo){
        whereClause.nombre_completo = { [Op.iLike]: `%${filters.nombre_completo}%` };
    }

    if(filters.id_rol){
        const usuariosConRol = await UsuarioRol.findAll({ where: { id_rol: filters.id_rol }, attributes: ['id_usuario'] });
        const idsUsuarios = usuariosConRol.map(ur => ur.id_usuario);
        whereClause.id_usuario = { [Op.in]: idsUsuarios };
    }

    const { rows: users, count: total } = await Usuario.findAndCountAll({
        limit,
        offset,
        order: [["id_usuario", "ASC"]],
        include: [
            {
                model: Rol,
                as: "roles",
                through: { attributes: [] },
                attributes: ["id_rol", "nombre_rol"]
            },
        ],
        attributes: { exclude: ["contrasenia", "creado_el", "actualizado_el"] },
        where: { ...whereClause }
    });
    return { users, total };
}

export const getUsuario = async (id_usuario) => {
    const user = await Usuario.findByPk(id_usuario, { 
        include: [
            {
                model: Rol,
                as: "roles",
                through: { attributes: [] },
                attributes: ["id_rol", "nombre_rol"]
            },
        ],
        attributes: { exclude: ["contrasenia", "creado_el", "actualizado_el"] }
    });
    return user;
}

export const createUsuario = async (data) => {
    const emailExists = await Usuario.findOne({ where: 
        { email: data.email }
    });

    if(emailExists){
        const error = new Error("El email ya está en uso");
        error.statusCode = 400;
        throw error;
    }

    const documentExists = await Usuario.findOne({ where: 
        { numero_documento: data.numero_documento }
    });
    if(documentExists){
        const error = new Error("El número de documento ya está en uso");
        error.statusCode = 400;
        throw error;
    }

    const t = await sequelize.transaction();

    const hashedPassword = await bcrypt.hash(data.contrasenia, 10);

    const newUser = await Usuario.create({
        nombre_completo: data.nombre_completo,
        numero_documento: data.numero_documento,
        email: data.email,
        telefono: data.telefono ? data.telefono : null,
        direccion: data.direccion ? data.direccion : null,
        fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento : null,
        genero: data.genero ? data.genero : null,
        contrasenia: hashedPassword
    }, { transaction: t });

    const rol = await Rol.findOne({ where: { id_rol: data.id_rol } });

    if(!rol){
        const error = new Error("Rol no encontrado");
        error.statusCode = 404;
        throw error;
    }

    await UsuarioRol.create({
        id_usuario: newUser.id_usuario,
        id_rol: rol.id_rol
    }, { transaction: t });

    await createUserInRoleTable(rol.id_rol, newUser.id_usuario, t);

    await t.commit();

    const newUserWithRoles = await Usuario.findByPk(newUser.id_usuario, 
        { 
            include: [
                {
                    model: Rol,
                    as: "roles",
                    through: { attributes: [] },
                    attributes: ["id_rol", "nombre_rol"]
                },
            ],
            attributes: { exclude: ["contrasenia", "creado_el", "actualizado_el"] }
        });

    return newUserWithRoles;
}

export const updateUsuario = async (id_usuario, data) => {
    const emailExists = await Usuario.findOne({ where: 
        { email: data.email, id_usuario: { [Op.ne]: id_usuario } }
    });

    if(emailExists){
        const error = new Error("El email ya está en uso");
        error.statusCode = 400;
        throw error;
    }

    const documentExists = await Usuario.findOne({ where: 
        { numero_documento: data.numero_documento, id_usuario: { [Op.ne]: id_usuario } }
    });
    if(documentExists){
        const error = new Error("El número de documento ya está en uso");
        error.statusCode = 400;
        throw error;
    }

    const t = await sequelize.transaction();

    const user = await Usuario.findByPk(id_usuario, { 
        include: [
            {
                model: Rol,
                as: "roles",
                through: { attributes: [] },
                attributes: ["id_rol", "nombre_rol"]
            },
        ]
    });

    if(!user){
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
    }

    await user.update({
        nombre_completo: data.nombre_completo,
        numero_documento: data.numero_documento,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        fecha_nacimiento: data.fecha_nacimiento,
        genero: data.genero
    }, { transaction: t });
    
    const rol = await Rol.findOne({ where: { id_rol: data.id_rol } });
    
    if(!rol){
        const error = new Error("Rol no encontrado");
        error.statusCode = 404;
        throw error;
    }

    const currentRole = await UsuarioRol.findOne({ where: { id_usuario: user.id_usuario } });

    await UsuarioRol.destroy({ where: { id_usuario: user.id_usuario } }, { transaction: t });

    await UsuarioRol.create({
        id_usuario: user.id_usuario,
        id_rol: rol.id_rol
    }, { transaction: t });

    console.log(user);
    console.log(currentRole.id_rol, rol.id_rol);
    if(currentRole.id_rol !== rol.id_rol){
        await deleteUserInRoleTable(currentRole.id_rol, user.id_usuario, t);
        await createUserInRoleTable(rol.id_rol, user.id_usuario, t);
    }

    await t.commit();
    
    const updatedUser = await Usuario.findByPk(id_usuario, { 
        include: [
            {
                model: Rol,
                as: "roles",
                through: { attributes: [] },
                attributes: ["id_rol", "nombre_rol"]
            },
        ] 
    });

    return updatedUser;
}

export const deleteUsuario = async (id_usuario) => {
    const t = await sequelize.transaction();

    const user = await Usuario.findByPk(id_usuario);
    
    if(!user){
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
    }

    await UsuarioRol.destroy({ where: { id_usuario: user.id_usuario } }, { transaction: t });
    await user.destroy({ transaction: t });
    await deleteUserInRoleTable(user.roles.id_rol, user.id_usuario, t);

    await t.commit();
}