import * as authService from '../services/auth.service.js';

export const login = async (req, res, next) => {
    try{
        const { email, contrasenia } = req.body;
        if(!email || !contrasenia){
            const error = new Error('Email y contraseña son requeridos');
            error.status = 400;
            throw error;
        }

        const { csrfToken, accessToken, refreshToken } = await authService.login(email, contrasenia);
        res.cookie('csrf_token', csrfToken, { httpOnly: false, secure: false, sameSite: 'None' });
        res.cookie('access_token', accessToken, { httpOnly: true, secure: false, sameSite: 'None' });
        res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: false, sameSite: 'None' });

        return res.status(200).json({ message: 'Inicio de sesión exitoso' });
    }catch(error){
        next(error);
    }
}

export const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies['refresh_token'];
        const newAccessToken = await authService.refreshToken(refreshToken);

        res.cookie('access_token', newAccessToken, { httpOnly: true, secure: false, sameSite: 'None' });
        return res.status(200).json({ message: 'Token de acceso renovado exitosamente' });
    }catch(error){
        next(error);
    }
}

export const logout = (req, res) => {
    res.clearCookie('csrf_token');
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(200).json({ message: 'Cierre de sesión exitoso' });
}