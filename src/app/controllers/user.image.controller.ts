import {Request, Response} from "express";

import Logger from "../../config/logger";
import {deleteUserImage, getUserImage, uploadUserImage} from "../models/user.image.model";


async function processRequest(
    request: Request,
    callback: (body: number) => Promise<[number, string, object | void]>
): Promise<[number, string, object | void]> {
    try {
        const id = parseInt(request.params.id, 10);
        if (!isNaN(id)) {
            return await callback(id);
        } else {
            return [400, `Bad Request: Malformed userId`, void 0];
        }
    } catch (err) {
        return [500, "Internal Server Error", void 0];
    }
}

async function respond(
    request: Request,
    response: Response,
    callback: (body: number) => Promise<[number, string, object | void]>
): Promise<void> {
    const [status, message, result] = await processRequest(request, callback);
    Logger.log(status >= 300 ? 'error': 'info', message);
    response.statusMessage = message;
    response.status(status).send(result);
}

export async function getImage(request: Request, response: Response): Promise<void> {
    await respond(request, response, getUserImage);
}

export async function setImage(request: Request, response: Response): Promise<void> {
    await respond(request, response, uploadUserImage);
}

export async function deleteImage(request: Request, response: Response): Promise<void> {
    await respond(request, response, deleteUserImage);
}
