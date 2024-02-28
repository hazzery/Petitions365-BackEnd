import {Express} from "express";

import * as userImages from '../controllers/user.image.controller';
import * as user from '../controllers/user.controller';
import {rootUrl} from "./base.routes";

module.exports = (app: Express) => {
    app.route(rootUrl + '/users/register')
        .post(user.register);

    app.route(rootUrl + '/users/login')
        .post(user.login);

    app.route(rootUrl + '/users/logout')
        .post(user.logout);

    app.route(rootUrl + '/users/:id')
        .get(user.view)
        .patch(user.update);

    app.route(rootUrl + '/users/:id/image')
        .get(userImages.getImage)
        .put(userImages.setImage)
        .delete(userImages.deleteImage)
}
