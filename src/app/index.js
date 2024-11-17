const http = require('http');
const url = require('url');
const mongoose = require('mongoose');
const userModel = require('./models/userModel');
const connectDB = require('./database/db');
require('dotenv').config(); //una vez en el index.js es suficiente para que se use en todo lo demas.

connectDB();

// Crear el servidor
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    console.log(req.body)
});

// Iniciar el servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(PORT == 3000 ? `Servidor corriendo en http://localhost:${PORT}` : PORT);
});
