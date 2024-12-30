# practice-notepad-backend
Este repositorio contiene el backend de una aplicación web de Bloc de notas (notepad), con creación de cuentas de usuario, CRUD de notas, validaciones de usuarios y envió de correos.

## Descripción 
En este repositorio están lo servicios necesarios para que la aplicación funcione correctamente:
- Creación de usuario, envió de correo de confirmación, recuperación de cuenta e ingreso a la pagina principal.
- CRUD de notas, desde la pestaña de home se realizan las peticiones para recibir todas las notas, crear notas nuevas, editar y eliminar dichas notas
- Para las sesiones se trabajo con JWT, en un sistema stateless para simplificar el proyecto.
- Base de datos de mongoDB, usando Mongoose, se utilizaron 2 modelos únicamente, usuario y notas.
- Servidor HTTP usando NodeJS puro, no se implementó ExpressJS. Tiene cors, preflights y enrutado básicos.
- Para hashear las contraseñas se utilizó bcryptjs, para los id únicos nanoid, y para usar variables de entorno la librería de dotenv.

## Tecnologías y dependencias
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

## Instalación 
1. Clona el repositorio en la rama main: https://github.com/josexdjose14/practice-notepad-backend.git
2. verifica las variables de entorno, ej:
* MONGO_URI
* JWT_SECRET
* EMAIL_USER
* EMAIL_PASSWORD
* BASE_URL = http://localhost:5000  #solo en dev.
4. Instala todas las dependencias: npm install
5. Ejecuta el Proyecto: npm run start
