import express from './config/express';
import Logger from './config/logger';
import {connect} from './config/db';


const app = express();
const port = process.env.PORT || 4941;

async function main() {
    try {
        await connect();
        app.listen(port, () => {
            Logger.info('Listening on port: ' + port)
        });
    } catch (err) {
        Logger.error('Unable to connect to MySQL: ' + err.message);
        process.exit(1);
    }
}

main().catch(err => Logger.error(err));
