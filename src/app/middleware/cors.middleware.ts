import {Request, Response} from "express";


export default async function (request: Request, response: Response, next: () => void) {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Authorization');
    response.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
    next();
}