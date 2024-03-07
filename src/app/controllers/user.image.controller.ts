import {Request, Response} from "express";
import path from 'path';
import fs from 'fs';

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

function contentType(request: Request): string {
    return request.headers['content-type'] || '' as string;
}

export async function getImage(request: Request, response: Response): Promise<void> {
    await respond(request, response, getUserImage);
}

export async function setImage(request: Request, response: Response): Promise<void> {
    const imageBuffer: Buffer = request.body;
    Logger.info(`Received image of size ${imageBuffer.length}`);
    const fileExtension = contentType(request).split('/')[1];

    // Define the path where the image will be saved
    const imagePath = path.join(__dirname, '../../../storage/images/' + request.params.id + '.' + fileExtension);

    // Write the image data to a file
    fs.writeFile(imagePath, imageBuffer, (err) => {
        if (err) {
            Logger.error(`Error saving image: ${err.message}`);
            response.status(500).send("Internal Server Error");
        } else {
            Logger.info(`Image saved successfully at ${imagePath}`);
            response.status(200).send("Image saved successfully");
        }
    });
}

export async function deleteImage(request: Request, response: Response): Promise<void> {
    await respond(request, response, deleteUserImage);
}
