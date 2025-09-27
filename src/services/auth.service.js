import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.util.js';
import { Usuario } from '../models/Usuario.model.js';

export const login = async (email, password) => {
    const user = await Usuario.findOne({ where: { email } });

    if(!user || !user.validPassword(password)){
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
    }

    const csrfToken = crypto.randomBytes(32).toString('hex');
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { accessToken, refreshToken, csrfToken };
}

export const refreshToken = async (refreshToken) => {
    try{
        const user = verifyToken(refreshToken, 'refresh');
        const newAccessToken = generateAccessToken(user);

        return newAccessToken;
    }catch(error){
        throw error;
    }
}
