import {Request, Response} from "express";

import * as Backdoor from '../models/backdoor.model';
import Logger from '../../config/logger';


export async function resetDb(request: Request, response: Response): Promise<void> {
    try {
        await Backdoor.resetDb();
        response.statusMessage = "OK";
        response.status(200).send();
    } catch (err) {
        Logger.error(err);
        response.statusMessage = "Internal Server Error";
        response.status(500).send();
    }
}

export async function resample(request: Request, response: Response): Promise<void> {
    try {
        await Backdoor.loadData();
        response.statusMessage = "Created";
        response.status(201).send();
    } catch (err) {
        Logger.error(err);
        response.statusMessage = "Internal Server Error";
        response.status(500).send();
    }
}

export async function reload(request: Request, response: Response): Promise<void> {
    try {
        await Backdoor.resetDb();
        await Backdoor.loadData();
        response.statusMessage = "Created";
        response.status(201).send();
    } catch (err) {
        Logger.error(err);
        response.statusMessage = "Internal Server Error";
        response.status(500).send();
    }
}

export async function executeSql(request: Request, response: Response): Promise<void> {
    const sqlCommand = String(request.body);
    try {
        const results = await Backdoor.executeSql(sqlCommand);
        response.statusMessage = 'OK';
        response.status(200).json(results);
    } catch (err) {
        if (!err.hasBeenLogged) Logger.error(err);
        response.statusMessage = 'Internal Server Error';
        response.status(500).send();
    }
}
