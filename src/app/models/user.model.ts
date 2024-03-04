import {UserEdit, UserLogin, UserRegister} from "../types/requestBodySchemaInterfaces";
import {createSession, deleteSession, getUserId} from "../services/sessions";
import {compare, hash} from "../services/passwords";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";
import {FieldPacket} from "mysql2";


async function runSQL(sql: string): Promise<object[]> {
    const connection = await getPool()?.getConnection();
    if (connection === undefined) {
        throw new Error('Not connected to database!');
    }
    const [result] = await connection.query(sql);
    connection.release();
    return result as object[];
}

export async function registerUser(data: UserRegister): Promise<[number, string, object]> {
    const hashedPassword = await hash(data.password);
    try {
        const result = await runSQL(`INSERT INTO user (email, first_name, last_name, password)
                      VALUES ('${data.email}', '${data.firstName}', '${data.lastName}', '${hashedPassword}')`);
        const userId = (result as unknown as {insertId: number}).insertId;
        return [201, "User registered!", {userId}];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            Logger.warn(error.message);
            return [403, "Email address already in use", null];
        } else throw error;
    }
}

export async function loginUser(data: UserLogin): Promise<[number, string, object]> {
    const result = await runSQL(`SELECT id, password
                                 FROM user
                                 WHERE email = '${data.email}'`);
    const users = result as { id: number, password: string }[]
    if (users.length === 0) {
        return [401, "Email not registered", null];
    }
    if (await compare(data.password, users[0].password)) {
        return [200, "User logged in!", {userId: users[0].id, token: createSession(users[0].id)}];
    } else {
        return [401, "Incorrect password", null];
    }
}

export async function logoutUser(token: string): Promise<[number, string]> {
    if (deleteSession(token)) {
        return [200, "User logged out!"];
    } else {
        return [401, "Cannot log out if you are not logged in."];
    }
}

export async function viewUser(userId: number, token: string): Promise<[number, string, object]> {
    const result = await runSQL(`SELECT first_name, last_name, email
                                 FROM user
                                 WHERE id = ${userId}`);
    const users = result as { first_name: string, last_name: string, email: string }[]
    if (users.length === 0) {
        return [404, "User not found", null];
    }
    if (userId === getUserId(token)) {
        return [200, "", {firstName: users[0].first_name, lastName: users[0].last_name, email: users[0].email}];
    } else {
        return [200, "User found!", {firstName: users[0].first_name, lastName: users[0].last_name}];
    }
}

export async function updateUser(userId: number, token: string, data: UserEdit): Promise<[number, string, object]> {
    if (userId !== getUserId(token)) {
        return [403, "Unable to edit other users", null];
    }
    let fieldsToUpdate = '';
    if (data.email) {
        fieldsToUpdate += `email = ${data.email}`;
    }
    if (data.firstName) {
        fieldsToUpdate += `first_name = ${data.firstName}`;
    }
    if (data.lastName) {
        fieldsToUpdate += `last_name = ${data.lastName}`;
    }
    if (data.password) {
        if (!data.currentPassword) {
            return [403, "Please supply current password to update password.", null];
        }
        if (data.password === data.currentPassword) {
            return [403, "Password must not match current password", null];
        }
        const usersHashedPassword = await runSQL(`SELECT password
                                                  FROM user
                                                  WHERE id = ${userId}`)[0] as { password: string };
        if (await compare(data.currentPassword,))
    }
    const hashedPassword = await hash(data.password);
    try {
        await runSQL(`UPDATE user
                      SET email      = '${data.email}',
                          first_name = '${data.firstName}',
                          last_name  = '${data.lastName}',
                          password   = '${hashedPassword}'
                      WHERE id = ${userId}`);
        return [200, "User updated!", null];
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            Logger.warn(error.message);
            return [403, "Email address already in use", null];
        } else throw error;
    }
}