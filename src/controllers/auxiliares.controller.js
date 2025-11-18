import * as auxiliaresService from '../services/auxiliares.service.js';

export const getAuxiliares = async (req, res) => {
    try{
        const { page = 1, perPage = 10 } = req.query;
        const limit = parseInt(perPage);
        const offset = (parseInt(page) - 1) * limit;

        const auxiliares = await auxiliaresService.getAuxiiares(limit, offset);
        res.json(auxiliares);
    }catch(error){
        res.status(500).json({message: error.message});
    }
}