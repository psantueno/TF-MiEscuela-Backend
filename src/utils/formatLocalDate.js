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
