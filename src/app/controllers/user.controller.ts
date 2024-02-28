import {Request, Response} from "express";
import addFormats from 'ajv-formats';
import Ajv from 'ajv';

import * as schemas from '../resources/schemas.json';
import * as users from '../models/user.model';
import Logger from '../../config/logger';


const ajv = new Ajv({removeAdditional: 'all'});
addFormats(ajv);

async function processRequestBody<Input, Output extends object | void>(
    request: Request,
    response: Response,
    schema: object,
    callback: (body: Input) => Promise<[number, string, Output]>
): Promise<Output> {
    try {
        const validator = ajv.compile<Input>(schema);
        if (!validator(request.body)) {
            response.statusMessage = `Bad Request: ${ajv.errorsText(validator.errors)}`;
            response.status(400).send();
        } else {
            const [status, message, result] = await callback(request.body);
            Logger.info(message);
            response.statusMessage = message;
            response.status(status).send(result);
            return result;
        }
    } catch (err) {
        Logger.error(err);
        response.statusMessage = "Internal Server Error";
        response.status(500).send();
    }
}

export async function register(request: Request, response: Response): Promise<void> {
    await processRequestBody(request, response, schemas.user_register, users.registerUser);
}

export async function login(request: Request, response: Response): Promise<void> {
    await processRequestBody(request, response, schemas.user_login, users.loginUser);
}

export async function logout(request: Request, response: Response): Promise<void> {
    const token = request.headers["x-authorization"] as string;
    if (token === undefined) {
        Logger.warn("Unauthorized: No token provided!");
        response.statusMessage = "Unauthorized: No token provided!";
        response.status(401).send();
        return;
    }
    const [status, message] = await users.logoutUser(token);
    Logger.info(message);
    response.statusMessage = message;
    response.status(status).send();
}

export async function view(request: Request, response: Response): Promise<void> {
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

export async function update(request: Request, response: Response): Promise<void> {
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
