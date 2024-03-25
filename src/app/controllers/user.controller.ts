import {Request, Response} from "express";
import addFormats from 'ajv-formats';
import Ajv from 'ajv';

import {authenticationToken, processRequestBody, respond} from './common.controller';
import {UserEdit} from "../types/requestBodySchemaInterfaces";
import * as schemas from '../resources/schemas.json';
import * as users from '../models/user.model';
import Logger from '../../config/logger';


const ajv = new Ajv({removeAdditional: 'all'});
addFormats(ajv);


export async function register(request: Request, response: Response): Promise<void> {
    const callback = async () => await processRequestBody(request.body, schemas.user_register, users.registerUser);
    await respond(response, callback);
}

export async function login(request: Request, response: Response): Promise<void> {
    const callback = async () => await processRequestBody(request.body, schemas.user_login, users.loginUser);
    await respond(response, callback);
}

export async function logout(request: Request, response: Response): Promise<void> {
    const token = authenticationToken(request);
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
    const userId = Number(request.params.id);
    if (isNaN(userId) || userId <= 0) {
        Logger.warn("Bad Request: Invalid user ID");
        response.statusMessage = "Bad Request: Invalid user ID";
        response.status(400).send();
        return;
    }
    const token = authenticationToken(request);
    if (token === undefined) {
        Logger.warn("Unauthorized: No token provided!");
        response.statusMessage = "Unauthorized: No token provided!";
        response.status(401).send();
        return;
    }
    const [status, message, user] = await users.viewUser(userId, token);
    response.statusMessage = message;
    response.status(status).send(user);
}

export async function update(request: Request, response: Response): Promise<void> {
    const token = authenticationToken(request)
    if (!token) {
        Logger.warn("Bad Request: No authorization token");
        response.statusMessage = "Unauthenticated: No authorization token";
        response.status(401).send();
        return;
    }
    const userId = parseInt(request.params.id, 10);
    if (isNaN(userId) || userId <= 0) {
        Logger.warn("Bad Request: Invalid user ID");
        response.statusMessage = "Bad Request: Invalid user ID";
        response.status(400).send();
        return;
    }
    const editUser = async (body: UserEdit) => await users.updateUser(userId, token, body);
    const callback = async () => await processRequestBody(request.body, schemas.user_edit, editUser);
    await respond(response, callback);
}
