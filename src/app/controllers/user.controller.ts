import {Request, Response} from "express";
import addFormats from 'ajv-formats';
import Ajv from 'ajv';

import {authenticationToken, authoriseRequest, processRequestBody, respond, respondErrors} from './common.controller';
import {UserEdit} from "../types/requestBodySchemaInterfaces";
import * as schemas from '../resources/schemas.json';
import * as users from '../models/user.model';
import Logger from '../../config/logger';
import {getUserId} from "../services/sessions";


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
    const userId = parseInt(request.params.id, 10);
    if (isNaN(userId) || userId <= 0) {
        Logger.warn("Bad Request: Invalid user ID");
        response.statusMessage = "Bad Request: Invalid user ID";
        response.status(400).send();
        return;
    }
    const token = authenticationToken(request);
    let senderId;
    if (token !== undefined) {
        senderId = await getUserId(token);
    }
    const [status, message, user] = await users.viewUser(userId, senderId);
    response.statusMessage = message;
    response.status(status).send(user);
}

export async function update(request: Request, response: Response): Promise<void> {
    const authorise = async () => await authoriseRequest(authenticationToken(request), request.params.id);
    const userId = await respondErrors(response, authorise);
    if (userId === undefined) return;
    const editUser = async (body: UserEdit) => await users.updateUser(userId, body);
    const callback = async () => await processRequestBody(request.body, schemas.user_edit, editUser);
    await respond(response, callback);
}
