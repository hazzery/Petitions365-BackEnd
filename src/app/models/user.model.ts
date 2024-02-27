import {getPool} from "../../config/db";
import {UserRegister} from "../types/schemaInterfaces";

const runSQL = async (sql: string) => {
    const connection = await getPool()?.getConnection();
    if (connection === undefined) {
        throw new Error('Not connected to database!');
    }
    const result = await connection.query(sql);
    connection.release();
    return result
}

const registerUser = async (data: UserRegister) => {
    return await runSQL(`INSERT INTO users (email, first_name, last_name, password)
                             VALUES (${data.email}, ${data.firstName}, ${data.lastName}, ${data.password})`);
}

export {registerUser};