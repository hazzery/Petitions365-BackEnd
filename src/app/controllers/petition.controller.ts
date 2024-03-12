import {Request, Response} from "express";
import Ajv, {JSONSchemaType} from "ajv";
import addFormats from "ajv-formats";

import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json'
import {
    allCategories,
    allPetitions,
    createPetition,
    removePetition,
    singlePetition,
    updatePetition
} from "../models/petition.model";

const ajv = new Ajv({removeAdditional: 'all'});
addFormats(ajv);

async function processRequestBody<Input>(
    request: Request,
    schema: JSONSchemaType<Input>,
    callback: (body: Input) => Promise<[number, string, object | void]>
): Promise<[number, string, object | void]> {
    try {
        const validator = ajv.compile<Input>(schema);
        if (!validator(request.body)) {
            return [400, `Bad Request: ${ajv.errorsText(validator.errors)}`, void 0];
        } else {
            return await callback(request.body);
        }
    } catch (err) {
        return [500, err.message, void 0];
    }
}

async function respond(
    response: Response,
    callback: () => Promise<[number, string, object | void]>
): Promise<void> {
    const [status, message, result] = await callback();
    Logger.log(status >= 400 ? 'error': 'info', message);
    response.statusMessage = message;
    response.status(status).send(result);
}

export async function getAllPetitions(request: Request, response: Response): Promise<void> {
    const callback = async () => processRequestBody(request, schemas.petition_search, allPetitions);
    await respond(response, callback);
}

export async function getPetition(request: Request, response: Response): Promise<void> {
    const callback = async () => singlePetition(parseInt(request.params.id, 10));
    await respond(response, callback);
}

export async function addPetition(request: Request, response: Response): Promise<void> {
    const callback = async () => processRequestBody(request, schemas.petition_post, createPetition);
    await respond(response, callback);
}

export async function editPetition(request: Request, response: Response): Promise<void> {
    const callback = async () => processRequestBody(request, schemas.petition_patch, updatePetition);
    await respond(response, callback);
}

export async function deletePetition(request: Request, response: Response): Promise<void> {
    const callback = async () => removePetition(parseInt(request.params.id, 10));
    await respond(response, callback);
}

export async function getCategories(request: Request, response: Response): Promise<void> {
    await respond(response, allCategories);
}
