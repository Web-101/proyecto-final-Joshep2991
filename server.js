var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var PUERTO = 3000;
var BASE = __dirname;
var PUBLIC = path.join(BASE, 'public');
var DATA_DIR = path.join(PUBLIC, 'data');

var mimes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.json': 'application/json'
};

function leerJSON(nombre) {
    var ruta = path.join(DATA_DIR, nombre);
    try {
        var contenido = fs.readFileSync(ruta, 'utf8');
        return JSON.parse(contenido);
    } catch (e) {
        return null;
    }
}

function guardarJSON(nombre, obj) {
    var ruta = path.join(DATA_DIR, nombre);
    fs.writeFileSync(ruta, JSON.stringify(obj, null, 4), 'utf8');
}

function obtenerAsientos(clave) {
    var todos = leerJSON('asientos.json') || {};
    var m = todos[clave];
    if (!m) {
        var filas = 8;
        var cols = 8;
        m = [];
        for (var f = 0; f < filas; f++) {
            m[f] = [];
            for (var c = 0; c < cols; c++) {
                m[f][c] = Math.random() < 0.3 ? 1 : 0;
            }
        }
        todos[clave] = m;
        guardarJSON('asientos.json', todos);
    }
    return m;
}

function actualizarAsientos(clave, lista) {
    var todos = leerJSON('asientos.json') || {};
    var m = todos[clave];
    if (!m) {
        m = obtenerAsientos(clave);
    }
    lista.forEach(function(item) {
        var f = item.fila;
        var c = item.columna;
        if (f >= 0 && f < m.length && c >= 0 && c < m[0].length) {
            m[f][c] = 1;
        }
    });
    todos[clave] = m;
    guardarJSON('asientos.json', todos);
    return m;
}

var servidor = http.createServer(function(req, res) {
    var parsed = url.parse(req.url, true);
    var ruta = decodeURIComponent(parsed.pathname);

    if (ruta.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (ruta === '/api/peliculas' && req.method === 'GET') {
            var lista = leerJSON('peliculas.json');
            if (lista) {
                res.writeHead(200);
                res.end(JSON.stringify(lista));
            } else {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'no se pudieron cargar' }));
            }
            return;
        }

        if (ruta.startsWith('/api/peliculas/') && req.method === 'GET') {
            var id = parseInt(ruta.split('/').pop());
            var todas = leerJSON('peliculas.json');
            if (todas) {
                var peli = todas.find(function(p) { return p.id == id; });
                if (peli) {
                    res.writeHead(200);
                    res.end(JSON.stringify(peli));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'no existe' }));
                }
            } else {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'error al leer' }));
            }
            return;
        }

        if (ruta.startsWith('/api/asientos/') && req.method === 'GET') {
            var idPeli = parseInt(ruta.split('/').pop());
            var horario = parsed.query.horario || '19:00';
            var clave = idPeli + '-' + horario;
            var m = obtenerAsientos(clave);
            res.writeHead(200);
            res.end(JSON.stringify({ matriz: m }));
            return;
        }

        if (ruta.startsWith('/api/horarios/') && req.method === 'GET') {
            var horarios = ["14:00", "16:30", "19:00", "21:30"];
            res.writeHead(200);
            res.end(JSON.stringify({ horarios: horarios }));
            return;
        }

        if (ruta === '/api/tickets' && req.method === 'POST') {
            var cuerpoT = '';
            req.on('data', function(chunk) { cuerpoT += chunk; });
            req.on('end', function() {
                try {
                    var data = JSON.parse(cuerpoT);
                    var tickets = leerJSON('tickets.json') || [];
                    var nuevoTicket = {
                        id: Date.now(),
                        idPelicula: data.idPelicula,
                        horario: data.horario || "19:00",
                        asientos: data.asientos,
                        fecha: new Date().toISOString()
                    };
                    tickets.push(nuevoTicket);
                    guardarJSON('tickets.json', tickets);
                    res.writeHead(200);
                    res.end(JSON.stringify({ mensaje: 'ticket guardado', ticket: nuevoTicket }));
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'error al guardar ticket' }));
                }
            });
            return;
        }

        if (ruta === '/api/usuario/historial' && req.method === 'GET') {
            var historial = leerJSON('tickets.json') || [];
            res.writeHead(200);
            res.end(JSON.stringify(historial));
            return;
        }

        if (ruta === '/api/reservar' && req.method === 'POST') {
            var cuerpo = '';
            req.on('data', function(chunk) { cuerpo += chunk; });
            req.on('end', function() {
                try {
                    var data = JSON.parse(cuerpo);
                    var idPeli = data.idPelicula;
                    var horario = data.horario || '19:00';
                    var clave = idPeli + '-' + horario;
                    var asientos = data.asientos;
                    
                    if (idPeli === undefined || !Array.isArray(asientos)) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'datos invalidos' }));
                        return;
                    }
                    var nueva = actualizarAsientos(clave, asientos);
                    res.writeHead(200);
                    res.end(JSON.stringify({ mensaje: 'ok', matriz: nueva }));
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'json malo' }));
                }
            });
            return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'api no encontrada' }));
        return;
    }

    var archivo = path.join(PUBLIC, ruta === '/' ? 'Proyect.html' : ruta);
    if (!path.extname(archivo)) {
        archivo += '.html';
    }
    var ext = path.extname(archivo);
    var tipo = mimes[ext] || 'application/octet-stream';

    fs.readFile(archivo, function(err, data) {
        if (err) {
            res.writeHead(404);
            res.end('404 - no encontrado');
            return;
        }
        res.writeHead(200, { 'Content-Type': tipo });
        res.end(data);
    });
});

servidor.listen(PUERTO, function() {
    console.log('Servidor en http://localhost:' + PUERTO);
});