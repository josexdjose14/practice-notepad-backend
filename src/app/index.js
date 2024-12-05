const http = require('http');
const url = require('url');
const connectDB = require('./database/db');
const UserModel = require('./models/userModel');
const jwt = require('jsonwebtoken');
const NoteModel = require('./models/noteModel');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const nodemailer = require('nodemailer')
require('dotenv').config(); //una vez en el index.js es suficiente para que se use en todo lo demas.

connectDB();

// palabra clave del token
const SECRET_KEY = process.env.JWT_SECRET || "secretkey12345";
const SECRET_KEY2 = "recuperarContraseña"

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


    // Manejo del preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        });
        return res.end();
    }
    // Rutas definidas
    // #16f Probar funcionamiento
    if (req.method === 'GET' && pathname === '/') {
        res.end("estas en el backend");
        return
    }
    // #16f /register
    if (req.method === 'POST' && pathname === '/register') {
        // Creamos el contenedor para guardar el cuerpo de la peticion.
        let body = '';

        // Leer datos del cuerpo de la solicitud, transformarlos y guardarlos
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                // Des-estructuramos el cuerpo
                const { userName, userEmail, userPassword } = JSON.parse(body);
                // Creamos el nuevo usuario
                const userToken = nanoid(9);
                const newUser = new UserModel({ userName, userEmail, userPassword, userToken });
                // Guardamos el nuevo usuario en DB
                await newUser.save();
                // Enviamos el correo
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD,
                    },
                });

                const confirmURL = `${process.env.BASE_URL}/confirm?userToken=${userToken}`;

                const mailOptions = {
                    from: `notepad project <${process.env.EMAIL_USER}>`,
                    to: userEmail,
                    subject: 'Confirma tu cuenta',
                    html: `
                        <p>Hola ${userName},</p>
                        <p>Gracias por registrarte. Por favor, confirma tu cuenta haciendo clic en el siguiente enlace:</p>
                        <a href="${confirmURL}">${confirmURL}</a>
                    `,
                };

                await transporter.sendMail(mailOptions);
                console.log('Correo de confirmación enviado a:', userEmail);

                // Respondemos al cliente
                console.log("nuevo usuario creado")
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Usuario creado" }));
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
    // #16f /login
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
                if (!loginUser.isAccountActivated) throw new Error("Cuenta no verificada");
                // Creacion del token
                const token = jwt.sign({ userID: loginUser._id, email: loginUser.userEmail }, SECRET_KEY, {
                    expiresIn: "1h",
                });
                // Devolvemos el token en respuesta
                console.log("se ha logueado una persona")
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

        if (!token) {
            console.log("no hay token")
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Token no proporcionado" }));
        }

        try {
            // Verificar el token
            const decoded = jwt.verify(token, SECRET_KEY);
            console.log("Decoded JWT:", decoded);
            const userEmail = decoded.email;
            const logedUserInfo = await UserModel.findOne({ userEmail })
            const logedUserNotes = await NoteModel.find({ userEmail })
            let userName = logedUserInfo.userName;

            // Acceso permitido y devolucion de la informacion
            console.log("todo funciona en get + home")
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Ruta protegida", serverInfo: { userName, logedUserNotes } }));
        } catch (err) {
            console.log("token expirado o invalido")
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Token inválido o expirado" }));
        }
        // Para que no coja la respuesta generica de abajo
        return
    }
    // #16f crear/editar nota
    if (req.method === 'POST' && pathname === '/home') {
        // Verificacion de token
        const token = req.headers.authorization?.split(" ")[1]; // Leer el token del encabezado Authorization
        // Almacenar variable del token
        let decoded;
        // Verificamos si hay token
        if (!token) {
            console.log("no hay token")
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Token no proporcionado" }));
        }
        // Decodificamos el token
        try {
            decoded = jwt.verify(token, SECRET_KEY);
            console.log("Decoded JWT:", decoded);
            console.log("token verificado en home");
        } catch (err) {
            console.log("token invalido o caducado en home")
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Token inválido o expirado" }));
            return
        }
        //En caso de que el token este bien, se procede con lo demas
        // Capturamos la query
        const { editID } = query; // Capturamos la query `edit`

        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        if (editID) {
            console.log("La petición es para editar una nota");

            req.on('end', async () => {
                try {
                    const { userNote } = JSON.parse(body);

                    // Verificar si existe la nota
                    const note = await NoteModel.findById(editID);
                    if (!note) {
                        console.log("nota no encontrada")
                        res.writeHead(404, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ error: "Nota no encontrada" }));
                    }

                    // Actualizar la nota
                    note.text = userNote;
                    await note.save();
                    console.log("nota corregida")
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Nota actualizada", serverInfo: note }));
                } catch (err) {
                    console.error("Error al actualizar la nota:", err.message);
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Error al actualizar la nota" }));
                }
            });
        } else {
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
        }
        // Para que no coja la respuesta generica de abajo
        return
    }
    // #16f borrar nota
    if (req.method === 'DELETE' && pathname === '/home') {
        // Verificacion de token
        const token = req.headers.authorization?.split(" ")[1];
        let decoded;
        if (!token) {
            console.log("no hay token")
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Token no proporcionado" }));
        }
        try {
            decoded = jwt.verify(token, SECRET_KEY);
            console.log("Decoded JWT:", decoded);
            console.log("token verificado en home");
        } catch (err) {
            console.log("token invalido o caducado en home")
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Token inválido o expirado" }));
            return
        }
        // verificacion query
        const { deleteID } = query;
        console.log("La petición es para ELIMINAR una nota");
        try {

            const objectId = new mongoose.Types.ObjectId(deleteID); // Crear ObjectId correctamente
            const result = await NoteModel.findOneAndDelete({ _id: objectId });

            if (!result) {
                console.log("Nota no encontrada");
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Nota no encontrada" }));
            }

            console.log("Nota eliminada:", result);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Nota eliminada", serverInfo: deleteID }));
        } catch (err) {
            console.error("Error al eliminar la nota:", err.message);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Error al eliminar la nota" }));

        }
        return
    }
    // #16f validar cuenta
    if (req.method === 'GET' && pathname === '/confirm') {
        const { userToken } = query;
        try {
            const loginUser = await UserModel.findOne({ userToken })
            if (loginUser.isAccountActivated) {
                console.log("el usuario ya estaba validado")
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify("No es necesario validar nuevamente al usuario"));
            } else {
                loginUser.isAccountActivated = true;
                await loginUser.save();
                console.log("usuario verificado")
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify("Usuario verificado, y cierra la pestaña por favor"));
            }
        } catch (error) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify(`Hubo un problema al intentar validar el usuario, por favor contactar a ${process.env.EMAIL_USER}`));
        }
        return
    }
    // #16f verificar correo
    if (req.method === 'GET' && pathname === '/recover') {
        const { userEmail } = query;
        console.log(userEmail)
        try {
            // verificamos si existe el usuario
            const loginUser = await UserModel.findOne({ userEmail })
            if (!loginUser) throw new Error("No existe este email");
            // creamos el token a enviar
            const token = jwt.sign({ userID: loginUser._id, email: loginUser.userEmail }, SECRET_KEY2, {
                expiresIn: "10m",
            });
            // enviamos el token al correo
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: `notepad project <${process.env.EMAIL_USER}>`,
                to: userEmail,
                subject: 'Recuperar tu cuenta',
                html: `
                        <p>Hola ${loginUser.userName},</p>
                        <p>Copia el codigo debajo y pegalo en el formulario de las contraseñas</p>
                        <p> ${token} </p>
                    `,
            };

            await transporter.sendMail(mailOptions);
            console.log('Correo de recuperacion enviado a:', userEmail);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Código de verificación enviado" }));
        } catch (err) {
            console.error("Error al procesar JSON: recover GET", err.message);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
        }
        return
    }
    // #16f cambiar contraseña
    if (req.method === 'POST' && pathname === '/recover') {
        // Verificacion de token
        // const token = req.headers.authorization?.split(" ")[1]; // Leer el token del encabezado Authorization
        // Almacenar variable del token
        const token = req.headers.authorization.slice(8, 1000).trim();
        console.log('el token atrapado es', token)
        let decoded;
        // Verificamos si hay token
        if (!token) {
            console.log("no hay token")
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Token no proporcionado" }));
        }
        // Decodificamos el token
        try {
            decoded = jwt.verify(token, SECRET_KEY2);
            console.log("Decoded JWT:", decoded);
            console.log("token verificado en recover");
        } catch (err) {
            console.log("token invalido o caducado en home")
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Token inválido o expirado" }));
            return
        }
        //En caso de que el token este bien, se procede con lo demas  

        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {

            try {
                const { userPassword } = JSON.parse(body);
                let userEmail = decoded.email
                const loginUser = await UserModel.findOne({ userEmail })
                // Validaciones
                if (!loginUser) throw new Error("No existe este email");
                loginUser.userPassword = userPassword
                await loginUser.save()
                console.log("contraseña cambiada")
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Cambio realizado con exito" }));

            } catch (err) {
                console.error("Error al actualizar la nota:", err.message);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Error al intentar cambiar la contraseña" }));
            }
        })
        return // de seguridad
    }
    // Rutas no definidas
    console.log("alguien hizo una peticion rara")
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Ruta no encontrada" }));
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(PORT == 5000 ? `Servidor corriendo en http://localhost:${PORT}` : PORT);
});