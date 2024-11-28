const http = require('http');
const url = require('url');
const connectDB = require('./database/db');
const UserModel = require('./models/userModel');
const jwt = require('jsonwebtoken');
const NoteModel = require('./models/noteModel');
require('dotenv').config(); //una vez en el index.js es suficiente para que se use en todo lo demas.

connectDB();

// palabra clave del token
const SECRET_KEY = process.env.JWT_SECRET || "secretkey12345"; // Usa una clave secreta segura

// Crear el servidor
const server = http.createServer(async (req, res) => {
    // Para ver las rutas de peticion
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    // Malditos cors
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // Para ver las peticiones
    console.log(`ejecutando ${req.method} en ${pathname}`)
    // Rutas
    // #16f registro
    if (req.method === 'POST' && pathname === '/register') {
        // Creamos el contenedor para guardar el cuerpo de la peticion.
        let body = '';

        // Leer datos del cuerpo de la solicitud
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                // Des-estructuramos el cuerpo
                const { userName, userEmail, userPassword } = JSON.parse(body);
                // Creamos el nuevo usuario
                const newUser = new UserModel({ userName, userEmail, userPassword });
                // Guardamos el nuevo usuario en DB
                await newUser.save();
                // Respondemos al cliente
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Usuario creado", serverInfo: newUser }));
            } catch (err) {
                console.error("Error al procesar JSON: register", err.message);
                // En caso de que el error sea el de key duplicated del DB
                if (err.code === 11000) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Correo ya registrado" }));
                } else {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Error al procesar JSON" }));
                }
            }
        });
        // Para que no coja la respuesta generica de abajo
        return
    }
    // #16f logueo
    if (req.method === 'POST' && pathname === '/login') {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { userEmail, userPassword } = JSON.parse(body);
                const loginUser = await UserModel.findOne({ userEmail })

                // Validaciones
                if (!loginUser) throw new Error("No existe este email");
                if (!(await loginUser.comparePassword(userPassword))) {
                    throw new Error("Contraseña no correcta");
                }
                // Creacion del token
                const token = jwt.sign({ userID: loginUser._id, email: loginUser.userEmail }, SECRET_KEY, {
                    expiresIn: "1h",
                });
                console.log("token enviado: ", token)
                // Devolvemos el token en respuesta
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Acceso permitido", serverInfo: token }));
            } catch (err) {
                console.error("Error al procesar JSON: Login", err.message);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        // Para que no coja la respuesta generica de abajo
        return
    }
    // #16f pedir informacion en casa
    if (req.method === "GET" && pathname === "/home") {
        const token = req.headers.authorization?.split(" ")[1]; // Leer el token del encabezado Authorization
        console.log("el token es: ", token)

        if (!token) {
            console.log("no hay token")
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Token no proporcionado" }));
        }

        try {
            // Verificar el token
            const decoded = jwt.verify(token, SECRET_KEY);
            console.log("Decoded JWT:", decoded);
            const userEmail = decoded.email;
            const logedUserInfo = await UserModel.findOne({ userEmail })
            console.log("logedUserInfo: ", logedUserInfo);
            const logedUserNotes = await NoteModel.find({ userEmail })
            console.log("logedUserNotes: ", logedUserNotes);


            // Acceso permitido y devolucion de la informacion
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Ruta protegida", serverInfo: { logedUserInfo, logedUserNotes } }));
        } catch (err) {
            console.log("token expirado o invalido")
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Token inválido o expirado" }));
        }
        // Para que no coja la respuesta generica de abajo
        return
    }
    // #16f enviar nueva nota de texto
    if (req.method === 'POST' && pathname === '/home') {
        const token = req.headers.authorization?.split(" ")[1]; // Leer el token del encabezado Authorization
        console.log("el token es: ", token)
        //almacenar variable del token
        let decoded;
        //validacion token
        if (!token) {
            console.log("no hay token")
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Token no proporcionado" }));
        }

        try {
            // Verificar el token
            decoded = jwt.verify(token, SECRET_KEY);
            console.log("Decoded JWT:", decoded);
            console.log("token verificado en home");
        } catch (err) {
            console.log("token invalido o caducado")
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Token inválido o expirado" }));
            return
        }

        // recibir informacion
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { userNote } = JSON.parse(body);
                console.log("la nota recibida: ", userNote)
                // Creamos y guardamos la nota
                const newNote = new NoteModel({
                    text: userNote,
                    userEmail: decoded.email
                });
                await newNote.save();
                console.log("nota creada y guardada en db")
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Nota creada", serverInfo: newNote }));
            } catch (err) {
                console.error("Error al procesar JSON: post home", err.message);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        // Para que no coja la respuesta generica de abajo
        return
    }

    // Respuesta generica para ver si funciona el backend
    res.end("estas en el backend");
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(PORT == 5000 ? `Servidor corriendo en http://localhost:${PORT}` : PORT);
});