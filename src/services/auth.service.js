import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.util.js';
import { Usuario } from '../models/Usuario.js';

export const login = async (email, password) => {
    const user = await Usuario.findOne({ where: { email } });

    const isValidPassword = user ? await bcrypt.compare(password, user.contrasenia) : false;
    
    if(!user || !isValidPassword){
        const error = new Error('Correo electrónico o contraseña incorrectos');
        error.status = 401;
        throw error;
    }

    user.rol = 'Estudiante'; // Rol de prueba
    user.notificaciones = 3; // Notificaciones de prueba
    const csrf_token = crypto.randomBytes(32).toString('hex');
    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken(user);

    return { access_token, refresh_token, csrf_token, user: { nombre_completo: user.nombre_completo, email: user.email, rol: user.rol, notificaciones: user.notificaciones } };
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
