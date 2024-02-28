import {Request, Response} from "express";

import Logger from "../../config/logger";


export async function getImage(request: Request, response: Response): Promise<void> {
    try {
        // Your code goes here
        response.statusMessage = "Not Implemented Yet!";
        response.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        response.statusMessage = "Internal Server Error";
        response.status(500).send();
        return;
    }
}

export async function setImage(request: Request, response: Response): Promise<void> {
    try {
        // Your code goes here
        response.statusMessage = "Not Implemented Yet!";
        response.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        response.statusMessage = "Internal Server Error";
        response.status(500).send();
        return;
    }
}
