import {Request, Response} from "express";

import {
    authenticationToken,
    authoriseRequest,
    contentType,
    respond,
    respondErrors,
    respondImage
} from "./common.controller";
import {deleteUserImage, getUserImage, uploadUserImage} from "../models/user.image.model";


export async function getImage(request: Request, response: Response): Promise<void> {
    const userId = parseInt(request.params.id, 10);
    if (isNaN(userId)) {
        response.status(400).send("Invalid user id");
        return;
    }
    const callback = () => getUserImage(userId);
    await respondImage(response, callback);
}

export async function setImage(request: Request, response: Response): Promise<void> {
    const authorise = async () => await authoriseRequest(authenticationToken(request), request.params.id);
    const userId = await respondErrors(response, authorise);
    if (userId === undefined) return;
    const fileExtension = contentType(request).split('/')[1];
    if (fileExtension === undefined || !['png', 'jpeg', 'gif'].includes(fileExtension)) {
        response.status(400).send("Invalid content type, must be one of: png, jpeg, gif");
        return;
    }
    const callback = () => uploadUserImage(request.body as Buffer, userId, fileExtension);
    await respond(response, callback);
}

export async function deleteImage(request: Request, response: Response): Promise<void> {
    const authorise = async () => await authoriseRequest(authenticationToken(request), request.params.id);
    const userId = await respondErrors(response, authorise);
    if (userId === undefined) return;
    const callback = () => deleteUserImage(userId);
    await respond(response, callback);
}
