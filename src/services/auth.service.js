import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.util.js';
import { Usuario } from '../models/Usuario.js';
import { Rol } from '../models/Rol.js';

export const login = async (email, password) => {
    const user = await Usuario.findOne({
        where: { email },
        include: [
            {
                model: Rol,
                as: 'roles',
                through: { attributes: [] },
                attributes: ['id_rol', 'nombre_rol']
            }
        ]
    });

    const isValidPassword = user ? await bcrypt.compare(password, user.contrasenia) : false;
    
    if(!user || !isValidPassword){
        const error = new Error('Correo electrónico o contraseña incorrectos');
        error.status = 401;
        throw error;
    }

    const rol = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0].nombre_rol : null;
    const notificaciones = 0; // placeholder hasta implementar notificaciones reales

    const payload = {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        email: user.email,
        rol,
        notificaciones
    };

    const csrf_token = crypto.randomBytes(32).toString('hex');
    const access_token = generateAccessToken(payload);
    const refresh_token = generateRefreshToken(payload);

    return { access_token, refresh_token, csrf_token, user: { nombre_completo: user.nombre_completo, email: user.email, rol, notificaciones } };
}

export const refreshToken = async (refreshToken) => {
    try{
        const payload = verifyToken(refreshToken, 'refresh');
        const newAccessToken = generateAccessToken(payload);

        const user = { nombre_completo: payload.nombre_completo, email: payload.email, rol: payload.rol, notificaciones: payload.notificaciones };
        return { newAccessToken, user };
    }catch(error){
        throw error;
    }
}

