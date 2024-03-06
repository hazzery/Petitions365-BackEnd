import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import Logger from './logger';


dotenv.config();

const state = {
    pool: null as mysql.Pool | null
};

export async function connect(): Promise<void> {
    state.pool = mysql.createPool({
        connectionLimit: 100,
        multipleStatements: true,
        host: process.env.SENG365_MYSQL_HOST,
        user: process.env.SENG365_MYSQL_USER,
        password: process.env.SENG365_MYSQL_PASSWORD,
        database: process.env.SENG365_MYSQL_DATABASE,
        port: parseInt(process.env.SENG365_MYSQL_PORT || '3306', 10)
    });
    await state.pool.getConnection(); // Check connection
    Logger.info(`Successfully connected to database`);
    return;
}

export function getPool(): mysql.Pool | null {
    return state.pool;
}
