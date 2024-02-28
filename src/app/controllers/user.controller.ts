import * as schemas from '../resources/schemas.json';
import * as users from '../models/user.model';
import {Request, Response} from "express";
import Logger from '../../config/logger';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';


const ajv = new Ajv({removeAdditional: 'all'});
addFormats(ajv);

const handler = async <Input, Output extends object | void>(
    request: Request,
    response: Response,
    schema: object,
    callback: (body: Input) => Promise<[number, string, Output]>
): Promise<Output> => {
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

const register = async (request: Request, response: Response): Promise<void> => {
    await handler(request, response, schemas.user_register, users.registerUser);
}

const login = async (request: Request, response: Response): Promise<void> => {
    await handler(request, response, schemas.user_login, users.loginUser);
}

const logout = async (request: Request, response: Response): Promise<void> => {
    try{
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

const view = async (request: Request, response: Response): Promise<void> => {
    try{
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

const update = async (request: Request, response: Response): Promise<void> => {
    try{
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

export {register, login, logout, view, update}