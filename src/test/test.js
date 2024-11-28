//compararemos el nivel de enrutamiento posible en Node.js en comparacion a Express.js

const http = require('http');
const cursos = require('./cursos');
// const {infoCursos} = require('./cursos');

//luego de importar la "base de datos" procedemos a crear un servidor como lo vimos previamente

const servidor = http.createServer((req, res) => {
    //estraemos la propiedad del metodo que recibimos de la peticion con una sintaxis de des-estrcuturacion
    const { method } = req;
    const metodo = req.method;

    switch (method) {
        case 'GET':
            return manejarSolicitudGET(req, res)
        case 'POST':
            return manejarSolicitudPOST(req, res)
        default:
            // console.log('El metodo usado no puede ser manejado por el servidor: ', method);
            res.statusCode = 501;
            console.log(res.statusCode);
            res.end(`El metodo usado no puede ser manejado por el servidor: ${method}`)
    }
});

function manejarSolicitudGET(req, res) {
    const path = req.url;

    if (path === '/') {
        //tambien es posible modificar la cabecera de la respuesta
        res.writeHead(200, { 'Content-type': 'application/json' })

        //el codigo de estado de toda respuesta cumplida sera de 200, por lo que no hay que asignarlo a la fuerza, en cuanto a los demas si toca.
        //res.statusCode = 200;
        console.log(res.statusCode);
        return res.end('Bienvenidos a mi primer servidor y API creados con Node.js');
    } else if (path === '/cursos') {
        //res.statusCode = 200;
        console.log(res.statusCode);
        return res.end(JSON.stringify(cursos.infoCursos))
    } else if (path === '/cursos/programacion') {
        //res.statusCode = 200;
        console.log(res.statusCode);
        return res.end(JSON.stringify(cursos.infoCursos.programacion))
    }
    res.statusCode = 404;
    //ponemos el console.log() al final de todos los procesos y no al comienzo, porque entonces seria siempre 200, pero por los return dentro de los condicionales tocaria colocar tambien el console.log dentro de ellos.
    console.log(res.statusCode);
    res.end('El recurso solicitado no existe')
}

function manejarSolicitudPOST(req, res) {
    const path = req.url;
    console.log(res.statusCode);
    //en node procesar el cuerpo de una solicitud requiere varias lineas de codigo, normalmente se hace con express que es mas sencillo.
    if (path === '/cursos/programacion') {
        //res.statusCode = 200;
        // se agrega un return a todos los res.end para evitar algun problema con que el codigo siga ejecutandose, ademas antes del return del post vendria un proceso que efectuara el POST en la base de datos
        //definimos una variable para almacenar el cuerpo
        let cuerpo = '';
        //se crra un evento, con el nombre predefinido data. tenemos elcontenido de la solicitud, la convertimos a una cadena de caracteres y la agregamos a la variable llamada cuerpo
        req.on('data', contenido => {
            cuerpo += contenido.toString();
        });

        //luego del proceso anterior de conversion, mostramos lo que tenemos en cuerpo
        req.on('end', () => {
            console.log(cuerpo);
            console.log(typeof cuerpo);
            //reasignamos el valor de cuerpo luego de convertirlo a un objeto de JavaScript
            cuerpo = JSON.parse(cuerpo)
            console.log(typeof cuerpo);
            console.log(cuerpo.titulo)

            return res.end('El servidor recibio una solicitud POST');
        })

        // return res.end('El servidor recibio una solicitud POST')
    }
}

const PUERTO = 3000;

servidor.listen(PUERTO, () => {
    console.log(`Servidor funcionando en puerto ${PUERTO} `)
})