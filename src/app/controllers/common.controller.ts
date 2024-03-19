import {Response} from "express";
import addFormats from "ajv-formats";
import Ajv from "ajv";

import Logger from "../../config/logger";


const ajv = new Ajv({removeAdditional: 'all'});
addFormats(ajv);


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

export async function respond(
    response: Response,
    callback: () => Promise<[number, string, object | void]>
): Promise<void> {
    const [status, message, result] = await callback();
    Logger.info(message);
    response.statusMessage = message;
    response.status(status).send(result);
}
