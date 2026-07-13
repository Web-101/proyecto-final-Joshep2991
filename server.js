const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const pool = require("./db/conexion");

const puerto = 3000;

const tipos = {
    ".html":"text/html",
    ".css":"text/css",
    ".js":"application/javascript",
    ".png":"image/png",
    ".jpg":"image/jpeg",
    ".jpeg":"image/jpeg",
    ".gif":"image/gif",
    ".json":"application/json"
};

const servidor = http.createServer(async function(req,res){
    let ruta = url.parse(req.url,true);
    console.log(`[${req.method}] ${ruta.pathname}`);

    // GET /api/peliculas
    if(ruta.pathname==="/api/peliculas" && req.method==="GET"){
        try{
            let peliculas = await pool.query("SELECT * FROM peliculas ORDER BY id");
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify(peliculas.rows));
        } catch(error){
            console.error(error);
            res.writeHead(500);
            res.end(JSON.stringify({error:"Error"}));
        }
        return;
    }

    // GET /api/peliculas/:id
    if(ruta.pathname.startsWith("/api/peliculas/") && req.method==="GET"){
        try{
            let id = ruta.pathname.split("/")[3];
            let pelicula = await pool.query("SELECT * FROM peliculas WHERE id=$1", [id]);
            if(pelicula.rows.length===0){
                res.writeHead(404);
                res.end();
                return;
            }
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify(pelicula.rows[0]));
        } catch(error){
            console.error(error);
            res.writeHead(500);
            res.end();
        }
        return;
    }

    // GET /api/funciones/:id
    if(ruta.pathname.startsWith("/api/funciones/") && req.method==="GET"){
        try{
            let id = ruta.pathname.split("/")[3];
            let funciones = await pool.query("SELECT * FROM funciones WHERE id_pelicula=$1 ORDER BY horario", [id]);
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify(funciones.rows));
        } catch(error){
            console.error(error);
            res.writeHead(500);
            res.end();
        }
        return;
    }

    // GET /api/asientos/:idFuncion
    if(ruta.pathname.startsWith("/api/asientos/") && req.method==="GET"){
        try{
            let idFuncion = ruta.pathname.split("/")[3];
            let consulta = await pool.query(
                "SELECT fila,columna,ocupado FROM asientos WHERE id_funcion=$1 ORDER BY fila,columna",
                [idFuncion]
            );
            let matriz=[];
            for(let i=0;i<8;i++){
                matriz[i]=[];
                for(let j=0;j<8;j++){
                    matriz[i][j]=0;
                }
            }
            consulta.rows.forEach(function(a){
                if(a.ocupado){
                    matriz[a.fila-1][a.columna-1]=1;
                }
            });
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify({matriz:matriz}));
        } catch(error){
            console.error(error);
            res.writeHead(500);
            res.end();
        }
        return;
    }

    // POST /api/reservar
    if(ruta.pathname === "/api/reservar" && req.method === "POST") {
        let decoder = new StringDecoder("utf8");
        let datos = "";

        req.on("data", function (parte) {
            datos += decoder.write(parte);
        });

        req.on("end", async function () {
            datos += decoder.end();
            console.log("Datos recibidos en /api/reservar:", datos);

            try {
                let reserva = JSON.parse(datos);
                let funcion = await pool.query(
                    "SELECT id FROM funciones WHERE id = $1",
                    [reserva.idFuncion]
                );

                if(funcion.rows.length === 0){
                    res.writeHead(404);
                    res.end(JSON.stringify({ correcto: false, mensaje: "Funcion no encontrada" }));
                    return;
                }

                let idFuncion = funcion.rows[0].id;
                let resultado = await pool.query(
                    `INSERT INTO reservas (id_funcion, nombre, correo, telefono)
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    [idFuncion, reserva.nombre, reserva.correo, reserva.telefono || '']
                );

                for (let i = 0; i < reserva.asientos.length; i++) {
                    await pool.query(
                        `UPDATE asientos SET ocupado = true WHERE id_funcion = $1 AND fila = $2 AND columna = $3`,
                        [idFuncion, reserva.asientos[i].fila + 1, reserva.asientos[i].columna + 1]
                    );
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ correcto: true }));

            } catch (error) {
                console.error("Error en /api/reservar:", error);
                res.writeHead(500);
                res.end(JSON.stringify({ correcto: false, mensaje: error.message }));
            }
        });
        return;
    }

    // Resolucion automatica de rutas estaticas (HTML, CSS, JS, Imagenes)
    let archivo;
    let rutaArchivo = decodeURIComponent(ruta.pathname);
    if (rutaArchivo.startsWith("/")) {
        rutaArchivo = rutaArchivo.substring(1);
    }

    if (rutaArchivo === "" || rutaArchivo === "/") {
        archivo = path.join(__dirname, "public", "html", "Index.html");
    } else if (path.extname(rutaArchivo) === ".html") {
        // Si piden un HTML, buscarlo en la subcarpeta html/
        archivo = path.join(__dirname, "public", "html", path.basename(rutaArchivo));
    } else if (path.extname(rutaArchivo) === ".css") {
        // Si piden un CSS, buscarlo en la subcarpeta css/
        archivo = path.join(__dirname, "public", "css", path.basename(rutaArchivo));
    } else {
        // Para JS, imagenes, etc., buscar normal en public/
        archivo = path.join(__dirname, "public", rutaArchivo);
    }

    fs.readFile(archivo, function(error, contenido){
        if (error) {
            console.log("Archivo no encontrado:", archivo);
            res.writeHead(404);
            res.end("Archivo no encontrado");
            return;
        }
        let extension = path.extname(archivo);
        res.writeHead(200, {
            "Content-Type": tipos[extension] || "text/plain"
        });
        res.end(contenido);
    });
});

servidor.listen(puerto, function(){
    console.log(`Servidor corriendo en http://localhost:${puerto}`);
});