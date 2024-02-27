import * as schemas from '../resources/schemas.json';
import * as users from '../models/user.model';
import {Request, Response} from "express";
import Logger from '../../config/logger';
import Ajv, {JSONSchemaType} from 'ajv';
import addFormats from 'ajv-formats';


const ajv = new Ajv({removeAdditional: 'all'});
addFormats(ajv);

const handler = async <T>(req: Request, res: Response, schema: object, callback: (body: T) => any) => {
    try {
        const validator = ajv.compile<T>(schema);
        if (!validator(req.body)) {
            res.statusMessage = `Bad Request: ${ajv.errorsText(validator.errors)}`;
            res.status(400).send();
        } else {
            const result = await callback(req.body);
            res.statusMessage = "User has been registered!";
            res.status(201).send();
            return result;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const register = async (req: Request, res: Response): Promise<void> => {
    await handler(req, res, schemas.user_register, users.registerUser);
}

const login = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}