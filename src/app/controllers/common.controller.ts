import {Request, Response} from "express";
import addFormats from "ajv-formats";
import Ajv from "ajv";

import {getUserId} from "../services/sessions";
import Logger from "../../config/logger";


const ajv = new Ajv({removeAdditional: 'all', strict: true});
addFormats(ajv);

ajv.addFormat("integer", {
    type: "string",
    validate: /^[0-9]+$/
});


export function contentType(request: Request): string {
    return request.headers['content-type'] ?? '';
}

export function authenticationToken(request: Request): string | undefined {
    return request.headers["x-authorization"] as string | undefined;
}

export async function authoriseRequest(
    token: string | undefined,
    requestedUserIdString: string | undefined,
): Promise<[number, string, number | void]> {
    if (token === undefined) {
        return [401, "Unauthenticated: No x-authorization header provided", void 0];
    }
    const requesterUserId = await getUserId(token);
    if (requesterUserId === undefined) {
        return [401, "Unauthenticated: Invalid x-authorization header provided", void 0];
    }
    if (requestedUserIdString === undefined) {
        return [400, "Bad Request: No user ID provided", void 0];
    }
    const requestedUserId = parseInt(requestedUserIdString, 10);
    if (isNaN(requestedUserId) || requestedUserId <= 0) {
        return [400, "Bad Request: Invalid user ID", void 0];
    }
    if (requesterUserId !== requestedUserId) {
        return [403, "Forbidden: You do not have permission to access this resource", void 0];
    }
    return [200, "OK", requestedUserId];
}

export async function processRequestBody<Input>(
    body: object,
    schema: object,
    callback: (body: Input) => Promise<[number, string, object | void]>
): Promise<[number, string, object | void]> {
    try {
        const validator = ajv.compile<Input>(schema);
        if (!validator(body)) {
            return [400, `Bad Request: ${ajv.errorsText(validator.errors)}`, void 0];
        } else {
            return await callback(body);
        }
    } catch (err) {
        return [500, "Internal Server Error", void 0];
    }
}

export async function respondErrors<T extends number | void>(
    response: Response, callback: () => Promise<[number, string, T]>
): Promise<T> {
    const [status, message, result] = await callback();
    if (status >= 400) {
        Logger.info(message);
        response.statusMessage = message;
        response.status(status).send();
    }
    return result;
}

export async function respond(
    response: Response,
    callback: () => Promise<[number, string, object | void]>
): Promise<void> {
    const [status, message, result] = await callback();
    Logger.info(message);
    response.statusMessage = message;
    response.status(status).send(result);
}

export async function respondImage(
    response: Response,
    callback: () => Promise<[number, string, object | void, string]>
): Promise<void> {
    const [status, message, result, imageType] = await callback();
    let mimeType = 'text/plain';
    if (result !== undefined && imageType.length >= 0) {
        mimeType = imageType;
        if (mimeType === 'image/jpg') {
            mimeType = 'image/jpeg';
        }
    }
    Logger.info(message);
    response.statusMessage = message;
    response.contentType(mimeType);
    response.status(status).send(result);
}
