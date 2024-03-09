import {Request, Response} from "express";
import addFormats from "ajv-formats";
import Ajv from "ajv";

import Logger from "../../config/logger";
import {getUserId} from "../services/sessions";


interface Options {
    userId?: boolean,
    bodySchema?: object,
    authentication?: boolean,
    authorisation?: boolean
}


const ajv = new Ajv({removeAdditional: 'all'});
addFormats(ajv);


function authenticationToken(request: Request): string | undefined{
    return request.headers["x-authorization"] as string | undefined;
}

function contentType(request: Request): string {
    return request.headers['content-type'] ?? '';
}

async function processRequestBody<Input>(
    request: Request,
    response: Response,
    schema: object,
    callback: (body: Input) => Promise<[number, string, object | void]>
): Promise<void> {
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
        }
    } catch (err) {
        Logger.error(err);
        response.statusMessage = "Internal Server Error";
        response.status(500).send();
    }
}

async function processRequest<Input>(
    request: Request,
    callback: (body: Input) => Promise<[number, string, object | void]>,
    options: Options
): Promise<[number, string, object | void]> {
    try {
        const token = authenticationToken(request);
        if ((options.authentication !== undefined || options.authorisation !== undefined) && token === undefined) {
            return [401, "x-authorization header not provided", void 0];
        }
        if (options.userId !== undefined || options.authorisation !== undefined) {
            const userId = parseInt(request.params.id, 10);
            if (isNaN(userId)) {
                return [400, "Malformed user ID in url", void 0];
            }
            if (options.authorisation !== undefined && token !== undefined && userId !== getUserId(token)) {
                return [403, "Unauthorised", void 0]
            }
        }
        if (options.bodySchema !== undefined) {
            const validator = ajv.compile(options.bodySchema);
            if (!validator(request.body)) {
                return [400, `Bad Request: ${ajv.errorsText(validator.errors)}`, void 0];
            }
        }
        return await callback(request.body);
    } catch (error) {
        return [500, "Internal Server Error", void 0];
    }
}

async function respond(
    request: Request,
    response: Response,
    callback: (body: number) => Promise<[number, string, object | void]>,
    options: Options
): Promise<void> {
    const [status, message, result] = await processRequest(request, callback, options);
    Logger.log(status >= 300 ? 'error': 'info', message);
    response.statusMessage = message;
    response.status(status).send(result);
}
