import {Request, Response} from "express";

import * as Backdoor from '../models/backdoor.model';
import Logger from '../../config/logger';


export async function resetDb(req: Request, res: Response): Promise<void> {
    try {
        await Backdoor.resetDb();
        res.statusMessage = "OK";
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export async function resample(req: Request, res: Response): Promise<void> {
    try {
        await Backdoor.loadData();
        res.statusMessage = "Created";
        res.status(201).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export async function reload(req: Request, res: Response): Promise<void> {
    try {
        await Backdoor.resetDb();
        await Backdoor.loadData();
        res.statusMessage = "Created";
        res.status(201).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export async function executeSql(req: Request, res: Response): Promise<void> {
    const sqlCommand = String(req.body);
    try {
        const results = await Backdoor.executeSql(sqlCommand);
        res.statusMessage = 'OK';
        res.status(200).json(results);
    } catch (err) {
        if (!err.hasBeenLogged) Logger.error(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}
