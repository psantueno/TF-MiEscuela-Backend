import * as asesorPedagogicoService from '../services/asesorPedagogico.service.js';

export const getAsesoresPedagogicos = async (req, res) => {
    try{
        const asesores = await asesorPedagogicoService.getAsesoresPedagogicos();
        return res.status(200).json(asesores);
    }catch(error){
        console.error('Error al obtener asesores pedagógicos:', error);
        return res.status(500).json({ error: 'Error al obtener asesores pedagógicos' });
    }
}