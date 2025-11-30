import { DateTime } from "luxon";

export const formatLocalDate = (date, separator = "/") => {
    if (!date) return null;
    
    const [year, month, day] = date.split('-');

    return [day, month, year].join(separator);
}

export const transformUTCToLocalDate = (utcDate) => {
    const localDate = DateTime.fromJSDate(new Date(utcDate)).setZone('America/Argentina/Buenos_Aires');

    return localDate.toFormat('dd/MM/yyyy HH:mm');
}

export const transformUTCDateOnly = (utcDate, format = 'dd/MM/yyyy') => {
    const dateObj = new Date(utcDate);
    const day = dateObj.getUTCDate() > 9 ? dateObj.getUTCDate() : `0${dateObj.getUTCDate()}`;
    const month = dateObj.getUTCMonth() > 8 ? (dateObj.getUTCMonth() + 1) : `0${dateObj.getUTCMonth() + 1}`;
    const year = dateObj.getUTCFullYear();

    const localDate = DateTime.fromObject({ year, month, day });
    return localDate.toFormat(format);
}
