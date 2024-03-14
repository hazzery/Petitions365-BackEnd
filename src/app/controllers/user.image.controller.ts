import {Request, Response} from "express";

import {deleteUserImage, getUserImage, uploadUserImage} from "../models/user.image.model";
import {respond} from "./common.controller";


function contentType(request: Request): string {
    return request.headers['content-type'] ?? '';
}

export async function getImage(request: Request, response: Response): Promise<void> {
    const callback = () => getUserImage(parseInt(request.params.id, 10));
    await respond(response, callback);
}

export async function setImage(request: Request, response: Response): Promise<void> {
    const imageBuffer: Buffer = request.body;
    const fileExtension = contentType(request).split('/')[1];
    const callback = () => uploadUserImage(imageBuffer, parseInt(request.params.id, 10), fileExtension);
    await respond(response, callback);
}

export async function deleteImage(request: Request, response: Response): Promise<void> {
    const callback = () => deleteUserImage(parseInt(request.params.id, 10));
    await respond(response, callback);
}
