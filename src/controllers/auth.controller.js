import * as authService from '../services/auth.service.js';

export const login = async (req, res, next) => {
    try{
        const { email, contrasenia } = req.body;
        if(!email || !contrasenia){
            const error = new Error('Email y contraseña son requeridos');
            error.status = 400;
            throw error;
        }

        const { csrf_token, access_token, refresh_token, user } = await authService.login(email, contrasenia);
        /* 
        Autenticación mediante cookies y CSRF token -> PRODUCCION
        res.cookie('csrf_token', csrfToken, { httpOnly: false, secure: false, sameSite: 'None' });
        res.cookie('access_token', accessToken, { httpOnly: true, secure: false, sameSite: 'None' });
        res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: false, sameSite: 'None' });
        return res.status(200).json({ message: 'Inicio de sesión exitoso', data: user });
        */
        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            data:{
                csrf_token,
                access_token,
                refresh_token,
                user
            }
        })
    }catch(error){
        next(error);
    }
}

export const refresh = async (req, res, next) => {
    try {
        /* 
        Autenticación mediante cookies y CSRF token -> PRODUCCION
        const refreshToken = req.cookies['refresh_token'];
        */
        const refreshToken = req.headers['x-refresh-token'];
        if(!refreshToken){
            const error = new Error('Token de renovación es requerido');
            error.status = 400;
            throw error;
        }

        const { newAccessToken, user } = await authService.refreshToken(refreshToken);

        /*
        Autenticación mediante cookies y CSRF token -> PRODUCCION
        res.cookie('access_token', newAccessToken, { httpOnly: true, secure: false, sameSite: 'None' });
        return res.status(200).json({ message: 'Token de acceso renovado exitosamente', data: user });
        */
        return res.status(200).json({ 
            message: 'Token de acceso renovado exitosamente', 
            data: { 
                newAccessToken, 
                user }
            });
    }catch(error){
        next(error);
    }
}

export const logout = (req, res) => {
    /*
    Autenticación mediante cookies y CSRF token -> PRODUCCION
    res.clearCookie('csrf_token');
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    */
    return res.status(200).json({ message: 'Cierre de sesión exitoso' });
}