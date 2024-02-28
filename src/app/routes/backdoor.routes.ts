import {Express} from "express";

import * as backdoor from '../controllers/backdoor.controller';
import {rootUrl} from "./base.routes";


module.exports = (app: Express) => {
    app.route(rootUrl + '/reset')
        .post(backdoor.resetDb);

    app.route(rootUrl + '/resample')
        .post(backdoor.resample);

    app.route(rootUrl + '/reload')
        .post(backdoor.reload);

    app.route(rootUrl + '/executeSql')
        .post(backdoor.executeSql);
};
