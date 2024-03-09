import {Request, Response} from "express";

import * as schemas from '../resources/schemas.json';
import * as users from '../models/user.model';
import Logger from '../../config/logger';


export async function register(request: Request, response: Response): Promise<void> {
    await processRequestBody(request, response, schemas.user_register, users.registerUser);
}

export async function login(request: Request, response: Response): Promise<void> {
    await processRequestBody(request, response, schemas.user_login, users.loginUser);
}

export async function logout(request: Request, response: Response): Promise<void> {
    const token = authorisation(request);
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
    const currentUser = authorisation(request);
    const [status, message, user] = await users.viewUser(userId, currentUser);
    response.statusMessage = message;
    response.status(status).send(user);
}

export async function update(request: Request, response: Response): Promise<void> {
    const token = authorisation(request)
    if (!token) {
        Logger.warn("Bad Request: No authorization token");
        response.statusMessage = "Unauthenticated: No authorization token";
        response.status(401).send();
        return;
    }
    const editUser = (body: object) => users.updateUser(Number(request.params.id), token, body);
    await processRequestBody(request, response, schemas.user_edit, editUser);
}
