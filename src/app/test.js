const http = require('http');
const url = require('url');
const mongoose = require('mongoose');
const userModel = require('./models/userModel');
const connectDB = require('./database/db');

connectDB();

// Crear el servidor
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    if (req.method === 'POST' && pathname === '/register') {
        let body = '';

        // Leer datos del cuerpo de la solicitud
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { name, email, password } = JSON.parse(body);
                const newUser = new userModel({ name, email, password });
                await newUser.save();

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Usuario creado', user: newUser }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else if (req.method === 'GET' && pathname === '/users') {
        try {
            const users = await User.find();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Ruta no encontrada' }));
    }
});

// Iniciar el servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(PORT == 3000 ? `Servidor corriendo en http://localhost:${PORT}` : PORT);
});
