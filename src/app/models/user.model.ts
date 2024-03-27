import {ResultSetHeader, RowDataPacket} from "mysql2";

import {UserEdit, UserLogin, UserRegister} from "../types/requestBodySchemaInterfaces";
import {createSession, deleteSession, getUserId} from "../services/sessions";
import {compare, hash} from "../services/passwords";
import Logger from "../../config/logger";
import {runSQL} from "../../config/db";


export async function registerUser(data: UserRegister): Promise<[number, string, object | void]> {
    const hashedPassword = await hash(data.password);
    try {
        const result = await runSQL<ResultSetHeader>(
            `INSERT INTO user (email, first_name, last_name, password)
             VALUES ('${data.email}', '${data.firstName}', '${data.lastName}', '${hashedPassword}');`
        );
        const userId = result.insertId;
        return [201, "User registered!", {userId}];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            Logger.warn(error.message);
            return [403, "Email address already in use", void 0];
        } else throw error;
    }
}

export async function loginUser(data: UserLogin): Promise<[number, string, object | void]> {
    interface User extends RowDataPacket {
        id: number,
        password: string
    }

    const [user] = await runSQL<User[]>(
        `SELECT id, password
         FROM user
         WHERE email = '${data.email}';`
    );
    if (user === undefined) {
        return [401, "Email not registered", void 0];
    }
    if (await compare(data.password, user.password)) {
        return [200, `User ${user.id} logged in!`, {userId: user.id, token: await createSession(user.id)}];
    } else {
        return [401, "Incorrect password", void 0];
    }
}

export async function logoutUser(token: string): Promise<[number, string]> {
    if (await deleteSession(token)) {
        return [200, "User logged out!"];
    } else {
        return [401, "Cannot log out if you are not logged in."];
    }
}

export async function viewUser(userId: number, senderId: number | undefined): Promise<[number, string, object | void]> {
    interface User extends RowDataPacket {
        first_name: string,
        last_name: string,
        email: string
    }

    const [user] = await runSQL<User[]>(
        `SELECT first_name, last_name, email
         FROM user
         WHERE id = ${userId};`
    );
    if (user === undefined) {
        return [404, "User not found", void 0];
    }
    if (userId === senderId) {
        return [200, "OK", {firstName: user.first_name, lastName: user.last_name, email: user.email}];
    } else {
        return [200, "User found!", {firstName: user.first_name, lastName: user.last_name}];
    }
}

export async function updateUser(userId: number, data: UserEdit): Promise<[number, string, object | void]> {
    const fieldsToUpdate: string[] = [];
    if (data.email) {
        fieldsToUpdate.push(`email = '${data.email}'`);
    }
    if (data.firstName) {
        fieldsToUpdate.push(`first_name = '${data.firstName}'`);
    }
    if (data.lastName) {
        fieldsToUpdate.push(`last_name = '${data.lastName}'`);
    }
    if (data.password) {
        if (!data.currentPassword) {
            return [403, "Please supply current password to update password.", void 0];
        }
        if (data.password === data.currentPassword) {
            return [403, "Password must not match current password", void 0];
        }

        interface User extends RowDataPacket {
            password: string
        }

        const [user] = await runSQL<User[]>(
            `SELECT password
             FROM user
             WHERE id = ${userId};`
        );
        if (await compare(data.currentPassword, user.password)) {
            fieldsToUpdate.push(`password = '${await hash(data.password)}'`);
        } else {
            return [403, "Incorrect password", void 0];
        }
    } else if (data.currentPassword) {
        return [403, "Please supply new password to update password.", void 0];
    }
    if (fieldsToUpdate.length === 0) {
        return [400, "No fields to update", void 0];
    }
    try {
        await runSQL(
            `UPDATE user
             SET ${fieldsToUpdate.join(', ')}
             WHERE id = ${userId};`
        );
        return [200, "User updated!", void 0];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            Logger.warn(error.message);
            return [403, "Email address already in use", void 0];
        } else throw error;
    }
}