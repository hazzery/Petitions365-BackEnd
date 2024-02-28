import {OkPacket, ResultSetHeader, RowDataPacket} from "mysql2";
import mysql from "mysql2/promise";
import fs from 'mz/fs';

import * as defaultUsers from "../resources/default_users.json";
import * as passwords from "../services/passwords";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";


const defaultPhotoDirectory = './storage/default/';
const imageDirectory = './storage/images/';

export async function resetDb(): Promise<any> {
    const promises = [];

    const sql = await fs.readFile('src/app/resources/create_database.sql', 'utf8');
    Logger.info("Resetting Database...");
    promises.push(getPool()?.query(sql));  // sync call to recreate DB

    const files = await fs.readdir(imageDirectory);
    for (const file of files) {
        if (file !== '.gitkeep') promises.push(fs.unlink(imageDirectory + file));  // sync call to delete photo
    }

    return Promise.all(promises);  // async wait for DB recreation and images to be deleted
}

export async function loadData(): Promise<any> {
    await populateDefaultUsers();
    try {
        const sql = await fs.readFile('src/app/resources/resample_database.sql', 'utf8');
        await getPool()?.query(sql);
    } catch (err) {
        Logger.error((err as mysql.Query).sql);
        throw err;
    }

    const defaultPhotos = await fs.readdir(defaultPhotoDirectory);
    const promises = defaultPhotos.map((file: string) => fs.copyFile(defaultPhotoDirectory + file, imageDirectory + file));
    return Promise.all(promises);
}

/**
 * Populates the User table in the database with the given data. Must be done here instead of within the
 * `resample_database.sql` script because passwords must be hashed according to the particular implementation.
 * @returns {Promise<void>}
 */
async function populateDefaultUsers(): Promise<void> {
    const createSQL = 'INSERT INTO `user` (`email`, `first_name`, `last_name`, `image_filename`, `password`) VALUES ?';

    const properties = defaultUsers.properties;
    let usersData = defaultUsers.usersData;

    // Shallow copy all the user arrays within the main data array
    // Ensures that the user arrays with hashed passwords won't persist across multiple calls to this function
    usersData = usersData.map((user: any) => ([...user]));

    const passwordIndex = properties.indexOf('password');
    await Promise.all(usersData.map((user: any) => changePasswordToHash(user, passwordIndex)));

    try {
        await getPool()?.query(createSQL, [usersData]);
    } catch (err) {
        Logger.error((err as mysql.Query).sql);
        throw err;
    }
}

async function changePasswordToHash(user:any, passwordIndex:number) {
    user[passwordIndex] = await passwords.hash(user[passwordIndex]);
}

export async function executeSql(
    sql: string
): Promise<RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader> {
    try {
        const queryResult = await getPool()?.query(sql);
        if (queryResult) {
            return queryResult[0];
        }
    } catch (err) {
        Logger.error((err as mysql.Query).sql);
        throw err;
    }
    return [];
}
