# Petitions365 REST API

This project was created as an assignment for my 3rd year Web Computing course.
The project is a REST API that allows users to create, read, update, and delete petitions.
The API is built using Node.js and Express, and uses a MySQL database to store data.
We had to implement the api to conform to the specification provided in the [specification document](api_spec.yaml).
The code in the `middleware`, `routes`, and `resources` directories was provided by the course staff.
The project was tested using Postman, with the tests stored in the `postman` directory.

## Running locally

1. Use `npm install` to populate the `node_modules/` directory with up-to-date packages
2. Create a file called `.env`, following the instructions in the section below
3. Run `npm run start` or `npm run debug` to start the server

The server will be accessible on `localhost:4941`

### `.env` file

Create a file named exactly `.env` in the root directory of this project including the following information:
```
MYSQL_HOST_URL={your host url}
MYSQL_USERNAME={your username}
MYSQL_PASSWORD={your password}
MYSQL_DATABASE_NAME={your database name}
```
